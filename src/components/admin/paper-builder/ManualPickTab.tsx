import { Search, BookOpen, ChevronDown as Chevron, Check, Plus } from "lucide-react";
import type { BankFilters, Question, Subject } from "./types";
import { QUESTION_TYPES } from "./demoData";
import { DiffBadge, UsageBadge } from "./helpers";

export function ManualPickTab({
  bankF, setBF, subjects, resolvedExamTypes,
  bankQuestions, bankLoading, bankPages,
  selectedIds, expandedId, setExpandedId, onAdd,
}: {
  bankF: BankFilters; setBF: <K extends keyof BankFilters>(k: K, v: BankFilters[K]) => void;
  subjects: Subject[]; resolvedExamTypes: string[];
  bankQuestions: Question[]; bankLoading: boolean; bankPages: number;
  selectedIds: Set<string>; expandedId: string | null; setExpandedId: (id: string | null) => void;
  onAdd: (q: Question) => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Filters */}
      <div className="p-3 border-b border-gray-100 space-y-2 flex-shrink-0">
        {/* Row 1: search + exam */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input placeholder="Search questions…" value={bankF.search} onChange={e => setBF("search", e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <select value={bankF.examType} onChange={e => setBF("examType", e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Exams</option>
            {resolvedExamTypes.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        {/* Row 2: subject + difficulty + type */}
        <div className="flex gap-2">
          <select value={bankF.subjectId} onChange={e => setBF("subjectId", e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.nameEn}</option>)}
          </select>
          <select value={bankF.difficulty} onChange={e => setBF("difficulty", e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
          <select value={bankF.type} onChange={e => setBF("type", e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300">
            <option value="">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {/* Row 3: PYQ + sort + usage */}
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={bankF.isPyq} onChange={e => setBF("isPyq", e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-primary-600" />
            PYQ only
          </label>
          {bankF.isPyq && (
            <input type="number" placeholder="Year" value={bankF.pyqYear}
              onChange={e => setBF("pyqYear", e.target.value)}
              className="w-20 border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300" />
          )}
          <span className="text-gray-300 text-xs">Usage:</span>
          <input type="number" placeholder="Min" value={bankF.usageMin}
            onChange={e => setBF("usageMin", e.target.value)}
            className="w-14 border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300" />
          <span className="text-gray-400 text-xs">–</span>
          <input type="number" placeholder="Max" value={bankF.usageMax}
            onChange={e => setBF("usageMax", e.target.value)}
            className="w-14 border border-gray-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300" />
          <select value={bankF.sortBy} onChange={e => setBF("sortBy", e.target.value)}
            className="ml-auto text-xs border border-gray-200 rounded-xl px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-300">
            <option value="createdAt">Newest</option>
            <option value="usageCount">Usage ↑</option>
            <option value="successRate">Success rate</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 min-h-0">
        {bankLoading ? (
          <div className="flex items-center justify-center h-24 text-xs text-gray-400">Loading…</div>
        ) : bankQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
            <BookOpen className="w-8 h-8 opacity-20" />
            <p className="text-sm">No questions found</p>
            <p className="text-xs">Try changing filters</p>
          </div>
        ) : bankQuestions.map(q => {
          const inSelected = selectedIds.has(q.id);
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} className={`px-3 py-2.5 transition-colors ${inSelected ? "bg-primary-50/60" : "hover:bg-gray-50"}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : q.id)}>
                  <p className={`text-xs font-medium text-gray-900 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>{q.textEn}</p>
                  {q.textMr && !isExpanded && (
                    <p className="text-[10px] text-gray-500 line-clamp-1 italic mt-0.5">{q.textMr}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <DiffBadge d={q.difficulty} />
                    {q.subject && <span className="text-[10px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full font-medium">{q.subject.nameEn}</span>}
                    {q.chapter && <span className="text-[10px] text-gray-500">{q.chapter.nameEn}</span>}
                    {q.topic && <span className="text-[10px] text-gray-400">/ {q.topic.nameEn}</span>}
                    {q.pyqYear && <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">PYQ {q.pyqYear}</span>}
                    <UsageBadge count={q.usageCount} />
                    <Chevron className={`w-3 h-3 text-gray-400 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                  {/* Expanded: options */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={opt.id} className={`flex gap-1.5 text-[11px] ${opt.isCorrect ? "text-emerald-700 font-semibold" : "text-gray-600"}`}>
                          <span>({["A","B","C","D","E","F"][oi]})</span>
                          <span>{opt.textEn}</span>
                          {opt.isCorrect && <Check className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />}
                        </div>
                      ))}
                      {q.explanationEn && (
                        <p className="text-[10px] text-gray-400 mt-1.5 italic border-t border-gray-100 pt-1.5">{q.explanationEn.slice(0, 120)}{q.explanationEn.length > 120 ? "…" : ""}</p>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => onAdd(q)} disabled={inSelected} title={inSelected ? "Already added" : "Add to paper"}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all mt-0.5 ${
                    inSelected ? "text-emerald-500 cursor-default" : "text-primary-600 hover:bg-primary-50"
                  }`}>
                  {inSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {bankPages > 1 && (
        <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setBF("page", Math.max(1, bankF.page - 1))} disabled={bankF.page <= 1}
            className="text-[11px] px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all">← Prev</button>
          <span className="text-[11px] text-gray-500">Page {bankF.page} / {bankPages}</span>
          <button onClick={() => setBF("page", Math.min(bankPages, bankF.page + 1))} disabled={bankF.page >= bankPages}
            className="text-[11px] px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all">Next →</button>
        </div>
      )}
    </div>
  );
}
