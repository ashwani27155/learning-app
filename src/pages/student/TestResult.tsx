import { useState, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { testService, type AttemptResult } from "../../services/testService";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { authService } from "../../services/auth.service";
import { DEMO_MODE } from "@/lib/demoMode";
import { TestAnalysisPanel } from "../../components/test/TestAnalysisPanel";
import { formatSecs, getStatus, computeSubjectResults, type FilterType, type ResponseRow } from "../../components/test/resultHelpers";

export default function TestResult() {
  const { testId, attemptId } = useParams<{ testId: string; attemptId: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [result,      setResult]      = useState<AttemptResult | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [isGuest,     setIsGuest]     = useState(false);
  const [saveEmail,   setSaveEmail]   = useState("");
  const [saveName,    setSaveName]    = useState("");
  const [savePhone,   setSavePhone]   = useState("");
  const [savePass,    setSavePass]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [filter,       setFilter]      = useState<FilterType>("all");
  const [expandedId,   setExpandedId]  = useState<string | null>(null);
  const [singleViewId, setSingleViewId] = useState<string | null>(null);
  const [revisionSet,  setRevisionSet] = useState<Set<string>>(new Set());
  const [printMode,    setPrintMode]   = useState(false);
  const [reportingId,  setReportingId]  = useState<string | null>(null);
  const [reportedIds,  setReportedIds]  = useState<Set<string>>(new Set());

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!testId || !attemptId) return;

    // Demo mode
    if (DEMO_MODE) {
      const stored = localStorage.getItem(`demoResult_${testId}_${attemptId}`);
      if (stored) {
        setResult(JSON.parse(stored) as AttemptResult);
      } else {
        setError("Demo result not found. Please complete a test first.");
      }
      setLoading(false);
      return;
    }

    // Guest result stored in sessionStorage
    if (attemptId === "guest-attempt") {
      const stored = sessionStorage.getItem(`guestResult_${testId}`);
      if (stored) {
        setResult(JSON.parse(stored) as AttemptResult);
        setIsGuest(true);
      } else {
        setError("Result not found. Please complete the test first.");
      }
      setLoading(false);
      return;
    }

    testService.getResult(testId, attemptId)
      .then(setResult)
      .catch(e => setError(e.message ?? "Failed to load result"))
      .finally(() => setLoading(false));
  }, [testId, attemptId]);

  // ── Block back-button navigation into the now-stale attempt screen.
  // Retaking a test (when the admin allows it) must go through the explicit
  // "Re-attempt" button on My Tests, which clears the old attempt state
  // first — not via browser back history landing back on /test/:id/attempt.
  useEffect(() => {
    if (!result) return;
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your result…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    const isGuestAttempt = attemptId === "guest-attempt";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm p-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Result Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error || "Could not load result."}</p>
          {isGuestAttempt ? (
            <Link to="/" className="btn-primary">← Back to Home</Link>
          ) : (
            <Link to="/dashboard/my-results" className="btn-primary">← My Results</Link>
          )}
        </div>
      </div>
    );
  }

  const responses      = result.attempt.responses;
  const subjectResults = result.subjectResults.length > 0
    ? result.subjectResults
    : computeSubjectResults(responses);
  const pct            = Math.round(Number(result.percentage));
  const score          = Number(result.score);
  const maxScore       = Number(result.maxScore);
  const totalCorrect   = result.correct;
  const totalIncorrect = result.incorrect;
  const totalSkipped   = result.skipped;
  const totalQs        = totalCorrect + totalIncorrect + totalSkipped;
  const timeTaken      = result.timeTaken ?? 0;
  const timeMins       = Math.floor(timeTaken / 60);
  const timeSecs       = timeTaken % 60;

  // The server includes `marksObtained` per response (real per-question marks/
  // negative-marks, not an average) — use it when present instead of the
  // marksPerQ*0.33 approximation, which is wrong for tests with variable
  // per-question marks or non-1/3 negative marking.
  const hasPerQMarks   = responses.some(r => r.marksObtained != null);
  const marksPerQ      = maxScore / Math.max(totalQs, 1);
  const correctMarks   = hasPerQMarks
    ? responses.reduce((sum, r) => sum + Math.max(0, Number(r.marksObtained ?? 0)), 0)
    : totalCorrect * marksPerQ;
  const deductedMarks  = hasPerQMarks
    ? responses.reduce((sum, r) => sum + Math.max(0, -Number(r.marksObtained ?? 0)), 0)
    : totalIncorrect * marksPerQ * 0.33;
  const isNegativeScore = score < 0;

  const filteredResponses = responses.filter(r => {
    if (singleViewId !== null) return r.questionId === singleViewId;
    const s = getStatus(r);
    if (filter === "all")         return true;
    if (filter === "correct")     return s === "correct";
    if (filter === "wrong")       return s === "wrong";
    if (filter === "unattempted") return s === "unattempted";
    return true;
  });

  const paletteBg = (r: ResponseRow) => {
    const s = getStatus(r);
    const active = expandedId === r.questionId;
    const ring = active ? " ring-2 ring-offset-1" : "";
    if (s === "correct")   return `bg-emerald-500 text-white${ring}${active?" ring-emerald-700":""}`;
    if (s === "wrong")     return `bg-red-500 text-white${ring}${active?" ring-red-700":""}`;
    return `bg-gray-200 text-gray-600${ring}${active?" ring-gray-400":""}`;
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
      <style>{`
        @media print {
          nav, header, footer, .no-print, .question-filters, button, a[href], .btn-primary, .btn-ghost { display: none !important; }
          body { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .print-break-before { page-break-before: always; }
        }
      `}</style>
      {isGuest && !saved && (
        <div className="max-w-4xl mx-auto mb-4 rounded-2xl border border-primary-200 overflow-hidden">
          <div className="bg-primary-50 px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary-800">💾 Save this result to your account</p>
              <p className="text-xs text-primary-600 mt-0.5">Create a free account in seconds and your result will be saved automatically.</p>
            </div>
          </div>
          <div className="bg-white px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="input-field text-sm" placeholder="Full name *" value={saveName} onChange={e => setSaveName(e.target.value)} />
            <input type="email" className="input-field text-sm" placeholder="Email address *" value={saveEmail} onChange={e => setSaveEmail(e.target.value)} />
            <input type="tel" className="input-field text-sm" placeholder="Mobile number (10 digits) *" value={savePhone} onChange={e => setSavePhone(e.target.value)} />
            <input type="password" className="input-field text-sm" placeholder="Create password (min 8 chars) *" value={savePass} onChange={e => setSavePass(e.target.value)} />
            <div className="sm:col-span-2 flex gap-3">
              <button
                disabled={saving || !saveName || !saveEmail || !savePhone || savePass.length < 8}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await authService.register({ name: saveName.trim(), email: saveEmail.trim(), phone: savePhone.trim(), password: savePass });
                    await login(saveEmail.trim(), savePass);
                    const stored = sessionStorage.getItem(`guestResult_${testId}`);
                    if (stored && testId) {
                      await api.post(`/tests/${testId}/guest-save`, { guestResult: JSON.parse(stored) });
                    }
                    toast.success("Account created and result saved!");
                    setSaved(true);
                    sessionStorage.removeItem(`guestResult_${testId}`);
                  } catch (e: any) {
                    toast.error(e.message ?? "Failed to create account");
                  } finally { setSaving(false); }
                }}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create Account & Save Result →"}
              </button>
              <Link to="/auth/login" className="btn-ghost border border-gray-200 text-sm">Already have account? Login</Link>
            </div>
          </div>
        </div>
      )}
      {isGuest && saved && (
        <div className="max-w-4xl mx-auto mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">✅ Result saved to your account! You can view it in your dashboard.</p>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Result Hero ── */}
        <div className="rounded-3xl p-8 text-center text-white"
          style={{ background: pct >= result.test.passingPct
            ? "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#f59e0b 100%)"
            : "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#8b5cf6 100%)" }}>
          <p className="text-sm opacity-70 mb-2">{result.test.titleEn}</p>
          <div className="text-6xl font-bold mb-2">{score.toFixed(2)} / {maxScore}</div>
          <div className="text-2xl font-bold mb-1">{pct}%</div>
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mt-2 ${result.isPassed ? "bg-emerald-400/30" : "bg-red-400/30"}`}>
            {result.isPassed ? "🎉 PASS" : "📚 Keep Practicing"}
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8">
            {result.rank     && <div><div className="text-3xl font-bold">#{result.rank}</div><div className="text-sm opacity-80 mt-1">Rank</div></div>}
            {result.percentile && <div><div className="text-3xl font-bold">{Math.round(Number(result.percentile))}%</div><div className="text-sm opacity-80 mt-1">Percentile</div></div>}
            <div><div className="text-3xl font-bold">{timeMins}m {timeSecs}s</div><div className="text-sm opacity-80 mt-1">Time Taken</div></div>
          </div>
        </div>

        {/* ── Score Breakdown ── */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-5">📊 Score Breakdown</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
            <div className="border rounded-xl p-3 text-center bg-emerald-50 border-emerald-200 text-emerald-700">
              <div className="text-xl mb-1">✅</div>
              <div className="text-xl font-bold">{totalCorrect}</div>
              <div className="text-xs font-medium mt-0.5">Correct</div>
            </div>
            <div className="border rounded-xl p-3 text-center bg-red-50 border-red-200 text-red-600">
              <div className="text-xl mb-1">❌</div>
              <div className="text-xl font-bold">{totalIncorrect}</div>
              <div className="text-xs font-medium mt-0.5">Wrong</div>
            </div>
            <div className="border rounded-xl p-3 text-center bg-gray-50 border-gray-200 text-gray-500">
              <div className="text-xl mb-1">⏭️</div>
              <div className="text-xl font-bold">{totalSkipped}</div>
              <div className="text-xs font-medium mt-0.5">Skipped</div>
            </div>
            <div className="border rounded-xl p-3 text-center bg-emerald-50 border-emerald-200 text-emerald-700">
              <div className="text-xl mb-1">➕</div>
              <div className="text-xl font-bold">+{correctMarks.toFixed(2)}</div>
              <div className="text-xs font-medium mt-0.5">Marks Earned</div>
            </div>
            <div className="border rounded-xl p-3 text-center bg-red-50 border-red-200 text-red-600">
              <div className="text-xl mb-1">➖</div>
              <div className="text-xl font-bold">-{deductedMarks.toFixed(2)}</div>
              <div className="text-xs font-medium mt-0.5">Deducted</div>
            </div>
            <div className={`border rounded-xl p-3 text-center ${isNegativeScore ? "bg-red-50 border-red-400 text-red-700" : "bg-primary-50 border-primary-200 text-primary-700"}`}>
              <div className="text-xl mb-1">🏆</div>
              <div className={`text-xl font-bold ${isNegativeScore ? "text-red-600" : ""}`}>{score.toFixed(2)}</div>
              <div className="text-xs font-medium mt-0.5">Net Score</div>
            </div>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500" style={{ width:`${totalQs > 0 ? (totalCorrect/totalQs)*100 : 0}%` }} />
            <div className="bg-red-400"     style={{ width:`${totalQs > 0 ? (totalIncorrect/totalQs)*100 : 0}%` }} />
            <div className="bg-gray-200 flex-1" />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Correct</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" />Incorrect</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-200 rounded-full" />Skipped</span>
          </div>
        </div>

        {/* ── Deep-dive links ── */}
        <div className="flex flex-wrap gap-3 no-print">
          <Link to={`/test/${testId}/result/${attemptId}/analysis`} className="btn-outline text-sm flex-1 min-w-[140px] text-center">
            📊 Full Analysis
          </Link>
          <Link to={`/test/${testId}/result/${attemptId}/review`} className="btn-outline text-sm flex-1 min-w-[140px] text-center">
            🔍 Review Questions
          </Link>
          <Link to={`/test/${testId}/discussion`} className="btn-outline text-sm flex-1 min-w-[140px] text-center">
            💬 Discussion
          </Link>
          <Link to={`/test/${testId}/leaderboard`} className="btn-outline text-sm flex-1 min-w-[140px] text-center">
            🏆 Leaderboard
          </Link>
        </div>

        <TestAnalysisPanel result={result} />

        {/* ── Question Review ── */}
        <div className="card p-6 print-break-before">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">🔍 Question Review</h3>
            {revisionSet.size > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                ⭐ {revisionSet.size} saved to revision list
              </span>
            )}
          </div>

          {/* Filter tabs */}
          <div className="question-filters no-print flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
            {([
              { key:"all",         label:"All",         count: totalQs,         active:"bg-gray-900 text-white border-gray-900",      inactive:"border-gray-200 text-gray-600" },
              { key:"correct",     label:"Correct",     count: totalCorrect,    active:"bg-emerald-500 text-white border-emerald-500", inactive:"border-emerald-200 text-emerald-700" },
              { key:"wrong",       label:"Wrong",       count: totalIncorrect,  active:"bg-red-500 text-white border-red-500",          inactive:"border-red-200 text-red-600" },
              { key:"unattempted", label:"Unattempted", count: totalSkipped,    active:"bg-gray-400 text-white border-gray-400",        inactive:"border-gray-200 text-gray-500" },
            ] as {key:FilterType;label:string;count:number;active:string;inactive:string}[]).map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setExpandedId(null); setSingleViewId(null); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all whitespace-nowrap flex-shrink-0 ${filter===f.key ? f.active : "bg-white "+f.inactive+" hover:bg-gray-50"}`}>
                {f.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter===f.key?"bg-white/25":"bg-gray-100 text-gray-500"}`}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Palette */}
          <div className="question-palette no-print mb-6">
            <p className="text-xs text-gray-400 mb-2">Click a number to view that question</p>
            <div className="flex flex-wrap gap-2">
              {responses.map((r, i) => (
                <button key={r.questionId} onClick={() => handlePaletteClick(r)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${paletteBg(r)}`}>
                  {i+1}
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
            {filteredResponses.map((r, _idx) => {
              const qs          = r.question;
              const st          = getStatus(r);
              const isExpanded  = printMode || expandedId === r.questionId;
              const inRevision  = revisionSet.has(r.questionId);
              const borderColor = st==="correct"?"border-emerald-200":st==="wrong"?"border-red-200":"border-gray-200";
              const headerBg    = isExpanded
                ? (st==="correct"?"bg-emerald-50":st==="wrong"?"bg-red-50":"bg-gray-50")
                : "hover:bg-gray-50";

              return (
                <div key={r.questionId}
                  ref={el => { questionRefs.current[r.questionId] = el; }}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${borderColor}`}>

                  <button onClick={() => setExpandedId(isExpanded ? null : r.questionId)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-all ${headerBg}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${st==="correct"?"bg-emerald-500 text-white":st==="wrong"?"bg-red-500 text-white":"bg-gray-200 text-gray-600"}`}>
                      {responses.indexOf(r) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {qs.subject && <span className="badge badge-info text-xs">{qs.subject.nameEn}</span>}
                        {qs.difficulty && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            qs.difficulty === "easy"   ? "bg-emerald-100 text-emerald-700" :
                            qs.difficulty === "medium" ? "bg-amber-100 text-amber-700"     :
                            qs.difficulty === "hard"   ? "bg-red-100 text-red-600"         :
                                                         "bg-purple-100 text-purple-700"
                          }`}>
                            {qs.difficulty.charAt(0).toUpperCase() + qs.difficulty.slice(1)}
                          </span>
                        )}
                        {r.timeSpent && <span className="text-xs text-gray-400">⏱ {formatSecs(r.timeSpent)}</span>}
                        <span className={`text-xs font-semibold ml-auto ${st==="correct"?"text-emerald-600":st==="wrong"?"text-red-600":"text-gray-400"}`}>
                          {st==="correct"?"✓ Correct":st==="wrong"?"✗ Wrong":"— Unattempted"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{qs.textEn}</p>
                    </div>
                    <span className="text-gray-400 text-xs flex-shrink-0 ml-2 mt-1">{isExpanded?"▲":"▼"}</span>
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${inRevision?"bg-amber-50 border-amber-400 text-amber-700":"bg-white border-gray-200 text-gray-500 hover:border-amber-300"}`}>
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
                          if (isCorrect && isCandidate) rowCls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                          else if (isCorrect)           rowCls = "border-emerald-400 bg-emerald-50 text-emerald-800";
                          else if (isCandidate)         rowCls = "border-red-400 bg-red-50 text-red-700";
                          return (
                            <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${rowCls}`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect?"bg-emerald-500 text-white":isCandidate?"bg-red-500 text-white":"bg-gray-200 text-gray-500"}`}>
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

        {/* ── Smart CTAs ── */}
        <div className="max-w-4xl mx-auto mb-6">
          {result.isPassed ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-3xl flex-shrink-0">🎉</div>
              <div className="flex-1">
                <p className="font-bold text-emerald-800">Great job — you passed!</p>
                <p className="text-sm text-emerald-600 mt-0.5">Keep the momentum going. Try the next test in the series to maintain your streak.</p>
              </div>
              <Link to="/test-series/group/a" className="btn-primary text-sm flex-shrink-0 whitespace-nowrap">
                Next Test →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-3xl flex-shrink-0">📚</div>
              <div className="flex-1">
                <p className="font-bold text-amber-800">Don't give up — you can do better!</p>
                <p className="text-sm text-amber-600 mt-0.5">
                  {subjectResults.length > 0 ? (
                    <>Focus on your weakest subject to improve your score.</>
                  ) : (
                    <>Review the questions below and practice the topics you struggled with.</>
                  )}
                </p>
              </div>
              <Link to="/dashboard/analytics" className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all flex-shrink-0 whitespace-nowrap">
                View Analytics →
              </Link>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="result-actions no-print flex flex-wrap gap-3 justify-center pb-8">
          {isGuest ? (
            <Link to="/" className="btn-primary">← Back to Home</Link>
          ) : (
            <Link to="/dashboard" className="btn-primary">← Back to Dashboard</Link>
          )}
          {!isGuest && (
            <button
              onClick={() => {
                localStorage.removeItem(`submittedTest_${testId}`);
                localStorage.removeItem(`attemptId_${testId}`);
                navigate(`/test/${testId}/instructions`);
              }}
              className="btn-ghost border border-purple-300 text-purple-700 hover:bg-primary-50"
            >
              🔄 Re-attempt Test
            </button>
          )}
          <Link to="/dashboard/leaderboard" className="btn-outline">🏆 View Leaderboard</Link>
          <button
            onClick={() => {
              const text = `I scored ${pct}% in "${result.test.titleEn}" on MPSC Sadhak! 🎯 #MPSCSadhak`;
              navigator.clipboard.writeText(text).then(() => {
                import("react-hot-toast").then(m => m.default.success("Score copied to clipboard!"));
              });
            }}
            className="btn-ghost border border-gray-200"
          >
            📤 Share Score
          </button>
          <button
            onClick={() => {
              setPrintMode(true);
              setTimeout(() => { window.print(); setPrintMode(false); }, 150);
            }}
            className="btn-ghost border border-gray-200"
          >
            🖨️ Print / Save PDF
          </button>
          {!isGuest && <Link to="/dashboard/my-results" className="btn-ghost border border-gray-200">📋 All Results</Link>}
        </div>

      </div>

      {/* ── Report Question Modal ── */}
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
