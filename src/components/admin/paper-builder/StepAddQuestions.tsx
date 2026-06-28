import { Zap, BookOpen } from "lucide-react";
import type { BankFilters, Question, SmartSlot, Subject } from "./types";
import { SmartAutoFillTab } from "./SmartAutoFillTab";
import { ManualPickTab } from "./ManualPickTab";

export function StepAddQuestions({
  activeTab, setActiveTab,
  subjects, resolvedExamTypes,
  smartExam, setSmartExam, smartTotalQ, setSmartTotalQ,
  slots, addSlot, removeSlot, updateSlot, autoDistribute, slotsTotal, slotGap,
  onAutoFill, autoFillPending,
  bankF, setBF, bankQuestions, bankLoading, bankPages,
  selectedIds, expandedId, setExpandedId, onAdd,
  selectedCount, totalMarks, onReview,
}: {
  activeTab: "smart" | "manual"; setActiveTab: (t: "smart" | "manual") => void;
  subjects: Subject[]; resolvedExamTypes: string[];
  smartExam: string; setSmartExam: (v: string) => void;
  smartTotalQ: number; setSmartTotalQ: (v: number) => void;
  slots: SmartSlot[];
  addSlot: () => void; removeSlot: (key: string) => void;
  updateSlot: (key: string, patch: Partial<SmartSlot>) => void;
  autoDistribute: () => void; slotsTotal: number; slotGap: number;
  onAutoFill: () => void; autoFillPending: boolean;
  bankF: BankFilters; setBF: <K extends keyof BankFilters>(k: K, v: BankFilters[K]) => void;
  bankQuestions: Question[]; bankLoading: boolean; bankPages: number;
  selectedIds: Set<string>; expandedId: string | null; setExpandedId: (id: string | null) => void;
  onAdd: (q: Question) => void;
  selectedCount: number; totalMarks: number; onReview: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={() => setActiveTab("smart")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "smart" ? "border-primary-600 text-primary-700 bg-primary-50/40" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Smart Auto-Fill
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "manual" ? "border-primary-600 text-primary-700 bg-primary-50/40" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Manual Pick
        </button>
      </div>

      {activeTab === "smart" ? (
        <SmartAutoFillTab
          subjects={subjects} resolvedExamTypes={resolvedExamTypes}
          smartExam={smartExam} setSmartExam={setSmartExam}
          smartTotalQ={smartTotalQ} setSmartTotalQ={setSmartTotalQ}
          slots={slots} addSlot={addSlot} removeSlot={removeSlot} updateSlot={updateSlot}
          autoDistribute={autoDistribute} slotsTotal={slotsTotal} slotGap={slotGap}
          onAutoFill={onAutoFill} autoFillPending={autoFillPending}
        />
      ) : (
        <ManualPickTab
          bankF={bankF} setBF={setBF} subjects={subjects} resolvedExamTypes={resolvedExamTypes}
          bankQuestions={bankQuestions} bankLoading={bankLoading} bankPages={bankPages}
          selectedIds={selectedIds} expandedId={expandedId} setExpandedId={setExpandedId} onAdd={onAdd}
        />
      )}

      {/* Sticky status bar — keeps the running count visible while picking, and an easy way to move on */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 bg-white flex-shrink-0">
        <span className="text-xs text-gray-500">
          <strong className="text-gray-900">{selectedCount}</strong> questions added · {totalMarks} marks
        </span>
        <button
          onClick={onReview}
          disabled={selectedCount === 0}
          className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Review & Print →
        </button>
      </div>
    </div>
  );
}
