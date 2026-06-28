import { Plus, X, Zap, AlertTriangle } from "lucide-react";
import type { Subject, SmartSlot } from "./types";

export function SmartAutoFillTab({
  subjects, resolvedExamTypes,
  smartExam, setSmartExam, smartTotalQ, setSmartTotalQ,
  slots, addSlot, removeSlot, updateSlot, autoDistribute,
  slotsTotal, slotGap,
  onAutoFill, autoFillPending,
}: {
  subjects: Subject[]; resolvedExamTypes: string[];
  smartExam: string; setSmartExam: (v: string) => void;
  smartTotalQ: number; setSmartTotalQ: (v: number) => void;
  slots: SmartSlot[];
  addSlot: () => void; removeSlot: (key: string) => void;
  updateSlot: (key: string, patch: Partial<SmartSlot>) => void;
  autoDistribute: () => void;
  slotsTotal: number; slotGap: number;
  onAutoFill: () => void; autoFillPending: boolean;
}) {
  const missingSubject = slots.some(s => !s.subjectId);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Config row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Exam Type</label>
          <select value={smartExam} onChange={e => setSmartExam(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white">
            <option value="">Any Exam</option>
            {resolvedExamTypes.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Questions</label>
          <input type="number" min={1} max={500} value={smartTotalQ}
            onChange={e => setSmartTotalQ(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
      </div>

      {/* Subject Slots table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Subject Slots</label>
          <div className="flex items-center gap-2">
            {slotsTotal !== smartTotalQ && (
              <span className={`text-[10px] font-semibold ${slotGap > 0 ? "text-amber-600" : "text-red-600"}`}>
                {slotGap > 0 ? `${slotGap} unallocated` : `${Math.abs(slotGap)} over`}
              </span>
            )}
            <button onClick={autoDistribute}
              className="text-[10px] font-semibold text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 px-2 py-0.5 rounded-lg transition-all">
              Auto-Dist
            </button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_48px_50px_50px_50px_78px_28px] gap-1 px-2 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
          <span>Subject</span><span className="text-center">Qs</span>
          <span className="text-center">Easy%</span><span className="text-center">Med%</span>
          <span className="text-center">Hard%</span><span className="text-center">Usage</span><span />
        </div>

        <div className="space-y-1.5">
          {slots.map(slot => {
            const diffSum = slot.easyPct + slot.medPct + slot.hardPct;
            const diffOk = diffSum === 100;
            return (
              <div key={slot._key} className="grid grid-cols-[1fr_48px_50px_50px_50px_78px_28px] gap-1 items-center">
                <select
                  value={slot.subjectId}
                  onChange={e => {
                    const s = subjects.find(x => x.id === e.target.value);
                    updateSlot(slot._key, { subjectId: e.target.value, subjectName: s?.nameEn ?? "" });
                  }}
                  className={`border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300 bg-white w-full ${slot.subjectId ? "border-gray-200" : "border-amber-300"}`}
                >
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
                </select>
                <input type="number" min={1} max={500} value={slot.count}
                  onChange={e => updateSlot(slot._key, { count: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="border border-gray-200 rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-300 w-full" />
                <input type="number" min={0} max={100} value={slot.easyPct}
                  onChange={e => updateSlot(slot._key, { easyPct: parseInt(e.target.value) || 0 })}
                  className={`border rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-300 w-full ${diffOk ? "border-gray-200" : "border-amber-300"}`} />
                <input type="number" min={0} max={100} value={slot.medPct}
                  onChange={e => updateSlot(slot._key, { medPct: parseInt(e.target.value) || 0 })}
                  className={`border rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-300 w-full ${diffOk ? "border-gray-200" : "border-amber-300"}`} />
                <input type="number" min={0} max={100} value={slot.hardPct}
                  onChange={e => updateSlot(slot._key, { hardPct: parseInt(e.target.value) || 0 })}
                  className={`border rounded-lg px-1 py-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-300 w-full ${diffOk ? "border-gray-200" : "border-amber-300"}`} />
                <select
                  value={slot.usagePref}
                  title="Usage preference for this subject"
                  onChange={e => updateSlot(slot._key, { usagePref: e.target.value as SmartSlot["usagePref"] })}
                  className="border border-gray-200 rounded-lg px-1 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-300 bg-white w-full"
                >
                  <option value="fresh">Fresh</option>
                  <option value="mixed">Mixed</option>
                  <option value="any">Any</option>
                </select>
                <button onClick={() => removeSlot(slot._key)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={addSlot}
          className="mt-2 w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Subject Row
        </button>
        <p className="text-[10px] text-gray-400 mt-1.5">
          <strong>Usage</strong>: Fresh = prioritise never-used questions · Mixed = balanced · Any = allow reuse.
        </p>
      </div>

      {/* Validation hints */}
      {slotsTotal > 0 && slotsTotal !== smartTotalQ && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Subject slot total ({slotsTotal}) doesn't match target ({smartTotalQ}). Use Auto-Dist to fix, or adjust manually.
        </div>
      )}
      {missingSubject && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Select a subject for every row to enable Auto-Fill.
        </div>
      )}

      {/* Auto-fill button */}
      <button
        onClick={onAutoFill}
        disabled={autoFillPending || missingSubject}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-purple-sm"
      >
        <Zap className="w-4 h-4" />
        {autoFillPending ? "Finding questions…" : `Auto-Fill ${smartTotalQ} Questions`}
      </button>

      <p className="text-[10px] text-gray-400 text-center">
        Auto-fill intelligently picks approved questions from the bank matching each subject's difficulty & usage config.
        Already-added questions are excluded.
      </p>
    </div>
  );
}
