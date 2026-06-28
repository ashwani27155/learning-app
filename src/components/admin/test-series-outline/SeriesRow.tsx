import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown, ChevronRight, Edit2, Copy, Trash2, Zap, Plus, BarChart2, FileUp,
} from "lucide-react";
import { api } from "../../../lib/api";
import { DEMO_MODE } from "@/lib/demoMode";
import { toLetter } from "./numbering";
import { STATUS_BADGE, type Series, type TestItem } from "./types";
import { MOCK_TESTS } from "./mockData";
import TestRow from "./TestRow";

interface Props {
  series: Series;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  duplicatePending: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
  onAddTest: () => void;
  onSmartBuild: () => void;
  onImportTest: () => void;
  onPreviewTest: (testId: string) => void;
  onTogglePublishTest: (test: TestItem) => void;
  onToggleFreeTest: (test: TestItem) => void;
  onDeleteTest: (test: TestItem) => void;
  onOpenTestQuestions: (test: TestItem) => void;
}

export default function SeriesRow({
  series, index, onEdit, onDuplicate, duplicatePending, onTogglePublish, onDelete,
  onAddTest, onSmartBuild, onImportTest, onPreviewTest, onTogglePublishTest, onToggleFreeTest, onDeleteTest, onOpenTestQuestions,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ["admin", "tests", series.id],
    queryFn:  () => api.get<any>(`/admin/test-series/${series.id}/tests`),
    enabled:  !DEMO_MODE && expanded,
    initialData: DEMO_MODE && expanded ? MOCK_TESTS : undefined,
  });
  const tests: TestItem[] = Array.isArray(testsData) ? testsData : [];

  return (
    <div className="border-l-2 border-gray-100 pl-3">
      {/* Series header row */}
      <div className="flex items-center gap-2 py-2 group">
        <button onClick={() => setExpanded(e => !e)} className="p-0.5 text-gray-400 hover:text-gray-700 flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="text-sm font-mono text-gray-400 flex-shrink-0">{toLetter(index)}.</span>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm truncate">{series.titleEn}</span>
            <span className={`badge ${STATUS_BADGE[series.status]} text-[10px]`}>{series.status}</span>
            {series.groupType && <span className="badge badge-info text-[10px]">Group {series.groupType}</span>}
            {series.isPremium
              ? <span className="badge badge-warning text-[10px]">₹{series.price}</span>
              : <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Free</span>}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {series.testCount ?? 0} tests · {fmtCount(series.enrolledCount)} enrolled
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <button onClick={onEdit} title="Edit" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-700 transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDuplicate} disabled={duplicatePending} title="Duplicate series"
            className="p-1.5 hover:bg-primary-50 rounded-lg text-gray-300 hover:text-primary-600 transition-all disabled:opacity-40">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-600 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onTogglePublish}
          className={`text-xs py-1 px-2.5 rounded-lg font-semibold border transition-all flex-shrink-0 ${
            series.status === "published"
              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          {series.status === "published" ? "Unpublish" : "Publish"}
        </button>
      </div>

      {/* Tests in this series */}
      {expanded && (
        <div className="pb-3 pl-2">
          <div className="flex items-center justify-between mb-2 mt-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tests</span>
            <div className="flex gap-2">
              <button onClick={onSmartBuild} className="btn-ghost border border-gray-200 text-xs py-1 px-2.5">
                <Zap className="w-3.5 h-3.5" /> Smart Build
              </button>
              <button onClick={onImportTest} className="btn-ghost border border-gray-200 text-xs py-1 px-2.5">
                <FileUp className="w-3.5 h-3.5" /> Upload Excel
              </button>
              <button onClick={onAddTest} className="btn-primary text-xs py-1 px-2.5">
                <Plus className="w-3.5 h-3.5" /> Add Test
              </button>
            </div>
          </div>

          {testsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <BarChart2 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p className="text-sm font-medium">No tests yet</p>
              <button onClick={onAddTest} className="btn-primary mt-3 text-xs py-1 px-2.5">
                <Plus className="w-3.5 h-3.5" /> Create Test
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tests.map((test, i) => (
                <TestRow
                  key={test.id}
                  test={test}
                  index={i + 1}
                  onPreview={() => onPreviewTest(test.id)}
                  onTogglePublish={() => onTogglePublishTest(test)}
                  onToggleFree={() => onToggleFreeTest(test)}
                  onDelete={() => onDeleteTest(test)}
                  onOpenQuestions={() => onOpenTestQuestions(test)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
