import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, BookOpen, BarChart2, Bell, ClipboardList } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { analyticsService, type AnalyticsOverview, type SubjectAnalytic } from "../../services/analyticsService";
import { userService, type MyResult } from "../../services/userService";
import { api } from "../../lib/api";
import { Skeleton, SkeletonKPICard } from "../../components/common/Skeleton";
import SubjectStrengthCard from "../../components/analytics/SubjectStrengthCard";
import AccuracyTrendCard from "../../components/analytics/AccuracyTrendCard";
import StudyPlanModal, { getTodaysPlan, markTodayDone, getPlanProgress } from "./StudyPlanModal";
import { DEMO_MODE } from "@/lib/demoMode";


const MOCK_OVERVIEW: AnalyticsOverview = {
  avgScore: 72, testsCompleted: 24, currentStreak: 12,
  totalCorrect: 1440, totalAttempted: 2100, longestStreak: 21,
};

const MOCK_SUBJECTS: SubjectAnalytic[] = [
  { subjectId: "history",         subject: "History",         correct: 142, total: 180, accuracy: 79 },
  { subjectId: "geography",       subject: "Geography",       correct: 96,  total: 150, accuracy: 64 },
  { subjectId: "polity",          subject: "Polity",          correct: 110, total: 200, accuracy: 55 },
  { subjectId: "economy",         subject: "Economy",         correct: 58,  total: 140, accuracy: 41 },
  { subjectId: "current-affairs", subject: "Current Affairs", correct: 88,  total: 120, accuracy: 73 },
];
const MOCK_SUBJECT_MAP: Record<string, string> = Object.fromEntries(MOCK_SUBJECTS.map(s => [s.subjectId, s.subject]));

const QUICK_LINKS = [
  { to: "/dashboard/my-tests",      icon: ClipboardList, label: "My Tests",      sub: "Continue where you left off", color: "text-primary-600",  bg: "bg-primary-50  hover:bg-primary-100  border-primary-100" },
  { to: "/dashboard/analytics",     icon: BarChart2,     label: "Analytics",     sub: "View your performance",       color: "text-primary-600",     bg: "bg-primary-50     hover:bg-primary-100     border-primary-100" },
  { to: "/dashboard/study-material",icon: BookOpen,      label: "Study Material",sub: "PDFs, Notes, Current Affairs", color: "text-emerald-600", bg: "bg-emerald-50  hover:bg-emerald-100  border-emerald-100" },
  { to: "/dashboard/notifications",  icon: Bell,          label: "Notifications", sub: "Latest updates",              color: "text-amber-600",    bg: "bg-amber-50    hover:bg-amber-100    border-amber-100" },
];

