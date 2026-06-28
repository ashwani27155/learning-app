import { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, ListChecks } from "lucide-react";
import { testService } from "../../services/testService";
import { Skeleton } from "../../components/common/Skeleton";
import { diffBadge, formatSecs, getStatus, type FilterType, type ResponseRow } from "../../components/test/resultHelpers";

export default function QuestionReviewPage() {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ["test-result", testId, attemptId],
    queryFn: () => testService.getResult(testId!, attemptId!),
    enabled: !!testId && !!attemptId,
  });

  const [filter, setFilter]             = useState<FilterType>("all");
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [singleViewId, setSingleViewId] = useState<string | null>(null);
  const [revisionSet, setRevisionSet]   = useState<Set<string>>(new Set());
  const [reportingId, setReportingId]   = useState<string | null>(null);
  const [reportedIds, setReportedIds]   = useState<Set<string>>(new Set());
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto card p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Couldn't load this question review. Please try again.</p>
          <button onClick={() => refetch()} className="btn-outline">Try again</button>
        </div>
      </div>
    );
  }

  const responses      = result.attempt.responses;
  const totalCorrect   = result.correct;
  const totalIncorrect = result.incorrect;
  const totalSkipped   = result.skipped;
  const totalQs        = totalCorrect + totalIncorrect + totalSkipped;

  const filteredResponses = responses.filter(r => {
    if (singleViewId !== null) return r.questionId === singleViewId;
    if (filter === "all") return true;
    return getStatus(r) === filter;
  });

  const paletteBg = (r: ResponseRow) => {
    const s = getStatus(r);
    const active = expandedId === r.questionId;
    const ring = active ? " ring-2 ring-offset-1" : "";
    if (s === "correct") return `bg-emerald-500 text-white${ring}${active ? " ring-emerald-700" : ""}`;
    if (s === "wrong")   return `bg-red-500 text-white${ring}${active ? " ring-red-700" : ""}`;
    return `bg-gray-200 text-gray-600${ring}${active ? " ring-gray-400" : ""}`;
  };

  const handlePaletteClick = (r: ResponseRow) => {
    setSingleViewId(r.questionId);
    setExpandedId(r.questionId);
    setTimeout(() => {
      questionRefs.current[r.questionId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to={testId && attemptId ? `/test/${testId}/result/${attemptId}` : "/dashboard/my-results"}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to result
        </Link>

        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary-600" />
            Question Review
          </h1>
          <p className="page-subtitle">
            {result.test.titleEn} — review every question, see correct answers and explanations.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">🔍 All Questions</h3>
            {revisionSet.size > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                ⭐ {revisionSet.size} saved to revision list
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {([
              { key: "all",         label: "All",         count: totalQs,        active: "bg-gray-900 text-white border-gray-900",       inactive: "border-gray-200 text-gray-600" },
              { key: "correct",     label: "Correct",     count: totalCorrect,   active: "bg-emerald-500 text-white border-emerald-500",  inactive: "border-emerald-200 text-emerald-700" },
              { key: "wrong",       label: "Wrong",       count: totalIncorrect, active: "bg-red-500 text-white border-red-500",          inactive: "border-red-200 text-red-600" },
              { key: "unattempted", label: "Unattempted", count: totalSkipped,   active: "bg-gray-400 text-white border-gray-400",        inactive: "border-gray-200 text-gray-500" },
            ] as { key: FilterType; label: string; count: number; active: string; inactive: string }[]).map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setExpandedId(null); setSingleViewId(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all whitespace-nowrap flex-shrink-0 ${filter === f.key ? f.active : "bg-white " + f.inactive + " hover:bg-gray-50"}`}>
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === f.key ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Palette */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2">Click a number to view that question</p>
            <div className="flex flex-wrap gap-2">
              {responses.map((r, i) => (
                <button key={r.questionId} onClick={() => handlePaletteClick(r)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${paletteBg(r)}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-5 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" />Correct ({totalCorrect})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" />Wrong ({totalIncorrect})</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-300 inline-block" />Unattempted ({totalSkipped})</span>
            </div>
          </div>

          {/* Back button when in single-question view */}
          {singleViewId !== null && (
            <div className="mb-4">
              <button
                onClick={() => { setSingleViewId(null); setExpandedId(null); }}
                className="flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900 transition-colors"
              >
                ← Show all questions
              </button>
            </div>
          )}

          {/* Question cards */}
          <div className="space-y-3">
            {filteredResponses.map(r => {
              const qs          = r.question;
              const st          = getStatus(r);
              const isExpanded  = expandedId === r.questionId;
              const inRevision  = revisionSet.has(r.questionId);
              const borderColor = st === "correct" ? "border-emerald-200" : st === "wrong" ? "border-red-200" : "border-gray-200";
              const headerBg    = isExpanded
                ? (st === "correct" ? "bg-emerald-50" : st === "wrong" ? "bg-red-50" : "bg-gray-50")
                : "hover:bg-gray-50";

              return (
                <div key={r.questionId}
                  ref={el => { questionRefs.current[r.questionId] = el; }}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${borderColor}`}>

                  <button onClick={() => setExpandedId(isExpanded ? null : r.questionId)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-all ${headerBg}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${st === "correct" ? "bg-emerald-500 text-white" : st === "wrong" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                      {responses.indexOf(r) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {qs.subject && <span className="badge badge-info text-xs">{qs.subject.nameEn}</span>}
                        {(qs as any).difficulty && (
                          <span className={`badge ${diffBadge((qs as any).difficulty)} text-[10px]`}>
                            {(qs as any).difficulty.charAt(0).toUpperCase() + (qs as any).difficulty.slice(1)}
                          </span>
                        )}
                        {r.timeSpent && <span className="text-xs text-gray-400">⏱ {formatSecs(r.timeSpent)}</span>}
                        <span className={`text-xs font-semibold ml-auto ${st === "correct" ? "text-emerald-600" : st === "wrong" ? "text-red-600" : "text-gray-400"}`}>
                          {st === "correct" ? "✓ Correct" : st === "wrong" ? "✗ Wrong" : "— Unattempted"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{qs.textEn}</p>
                    </div>
                    <span className="text-gray-400 text-xs flex-shrink-0 ml-2 mt-1">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 bg-white space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed flex-1">{qs.textEn}</p>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setRevisionSet(prev => {
                            const next = new Set(prev);
                            if (inRevision) next.delete(r.questionId); else next.add(r.questionId);
                            return next;
                          })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${inRevision ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-gray-200 text-gray-500 hover:border-amber-300"}`}>
                            {inRevision ? "⭐ Saved" : "☆ Save"}
                          </button>
                          <button
                            onClick={() => setReportingId(r.questionId)}
                            disabled={reportedIds.has(r.questionId)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                              reportedIds.has(r.questionId)
                                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
                            }`}
                          >
                            {reportedIds.has(r.questionId) ? "✓ Reported" : "🚩 Report"}
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {qs.options
                          .slice()
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map((opt, oi) => {
                            const isCorrect   = opt.isCorrect;
                            const isCandidate = r.selectedOptionIds.includes(opt.id);
                            let rowCls = "border-gray-200 bg-gray-50 text-gray-600";
                            if (isCorrect)        rowCls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                            else if (isCandidate) rowCls = "border-red-400 bg-red-50 text-red-700";
                            return (
                              <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${rowCls}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-emerald-500 text-white" : isCandidate ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                                  {String.fromCharCode(65 + oi)}
                                </div>
                                <span className="text-sm flex-1">{opt.textEn}</span>
                                <div className="flex gap-1 flex-shrink-0 text-xs font-semibold">
                                  {isCorrect && isCandidate  && <span className="text-emerald-600">Your answer ✓</span>}
                                  {isCorrect && !isCandidate && <span className="text-emerald-600">Correct answer</span>}
                                  {!isCorrect && isCandidate && <span className="text-red-600">Your answer ✗</span>}
                                </div>
                              </div>
                            );
                          })}
                        {r.selectedOptionIds.length === 0 && (
                          <p className="text-xs text-gray-400 italic pl-1">You did not attempt this question.</p>
                        )}
                      </div>

                      {/* Explanation */}
                      {qs.explanationEn && (
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                          <p className="text-xs font-semibold text-primary-600 mb-2">💡 Explanation</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{qs.explanationEn}</p>
                          {(qs.explanationBook || qs.explanationPage) && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary-100">
                              <span className="text-primary-400 text-xs">📖</span>
                              <span className="text-xs text-primary-700 font-medium">
                                {qs.explanationBook}{qs.explanationPage && ` · Page ${qs.explanationPage}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredResponses.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No questions in this category.</div>
            )}
          </div>
        </div>
      </div>

      {/* Report Question Modal */}
      {reportingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">🚩 Report Question</h3>
            <p className="text-xs text-gray-500 mb-4">What's wrong with this question?</p>
            <div className="space-y-1">
              {[
                "Wrong answer marked as correct",
                "Correct answer marked as wrong",
                "Poor / ambiguous question",
                "Translation error (Marathi)",
                "Factual error in explanation",
                "Other issue",
              ].map(reason => (
                <button
                  key={reason}
                  onClick={async () => {
                    await testService.reportQuestion(testId!, reportingId, reason);
                    setReportedIds(prev => new Set([...prev, reportingId]));
                    setReportingId(null);
                    toast.success("Report submitted. Thank you!");
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setReportingId(null)}
              className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
