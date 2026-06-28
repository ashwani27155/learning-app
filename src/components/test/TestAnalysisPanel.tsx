import { Link } from "react-router-dom";
import type { AttemptResult } from "../../services/testService";
import { computeSubjectResults } from "./resultHelpers";

interface TestAnalysisPanelProps {
  result: AttemptResult;
}

export function TestAnalysisPanel({ result }: TestAnalysisPanelProps) {
  const responses      = result.attempt.responses;
  const subjectResults = result.subjectResults.length > 0
    ? result.subjectResults
    : computeSubjectResults(responses);

  const score          = Number(result.score);
  const maxScore       = Number(result.maxScore);
  const totalCorrect   = result.correct;
  const totalIncorrect = result.incorrect;
  const totalSkipped   = result.skipped;
  const totalQs        = totalCorrect + totalIncorrect + totalSkipped;
  const timeTaken      = result.timeTaken ?? 0;

  const marksPerQ      = maxScore / Math.max(totalQs, 1);
  const deductedMarks  = totalIncorrect * marksPerQ * 0.33;

  const attemptRate    = totalQs > 0 ? ((totalCorrect + totalIncorrect) / totalQs) * 100 : 0;
  const accuracy       = (totalCorrect + totalIncorrect) > 0
    ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100
    : 0;
  const timePerQ       = totalQs > 0 ? timeTaken / totalQs : 0;
  const passingMarks   = (result.test.passingPct / 100) * maxScore;
  const scoreGap       = passingMarks - score;
  const potentialScore = Math.min(score + totalSkipped * marksPerQ, maxScore);
  const weakestSubject = subjectResults.length > 0
    ? subjectResults.reduce((worst, s) => {
        const acc = s.total > 0 ? s.correct / s.total : 1;
        const worstAcc = worst.total > 0 ? worst.correct / worst.total : 1;
        return acc < worstAcc ? s : worst;
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Exam Insights */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-5">🎯 Exam Insights</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Attempt Rate",
              value: `${Math.round(attemptRate)}%`,
              sub: `${totalCorrect + totalIncorrect} of ${totalQs} attempted`,
              color: attemptRate >= 80 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
              icon: "📝",
            },
            {
              label: "Accuracy",
              value: `${Math.round(accuracy)}%`,
              sub: "of attempted questions",
              color: accuracy >= 70 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : accuracy >= 50 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700",
              icon: "🎯",
            },
            {
              label: "Time / Question",
              value: `${Math.round(timePerQ)}s`,
              sub: timePerQ <= 72 ? "Good pace ✓" : "Too slow — aim for ≤72s",
              color: timePerQ <= 72 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700",
              icon: "⏱️",
            },
            {
              label: "Marks Lost",
              value: `-${deductedMarks.toFixed(2)}`,
              sub: `${totalIncorrect} wrong × ${(marksPerQ * 0.33).toFixed(2)} penalty`,
              color: "border-red-200 bg-red-50 text-red-700",
              icon: "📉",
            },
            {
              label: "Passing Marks",
              value: passingMarks.toFixed(1),
              sub: `${result.test.passingPct}% of ${maxScore}`,
              color: "border-gray-200 bg-gray-50 text-gray-600",
              icon: "🎓",
            },
            {
              label: scoreGap > 0 ? "Marks Needed" : "Passed By",
              value: Math.abs(scoreGap).toFixed(1),
              sub: scoreGap > 0 ? "more marks to pass" : "marks above passing",
              color: scoreGap > 0 ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
              icon: scoreGap > 0 ? "⚠️" : "✅",
            },
          ].map(m => (
            <div key={m.label} className={`border rounded-xl p-3 ${m.color}`}>
              <div className="text-lg mb-1">{m.icon}</div>
              <div className="text-xl font-bold">{m.value}</div>
              <div className="text-xs font-semibold mt-0.5">{m.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-xs font-bold text-primary-700 mb-1">💡 If you hadn't guessed wrong</p>
            <p className="text-2xl font-bold text-primary-900">{(score + deductedMarks).toFixed(2)}</p>
            <p className="text-xs text-primary-600 mt-0.5">marks without negative deductions</p>
          </div>
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-xs font-bold text-purple-700 mb-1">🚀 If you'd attempted all skipped</p>
            <p className="text-2xl font-bold text-purple-900">{potentialScore.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-0.5">max possible score (assuming all correct)</p>
          </div>
        </div>

        {weakestSubject && weakestSubject.total > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">📌</span>
            <div>
              <p className="text-sm font-bold text-red-800">Focus Area: {weakestSubject.subjectId}</p>
              <p className="text-xs text-red-600 mt-0.5">
                Only {Math.round((weakestSubject.correct / weakestSubject.total) * 100)}% accuracy —
                {" "}{weakestSubject.incorrect} wrong answer{weakestSubject.incorrect !== 1 ? "s" : ""} cost you{" "}
                {(weakestSubject.incorrect * marksPerQ * 0.33).toFixed(2)} marks. Prioritise this subject in your revision.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subject-wise Analysis */}
      {subjectResults.length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-5">📚 Subject-wise Analysis</h3>
          <div className="divide-y divide-gray-100">
            {subjectResults.map((s, i) => {
              const acc      = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const barColor = acc >= 70 ? "bg-emerald-500" : acc >= 50 ? "bg-amber-400" : "bg-red-500";
              const accColor = acc >= 70 ? "text-emerald-600" : acc >= 50 ? "text-amber-600" : "text-red-600";
              const subScore = Number(s.score);
              return (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                    <span className="font-semibold text-sm text-gray-900 flex-1 min-w-0">{s.subjectId}</span>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      <span className="text-gray-400">{s.total} Qs</span>
                      <span className="text-emerald-600 font-bold">✅ {s.correct}</span>
                      <span className="text-red-500 font-bold">❌ {s.incorrect}</span>
                      <span className="text-gray-400">⏭️ {s.skipped}</span>
                      <span className={`font-bold ${subScore < 0 ? "text-red-600" : "text-gray-800"}`}>
                        {subScore < 0 ? "" : "+"}{subScore.toFixed(2)} pts
                      </span>
                      <span className={`font-bold text-sm ${accColor}`}>{acc}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {((result.strengthAreas ?? []).length > 0 || (result.weakAreas ?? []).length > 0) && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">💡 Performance Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(result.strengthAreas ?? []).length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">💪 Your Strengths</p>
                <ul className="space-y-1.5">
                  {(result.strengthAreas ?? []).map((s: string) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(result.weakAreas ?? []).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">⚠️ Needs Practice</p>
                <ul className="space-y-1.5">
                  {(result.weakAreas ?? []).map((s: string) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
                <Link to="/test-series?category=SUBJECT_WISE" className="mt-3 block text-xs font-semibold text-amber-700 hover:underline">
                  → Practice subject-wise tests
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
