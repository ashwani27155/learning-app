import { Printer, Shuffle, BarChart2, Layers } from "lucide-react";
import type { Question } from "./types";
import { DiffDistBar } from "./helpers";
import { QuestionRow } from "./QuestionRow";

export function StepReview({
  selected, groupBySubject, setGroupBySubject, shuffle, onClear,
  moveUp, moveDown, removeQuestion, updateMarks,
  groupedSelected, subjectDistribution, totalMarks,
  onAddMore, onPrint,
}: {
  selected: Question[]; groupBySubject: boolean; setGroupBySubject: (fn: (g: boolean) => boolean) => void;
  shuffle: () => void; onClear: () => void;
  moveUp: (idx: number) => void; moveDown: (idx: number) => void; removeQuestion: (id: string) => void;
  updateMarks: (idx: number, v: number) => void;
  groupedSelected: Record<string, Question[]> | null;
  subjectDistribution: [string, number][]; totalMarks: number;
  onAddMore: () => void; onPrint: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-500" />
            <span className="font-bold text-sm text-gray-900">Paper Questions</span>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{selected.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAddMore} className="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
              ← Add more questions
            </button>
            <button onClick={() => setGroupBySubject(g => !g)} title={groupBySubject ? "Flat list" : "Group by subject"}
              className={`p-1.5 rounded-lg transition-all text-xs ${groupBySubject ? "bg-primary-100 text-primary-700" : "text-gray-400 hover:bg-gray-100"}`}>
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={shuffle} disabled={selected.length < 2} title="Shuffle order"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-all">
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            {selected.length > 0 && (
              <button onClick={onClear} className="text-[10px] text-red-400 hover:text-red-600 px-1.5 transition-colors">Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Question list */}
        <div className="flex-1 overflow-y-auto min-h-0 border-r border-gray-100">
          {selected.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Printer className="w-7 h-7 opacity-30" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Paper is empty</p>
                <p className="text-xs mt-1 text-gray-400">Go back and use <strong>Auto-Fill</strong> or <strong>Manual Pick</strong> to add questions</p>
              </div>
              <button onClick={onAddMore} className="btn-primary text-xs mt-1">← Add Questions</button>
            </div>
          ) : groupBySubject && groupedSelected ? (
            // Grouped view
            Object.entries(groupedSelected).map(([subj, qs]) => {
              const baseIdx = selected.indexOf(qs[0]);
              return (
                <div key={subj}>
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{subj}</span>
                    <span className="ml-2 text-[10px] text-gray-400">{qs.length} questions</span>
                  </div>
                  {qs.map((q, localIdx) => {
                    const idx = selected.findIndex(s => s.id === q.id);
                    return <QuestionRow key={q.id} q={q} localNum={baseIdx + localIdx + 1}
                      onUp={() => moveUp(idx)} onDown={() => moveDown(idx)} onRemove={() => removeQuestion(q.id)}
                      onMarksChange={v => updateMarks(idx, v)}
                      isFirst={idx === 0} isLast={idx === selected.length - 1} />;
                  })}
                </div>
              );
            })
          ) : (
            // Flat view
            selected.map((q, idx) => (
              <QuestionRow key={q.id} q={q} localNum={idx + 1}
                onUp={() => moveUp(idx)} onDown={() => moveDown(idx)} onRemove={() => removeQuestion(q.id)}
                onMarksChange={v => updateMarks(idx, v)}
                isFirst={idx === 0} isLast={idx === selected.length - 1} />
            ))
          )}
        </div>

        {/* Quality stats sidebar */}
        {selected.length > 0 && (
          <div className="w-64 flex-shrink-0 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/60">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Difficulty Distribution</p>
              <DiffDistBar questions={selected} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Subject Spread</p>
              <div className="flex flex-wrap gap-1">
                {subjectDistribution.map(([subj, count]) => (
                  <span key={subj} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[10px] font-semibold text-gray-600">
                    {subj} <span className="text-primary-600">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-white">
        <button
          onClick={onPrint}
          disabled={selected.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-purple-sm"
        >
          <Printer className="w-4 h-4" />
          Print Paper · {selected.length} Q · {totalMarks} marks
        </button>
      </div>
    </div>
  );
}
