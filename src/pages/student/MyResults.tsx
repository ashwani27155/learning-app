import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService, type MyResult } from "../../services/userService";
import { DEMO_MODE } from "@/lib/demoMode";


const MOCK_RESULTS: MyResult[] = [
  {
    id: "result-1", testId: "demo-test-1", attemptId: "demo-attempt-1",
    correct: 32, incorrect: 8, skipped: 10, score: 30.4, maxScore: 50,
    percentage: 60.8, rank: 142, percentile: 88, timeTaken: 2760,
    isPassed: true, createdAt: "2026-05-20T12:00:00Z",
    test: { titleEn: "Rajyaseva Mock Test #1 – GS Paper I" },
    attempt: { startedAt: "2026-05-20T11:00:00Z", submittedAt: "2026-05-20T11:46:00Z" },
  },
  {
    id: "result-2", testId: "demo-test-4", attemptId: "demo-attempt-2",
    correct: 18, incorrect: 5, skipped: 2, score: 17.35, maxScore: 25,
    percentage: 69.4, rank: 98, percentile: 91, timeTaken: 1380,
    isPassed: true, createdAt: "2026-05-10T14:00:00Z",
    test: { titleEn: "History & Geography – Sectional Test 1" },
    attempt: { startedAt: "2026-05-10T13:30:00Z", submittedAt: "2026-05-10T13:53:00Z" },
  },
  {
    id: "result-3", testId: "demo-test-2", attemptId: "demo-attempt-3",
    correct: 22, incorrect: 14, skipped: 14, score: 17.38, maxScore: 50,
    percentage: 34.76, rank: 210, percentile: 65, timeTaken: 3120,
    isPassed: false, createdAt: "2026-04-28T10:00:00Z",
    test: { titleEn: "Rajyaseva Mock Test #2 – GS Paper II" },
    attempt: { startedAt: "2026-04-28T09:00:00Z", submittedAt: "2026-04-28T09:52:00Z" },
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(secs?: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function MyResults() {
  const [results, setResults] = useState<MyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [sortBy,  setSortBy]  = useState<"date" | "score_desc" | "score_asc">("date");
  const [passFilter, setPassFilter] = useState<"all" | "passed" | "failed">("all");

  useEffect(() => {
    if (DEMO_MODE) {
      setResults(MOCK_RESULTS);
      setLoading(false);
      return;
    }
    userService.getMyResults()
      .then(setResults)
      .catch(e => setError(e.message ?? "Failed to load results"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title font-marathi">निकाल</h1>
          <p className="page-subtitle">All your test results and performance history</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title font-marathi">निकाल</h1>
        </div>
        <div className="card p-12 text-center text-red-500">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title font-marathi">निकाल</h1>
          <p className="page-subtitle">All your test results and performance history</p>
        </div>
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-gray-600">No results yet</p>
          <p className="text-sm mt-1">Complete a test to see your results here</p>
          <Link to="/test-series/group/a" className="btn-primary mt-4">Start a Free Test →</Link>
        </div>
      </div>
    );
  }

  const displayed = results
    .filter(r => passFilter === "all" ? true : passFilter === "passed" ? r.isPassed : !r.isPassed)
    .sort((a, b) => {
      if (sortBy === "score_desc") return Number(b.percentage) - Number(a.percentage);
      if (sortBy === "score_asc")  return Number(a.percentage) - Number(b.percentage);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title font-marathi">निकाल</h1>
        <p className="page-subtitle">{results.length} test result{results.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Sort + Filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "passed", "failed"] as const).map(f => (
            <button key={f} onClick={() => setPassFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${passFilter === f ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"}`}>
              {f === "passed" ? "✅ Passed" : f === "failed" ? "❌ Failed" : "All"}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="input-field w-auto text-sm">
          <option value="date">Newest first</option>
          <option value="score_desc">Highest score</option>
          <option value="score_asc">Lowest score</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 stagger-children">
        {displayed.map(r => {
          const pct = Math.round(Number(r.percentage));
          const accuracy = (r.correct + r.incorrect) > 0
            ? Math.round((r.correct / (r.correct + r.incorrect)) * 100)
            : 0;

          return (
            <div key={r.id} className="card p-3 md:p-4">
              <div className="flex items-start gap-3">
                {/* Score ring */}
                <div className="flex-shrink-0 text-center">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 flex flex-col items-center justify-center ${
                    pct>=70?"border-emerald-400 bg-emerald-50":pct>=50?"border-amber-400 bg-amber-50":"border-red-400 bg-red-50"
                  }`}>
                    <div className={`text-sm font-bold leading-none ${pct>=70?"text-emerald-700":pct>=50?"text-amber-700":"text-red-600"}`}>{pct}%</div>
                    <div className="text-[9px] text-gray-400">{Number(r.score).toFixed(1)}/{Number(r.maxScore).toFixed(0)}</div>
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 ${r.isPassed?"text-emerald-600":"text-red-500"}`}>
                    {r.isPassed ? "✓ Pass" : "✗ Fail"}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">{r.test.titleEn}</h3>
                    <Link to={`/test/${r.testId}/result/${r.attemptId}`} className="btn-primary text-xs py-1 px-2.5 flex-shrink-0">
                      View
                    </Link>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2">
                    {r.attempt.submittedAt ? formatDate(r.attempt.submittedAt) : formatDate(r.createdAt)}
                    {r.timeTaken ? ` · ${formatTime(r.timeTaken)}` : ""}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { label:"Rank",      value: r.rank       ? `#${r.rank}` : "—",            color:"text-primary-600" },
                      { label:"Percentile",value: r.percentile ? `${Math.round(Number(r.percentile))}%` : "—", color:"text-secondary-600" },
                      { label:"Correct",   value: r.correct,                                     color:"text-emerald-600" },
                      { label:"Wrong",     value: r.incorrect,                                   color:"text-red-500" },
                      { label:"Skipped",   value: r.skipped,                                     color:"text-gray-400" },
                      { label:"Accuracy",  value: `${accuracy}%`,                                color:"text-primary-600" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className={`font-bold text-sm md:text-base ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
