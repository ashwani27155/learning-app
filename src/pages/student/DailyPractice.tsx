import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { analyticsService } from "../../services/analyticsService";
import { userService } from "../../services/userService";
import { usePracticeQuestions, type PracticeQuestion } from "../../lib/usePracticeQuestions";
import { DAILY_QUESTIONS } from "../../lib/demoFixtures";
import { DEMO_MODE } from "../../lib/demoMode";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function DailyPractice() {
  const [current, setCurrent]         = useState(0);
  const [selected, setSelected]       = useState<Record<number, string>>({});
  const [revealed, setRevealed]       = useState<Record<number, boolean>>({});
  const [done, setDone]               = useState(false);
  const [timeLeft, setTimeLeft]       = useState(10 * 60);
  const [sessionQuestions, setSessionQuestions] = useState<PracticeQuestion[]>([]);
  const [loadingAdaptive, setLoadingAdaptive]   = useState(true);
  const [isAdaptive, setIsAdaptive]             = useState(false);
  const [streak, setStreak]                     = useState(0);

  const { questions: pool, isLoading: poolLoading } = usePracticeQuestions("daily", { limit: 30 }, DAILY_QUESTIONS);

  useEffect(() => {
    if (DEMO_MODE) { setStreak(12); return; }
    userService.getStreak().then(s => setStreak(s.currentStreak)).catch(() => {});
  }, []);

  // Build adaptive question set once the pool of candidate questions is ready
  useEffect(() => {
    if (poolLoading || pool.length === 0) return;
    analyticsService.getWeakTopics()
      .then((weakTopics: any[]) => {
        if (!weakTopics || weakTopics.length === 0) {
          setSessionQuestions(shuffle(pool).slice(0, 10));
          return;
        }
        const weakSubjects = new Set(weakTopics.map((w: any) => w.subjectId));
        const weakQs  = pool.filter(q => weakSubjects.has(q.subject));
        const otherQs = pool.filter(q => !weakSubjects.has(q.subject));
        const target7 = shuffle(weakQs).slice(0, 7);
        const target3 = shuffle(otherQs).slice(0, 3);
        const combined = [...target7, ...target3];
        if (combined.length === 10) {
          setSessionQuestions(shuffle(combined));
          setIsAdaptive(true);
        } else {
          setSessionQuestions(shuffle(pool).slice(0, 10));
        }
      })
      .catch(() => {
        setSessionQuestions(shuffle(pool).slice(0, 10));
      })
      .finally(() => setLoadingAdaptive(false));
  }, [poolLoading, pool]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [done]);

  if (loadingAdaptive || sessionQuestions.length === 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="card p-6 animate-pulse h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  const q       = sessionQuestions[current];
  const mins    = Math.floor(timeLeft / 60);
  const secs    = timeLeft % 60;
  const correct = Object.entries(selected).filter(([i, ans]) => sessionQuestions[Number(i)].correct === ans).length;

  const handleSelect = (optId: string) => {
    if (revealed[current]) return;
    setSelected(p => ({ ...p, [current]: optId }));
    setRevealed(p => ({ ...p, [current]: true }));
  };

  const handleNext = () => {
    if (current < sessionQuestions.length - 1) {
      setCurrent(c => c + 1);
      return;
    }
    setDone(true);
    if (!DEMO_MODE) {
      userService.completeDailyQuiz().then(s => setStreak(s.currentStreak)).catch(() => {});
    }
  };

  if (done) {
    const pct = Math.round((correct / sessionQuestions.length) * 100);
    return (
      <div className="space-y-6">
        <div className="page-header"><h1 className="page-title">Daily Practice — Result</h1></div>
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="text-6xl font-bold text-primary-600 mb-2">{pct}%</div>
          <div className="text-xl font-bold text-gray-900 mb-1">{correct}/{sessionQuestions.length} correct</div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mt-2">
            🔥 Streak: {streak} days!
          </div>
          <p className="text-gray-400 text-sm mt-4">Come back tomorrow to maintain your streak.</p>
          <div className="flex gap-3 mt-6">
            <Link to="/dashboard" className="flex-1 btn-ghost border border-gray-200 justify-center">Dashboard</Link>
            <Link to="/dashboard/analytics" className="flex-1 btn-primary justify-center">View Analytics</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">📅 Daily Practice</h1>
          <p className="page-subtitle">
            10 questions · {streak} day streak
            {isAdaptive && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Adaptive</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <span>🔥</span><span className="text-sm font-bold text-amber-700">{streak} days</span>
          </div>
          <div className={`text-sm font-bold px-3 py-1.5 rounded-xl ${timeLeft<120?"bg-red-100 text-red-600 animate-pulse":"bg-gray-100 text-gray-700"}`}>
            ⏱ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Question {current+1} of {sessionQuestions.length}</span>
          <span>{Object.keys(selected).length} answered</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width:`${((current+1)/sessionQuestions.length)*100}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="badge badge-info text-xs">{q.subject}</span>
          <span className="text-xs text-gray-400">Q{current+1}</span>
        </div>
        <p className="text-base font-semibold text-gray-900 leading-relaxed">{q.text}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isSelected = selected[current] === opt.id;
            const isCorrect  = opt.id === q.correct;
            const isRevealed = revealed[current];
            let cls = "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 cursor-pointer";
            if (isRevealed && isCorrect)                   cls = "border-emerald-400 bg-emerald-50 cursor-default";
            else if (isRevealed && isSelected && !isCorrect) cls = "border-red-400 bg-red-50 cursor-default";
            else if (isRevealed)                            cls = "border-gray-200 bg-gray-50 opacity-60 cursor-default";

            return (
              <button key={opt.id} onClick={() => handleSelect(opt.id)} disabled={isRevealed}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${cls}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isRevealed && isCorrect ? "bg-emerald-500 text-white" :
                  isRevealed && isSelected ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                }`}>{String.fromCharCode(65 + idx)}</div>
                <span className="text-sm flex-1">{opt.text}</span>
                {isRevealed && isCorrect   && <span className="text-emerald-600 text-xs font-bold">✓ Correct</span>}
                {isRevealed && isSelected && !isCorrect && <span className="text-red-600 text-xs font-bold">✗ Wrong</span>}
              </button>
            );
          })}
        </div>

        {/* Explanation after reveal */}
        {revealed[current] && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-gray-800 leading-relaxed">
            <span className="text-primary-600 font-semibold text-xs block mb-1">💡 Explanation</span>
            {q.explanation}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button disabled={current === 0} onClick={() => setCurrent(c=>c-1)} className="btn-ghost border border-gray-200 disabled:opacity-40">← Prev</button>
        {revealed[current] ? (
          <button onClick={handleNext} className="btn-primary flex-1 justify-center">
            {current === sessionQuestions.length-1 ? "Finish 🎉" : "Next →"}
          </button>
        ) : (
          <button disabled className="flex-1 btn-ghost border border-gray-200 opacity-40 justify-center">Select an answer to continue</button>
        )}
      </div>
    </div>
  );
}