const PRACTICE_SHORTCUTS = [
  { to: "/dashboard/daily-practice", icon: "📅", label: "Daily",    color: "bg-amber-50   text-amber-700   border-amber-200" },
  { to: "/dashboard/flashcards",     icon: "🃏", label: "Flashcards",color: "bg-primary-50  text-purple-700  border-primary-200" },
  { to: "/test-series/group/a",      icon: "🏛️", label: "Group A",   color: "bg-primary-50 text-primary-700 border-primary-200" },
  { to: "/test-series/group/b",      icon: "👮", label: "Group B",   color: "bg-sky-50     text-sky-700     border-sky-200" },
];

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const r = 18; const c = 2 * Math.PI * r;
  const filled = (pct / 100) * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none"
        stroke={passed ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444"}
        strokeWidth="4" strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round" transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700"
        fill={passed ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626"}>
        {pct}%
      </text>
    </svg>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const examDateKey = `examDate_${user?.id ?? "guest"}`;
  const [examDate,      setExamDate]      = useState<string>(() => localStorage.getItem(examDateKey) ?? "");
  const [showDateInput, setShowDateInput] = useState(false);
  const [tempDate,      setTempDate]      = useState("");

  const daysLeft = examDate
    ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
    : null;
  const dailyTarget = daysLeft && daysLeft > 0 ? Math.ceil(500 / daysLeft) : null;
  const examLabel = user?.profile?.targetExam ?? "your exam";
  const countdownColor = daysLeft === null ? "" : daysLeft > 90 ? "border-emerald-200 bg-emerald-50" : daysLeft > 30 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";
  const countdownTextColor = daysLeft === null ? "" : daysLeft > 90 ? "text-emerald-800" : daysLeft > 30 ? "text-amber-800" : "text-red-800";

  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["analytics", "overview"],
    queryFn:  () => analyticsService.getOverview(),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? MOCK_OVERVIEW : undefined,
  });

  const { data: recentResults = [], isLoading: resultsLoading } = useQuery<MyResult[]>({
    queryKey: ["my-results-dashboard"],
    queryFn:  () => userService.getMyResults(),
    enabled:  !DEMO_MODE,
    select:   (d) => d.slice(0, 5),
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications-dashboard"],
    queryFn:  () => userService.getNotifications(true),
    enabled:  !DEMO_MODE,
  });

  const { data: weakTopics = [] } = useQuery({
    queryKey: ["weak-topics-dashboard"],
    queryFn:  () => analyticsService.getWeakTopics(),
    enabled:  !DEMO_MODE,
  });

  const { data: subjectAnalytics = [] } = useQuery<SubjectAnalytic[]>({
    queryKey: ["analytics", "subjects"],
    queryFn:  () => analyticsService.getSubjectAnalytics(),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? MOCK_SUBJECTS : undefined,
  });

  const { data: subjectMap = {} } = useQuery<Record<string, string>>({
    queryKey: ["subjects-name-map"],
    queryFn:  () => api.get<any[]>("/subjects").then(list => {
      const map: Record<string, string> = {};
      (list ?? []).forEach((s: any) => { map[s.id] = s.nameEn; });
      return map;
    }),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? MOCK_SUBJECT_MAP : undefined,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const streak    = overview?.currentStreak ?? 0;
  const noTests   = !overviewLoading && (overview?.testsCompleted ?? 0) === 0;

  const isUnverified = user && !user.isVerified;

  const activeSub = user?.subscriptions?.[0];
  const daysToExpiry = activeSub?.endDate
    ? Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const showRenewalBanner = daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry > 0 && activeSub?.plan !== "free";

  const criticalWeakTopics = (weakTopics as any[]).filter((t: any) => t.accuracy < 50).slice(0, 3);

  const userId = user?.id ?? "guest";
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTick,      setPlanTick]      = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todaysPlan   = (() => getTodaysPlan(userId))();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const planProgress = (() => getPlanProgress(userId))();
  void planTick; // used to trigger re-render after mark-done / generate
  const weakSubjectsForPlan = criticalWeakTopics.map((t: any) => t.subjectId);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Email verification banner ──────────────────────────────────────── */}
      {isUnverified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-500">⚠️</span>
            <p className="text-sm font-medium text-amber-800">Please verify your email address to unlock all features.</p>
          </div>
          <button
            onClick={() => {
              if (user?.email) {
                import("../../lib/api").then(({ api }) => {
                  api.post("/auth/resend-verification", { email: user.email })
                    .then(() => import("react-hot-toast").then(({ default: t }) => t.success("Verification email sent!")))
                    .catch(() => import("react-hot-toast").then(({ default: t }) => t.error("Failed to send verification email. Please try again.")));
                });
              }
            }}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
          >
            Resend Email
          </button>
        </div>
      )}

      {/* ── Subscription renewal banner ────────────────────────────────────── */}
      {showRenewalBanner && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-red-500">⏰</span>
            <p className="text-sm font-medium text-red-800">
              Your <strong className="capitalize">{activeSub?.plan}</strong> plan expires in {daysToExpiry} day{daysToExpiry !== 1 ? "s" : ""} — renew to keep access.
            </p>
          </div>
          <Link to="/dashboard/subscription" className="text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">
            Renew Now →
          </Link>
        </div>
      )}

      {/* ── Welcome row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Hi, {firstName}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {user?.profile?.targetExam
              ? `Preparing for ${user.profile.targetExam}`
              : "Welcome back to your dashboard"}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-sm font-bold text-amber-700">{streak}-day streak</div>
              <div className="text-[10px] text-amber-500 leading-tight">Keep it up!</div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4 KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : [
              {
                label:  "Avg Score",
                value:  `${overview?.avgScore ?? "—"}%`,
                icon:   "🎯",
                sub:    `${overview?.testsCompleted ?? 0} tests taken`,
                accent: "bg-primary-50 border-primary-200",
                text:   "text-primary-700",
              },
              {
                label:  "Correct Answers",
                value:  (overview?.totalCorrect ?? 0).toLocaleString(),
                icon:   "✅",
                sub:    `of ${(overview?.totalAttempted ?? 0).toLocaleString()} attempted`,
                accent: "bg-emerald-50 border-emerald-200",
                text:   "text-emerald-700",
              },
              {
                label:  "Current Streak",
                value:  `${streak} days`,
                icon:   "🔥",
                sub:    `Best: ${overview?.longestStreak ?? 0} days`,
                accent: "bg-amber-50 border-amber-200",
                text:   "text-amber-700",
              },
              {
                label:  "Tests Completed",
                value:  overview?.testsCompleted ?? 0,
                icon:   "📝",
                sub:    "Submitted attempts",
                accent: "bg-primary-50 border-primary-200",
                text:   "text-primary-700",
              },
            ].map((k) => (
              <div key={k.label} className={`rounded-2xl border p-4 ${k.accent}`}>
                <div className="text-2xl mb-2">{k.icon}</div>
                <div className={`text-2xl font-bold ${k.text}`}>{k.value}</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">{k.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
              </div>
            ))
        }
      </div>

      {/* ── Answer Accuracy Trend ────────────────────────────────────────────── */}
      {!overviewLoading && (overview?.testsCompleted ?? 0) > 0 && (
        <AccuracyTrendCard currentAccuracy={overview?.avgScore ?? 60} />
      )}

      {/* ── Exam Countdown ────────────────────────────────────────────────── */}
      {!showDateInput && examDate && daysLeft !== null ? (
        <div className={`rounded-2xl border p-4 flex items-center gap-4 flex-wrap ${countdownColor}`}>
          <div className="text-3xl flex-shrink-0">📅</div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${countdownTextColor}`}>
              {daysLeft === 0 ? "Exam day is today! All the best! 🎯" : `${daysLeft} days left to ${examLabel}`}
            </p>
            {dailyTarget && daysLeft > 0 && (
              <p className={`text-xs mt-0.5 ${countdownTextColor} opacity-75`}>
                Daily target: ~{dailyTarget} questions/day to cover full syllabus
              </p>
            )}
          </div>
          <button onClick={() => { setTempDate(examDate); setShowDateInput(true); }}
            className={`text-xs font-semibold underline flex-shrink-0 ${countdownTextColor} opacity-60 hover:opacity-100`}>
            Change date
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 flex items-center gap-4 flex-wrap">
          <div className="text-3xl flex-shrink-0">📅</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-primary-800">Set your exam date to track your countdown</p>
            <p className="text-xs text-primary-600 mt-0.5">We'll show daily targets based on the days remaining</p>
          </div>
          {showDateInput ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="date"
                value={tempDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setTempDate(e.target.value)}
                className="text-xs border border-primary-300 rounded-lg px-2 py-1.5 bg-white"
              />
              <button
                onClick={() => {
                  if (tempDate) { localStorage.setItem(examDateKey, tempDate); setExamDate(tempDate); }
                  setShowDateInput(false);
                }}
                className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Save
              </button>
              <button onClick={() => setShowDateInput(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
          ) : (
            <button onClick={() => { setTempDate(""); setShowDateInput(true); }}
              className="text-xs font-semibold bg-primary-600 text-white px-4 py-2 rounded-xl flex-shrink-0">
              Set Date →
            </button>
          )}
        </div>
      )}

      {/* ── Weak Topic Drill ──────────────────────────────────────────────── */}
      {criticalWeakTopics.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">⚠️ Topics Needing Attention</h2>
            <Link to="/dashboard/analytics" className="text-xs text-primary-600 font-semibold hover:underline">
              Full Analysis →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {criticalWeakTopics.map((t: any) => (
              <div key={t.subjectId} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-xs">{t.accuracy}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.subjectId}</p>
                  <p className="text-xs text-gray-400">{t.correct}/{t.total} correct · needs improvement</p>
                </div>
                <Link to="/test-series/group/a"
                  className="text-xs bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-semibold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0">
                  Practice →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Subject Strength ──────────────────────────────────────────────── */}
      {subjectAnalytics.length > 0 && (
        <SubjectStrengthCard subjects={subjectAnalytics} subjectMap={subjectMap} />
      )}

      {/* ── Study Plan Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">📖 Today's Study Plan</h2>
          <button
            onClick={() => setShowPlanModal(true)}
            className="text-xs text-primary-600 font-semibold hover:underline"
          >
            {planProgress.total > 0 ? "Regenerate" : "Generate Plan →"}
          </button>
        </div>

        {planProgress.total > 0 && (
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{planProgress.done} of {planProgress.total} topics completed</span>
              <span className="font-semibold text-primary-600">
                {Math.round((planProgress.done / planProgress.total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${(planProgress.done / planProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-5">
          {todaysPlan ? (
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${todaysPlan.done ? "bg-emerald-100" : "bg-primary-100"}`}>
                {todaysPlan.done ? "✅" : "📚"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{todaysPlan.topic}</p>
                <p className="text-xs text-gray-400 mt-0.5">{todaysPlan.subject}</p>
              </div>
              {!todaysPlan.done && (
                <button
                  onClick={() => { markTodayDone(userId); setPlanTick(r => r + 1); }}
                  className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                >
                  Mark Done ✓
                </button>
              )}
            </div>
          ) : planProgress.total > 0 ? (
            <div className="text-center py-4 text-gray-400">
              <p className="text-sm font-medium">🎉 All topics for today are done!</p>
              <p className="text-xs mt-1">Come back tomorrow for the next topic.</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">No study plan yet. Generate one based on your exam date.</p>
              <button onClick={() => setShowPlanModal(true)} className="btn-primary text-xs">
                Generate My Plan →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Study Plan Modal */}
      {showPlanModal && (
        <StudyPlanModal
          examDate={examDate}
          userId={userId}
          weakSubjects={weakSubjectsForPlan}
          onClose={() => setShowPlanModal(false)}
          onGenerated={() => setPlanTick(r => r + 1)}
        />
      )}

      {/* ── Get started banner (shown only when 0 tests taken) ────────────── */}
      {noTests && (
        <div className="rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ background: "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#f59e0b 100%)" }}>
          <div className="flex-1">
            <p className="font-bold text-lg">Start your first free test →</p>
            <p className="text-white/70 text-sm mt-0.5">No login required for free tests. Group A has 5 free tests to start with.</p>
          </div>
          <Link to="/test-series/group/a"
            className="bg-white text-primary-700 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all whitespace-nowrap flex-shrink-0">
            Browse Free Tests
          </Link>
        </div>
      )}

      {/* ── Main 2-column grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: Recent Results (3 col) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Recent Tests</h2>
            <Link to="/dashboard/my-results"
              className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
              All Results <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {resultsLoading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm font-medium text-gray-500">No tests completed yet</p>
              <p className="text-xs mt-1 mb-4">Take a free test and your results will appear here</p>
              <Link to="/test-series/group/a" className="btn-primary text-xs">
                Start Free Test →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentResults.map((r) => {
                const pct = Math.round(Number(r.percentage));
                return (
                  <Link key={r.id} to={`/test/${r.testId}/result/${r.attemptId}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <ScoreRing pct={pct} passed={r.isPassed} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate leading-snug">
                        {r.test.titleEn}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.attempt.submittedAt
                          ? new Date(r.attempt.submittedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
                          : ""}
                        {r.rank ? ` · Rank #${r.rank}` : ""}
                        {" · "}{r.correct}✓ {r.incorrect}✗
                      </p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${r.isPassed ? "text-emerald-600" : "text-red-500"}`}>
                      {r.isPassed ? "Passed" : "Failed"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Links + Practice (2 col) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Quick Access</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                const isNotif = link.to === "/dashboard/notifications";
                return (
                  <Link key={link.to} to={link.to}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${link.bg}`}>
                      <Icon className={`w-4 h-4 ${link.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{link.label}</p>
                        {isNotif && unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{link.sub}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Practice shortcuts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h2 className="font-bold text-gray-900 text-sm mb-3">Practice</h2>
            <div className="grid grid-cols-3 gap-2">
              {PRACTICE_SHORTCUTS.map((s) => (
                <Link key={s.to} to={s.to}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border text-center transition-all hover:shadow-sm ${s.color}`}>
                  <span className="text-xl leading-none">{s.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
