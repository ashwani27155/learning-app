import { useState } from "react";
import toast from "react-hot-toast";
import { getAccessToken } from "../../../lib/api";
import { DEMO_MODE } from "@/lib/demoMode";
import {
  downloadTestSeriesTemplate, downloadTestSeriesTemplateCSV,
  parseTestSeriesExcel, type TestSeriesImportResult,
} from "../../../lib/excelUtils";

interface Props {
  seriesId: string;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportTestModal({ seriesId, onClose, onImported }: Props) {
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<TestSeriesImportResult | null>(null);
  const [parsing,   setParsing]   = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      const result = await parseTestSeriesExcel(f);
      setPreview(result);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to parse file");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const validQuestions = preview?.questions.filter(q => !q.error) ?? [];

  const handleImport = async () => {
    if (DEMO_MODE) { toast.error("Not available in demo mode"); return; }
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = getAccessToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1"}/admin/test-series/${seriesId}/tests/import-excel`,
        { method: "POST", body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Import failed");
      const { importedQuestionCount, errors } = data.data ?? {};
      if (errors?.length) {
        toast.success(`Test created with ${importedQuestionCount} questions — ${errors.length} row(s) skipped, see preview for details`, { duration: 6000 });
      } else {
        toast.success(`Test created with ${importedQuestionCount} questions!`);
      }
      onImported();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Create Test from Excel / CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-700">
            Upload a workbook with a "Test Settings" sheet and a "Questions" sheet to create a
            complete, gradeable test in one go. New questions go straight into this test as approved.
          </div>

          <div className="flex gap-3">
            <button onClick={() => downloadTestSeriesTemplate()} className="btn-ghost border border-gray-200 text-sm flex-1 justify-center">
              ⬇ Download Excel Template
            </button>
            <button onClick={() => downloadTestSeriesTemplateCSV()} className="btn-ghost border border-gray-200 text-sm flex-1 justify-center">
              ⬇ Download CSV Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload filled-in file</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="input-field"
            />
          </div>

          {parsing && <p className="text-sm text-gray-500">Parsing file…</p>}

          {preview && !parsing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold text-gray-900 truncate">{preview.settings.testTitle || "(missing)"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Test Title</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold text-gray-900">{preview.settings.duration ?? "-"} min</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Duration</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold text-emerald-700">{validQuestions.length}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Valid Questions</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <div className="text-sm font-bold text-red-600">{preview.errors.length}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Row Errors</div>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
                  ))}
                </div>
              )}

              {!preview.settings.testTitle && (
                <p className="text-xs text-amber-600 font-medium">⚠ Test Title (English) is required in the Test Settings sheet.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button
            onClick={handleImport}
            disabled={!preview || !preview.settings.testTitle || validQuestions.length === 0 || importing}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {importing ? "Creating…" : `Create Test (${validQuestions.length} questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}
