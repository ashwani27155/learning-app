import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { testSeriesService, type TestSeriesItem } from "../../services/testSeriesService";
import { useAuth } from "../../context/AuthContext";

const GROUP_META: Record<string, { label: string; subtitle: string; icon: string; description: string }> = {
  a: {
    label: "Group A — Gazetted Posts",
    subtitle: "Rajyaseva, Class-I & Class-II Officers",
    icon: "🏛️",
    description: "Prepare for Maharashtra Rajyaseva, Deputy Collector, DSP, and other Class-I & II gazetted officer posts.",
  },
  b: {
    label: "Group B — Non-Gazetted Posts",
    subtitle: "PSI, STI, ASO Combined",
    icon: "👮",
    description: "Comprehensive test series for Police Sub-Inspector, Sales Tax Inspector, Assistant Section Officer, and other non-gazetted posts.",
  },
  c: {
    label: "Group C — Technical Posts",
    subtitle: "Junior Engineer & Related",
    icon: "⚙️",
    description: "Focused preparation for Junior Engineer, Technical Assistant, and other technical/departmental posts under MPSC.",
  },
  d: {
    label: "Group D — Class IV Posts",
    subtitle: "Support Staff & Ministerial",
    icon: "📋",
    description: "Test series for Clerk, Peon, and other Class-IV support staff posts under Maharashtra government departments.",
  },
};

const OTHER_GROUPS = [
  { key: "a", label: "Group A", icon: "🏛️" },
  { key: "b", label: "Group B", icon: "👮" },
  { key: "c", label: "Group C", icon: "⚙️" },
  { key: "d", label: "Group D", icon: "📋" },
];

function TestCard({ test, isFree, index }: { test: TestSeriesItem["tests"][number]; isFree: boolean; index: number }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (!isFree && !isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    // Whether this user's plan actually unlocks this premium series is a
    // server-side question (their subscription may already cover it) —
    // let the test-attempt flow ask the real API rather than guessing here
    // and blocking already-subscribed users.
    navigate(`/test/${test.id}/instructions`);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${isFree ? "border-emerald-100 hover:border-emerald-300" : "border-gray-200 hover:border-amber-200"}`}>
      {/* Top row: number + badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {index}
        </span>
        {isFree ? (
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full">
            FREE
          </span>
        ) : (
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1">
            🔒 PREMIUM
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-3 flex-1 line-clamp-2">
        {test.titleEn}
      </h4>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-800">{test.duration} min</div>
          <div className="text-[10px] text-gray-400">Duration</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-800">{Number(test.totalMarks)}</div>
          <div className="text-[10px] text-gray-400">Marks</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-800">{test.passingPct}%</div>
          <div className="text-[10px] text-gray-400">Pass %</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-xs font-bold text-gray-800">{test.attemptCount > 999 ? `${(test.attemptCount / 1000).toFixed(1)}k` : test.attemptCount}</div>
          <div className="text-[10px] text-gray-400">Attempts</div>
        </div>
      </div>

      {test.negativeMarking && (
        <p className="text-[10px] text-rose-500 font-medium mb-3 flex items-center gap-1">
          ➖ Negative marking applies
        </p>
      )}

      {/* Action button */}
      {isFree ? (
        <button
          onClick={handleStart}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          Start Test →
        </button>
      ) : isAuthenticated ? (
        <button
          onClick={handleStart}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          Subscribe to Unlock
        </button>
      ) : (
        <Link
          to="/auth/login"
          className="block w-full text-center border border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600 text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          Login to Access
        </Link>
      )}
    </div>
  );
}

function SeriesCard({ series, enrolled, onEnroll, enrolling }: {
  series: TestSeriesItem;
  enrolled: boolean;
  onEnroll: (id: string) => void;
  enrolling: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const freeCount = series.isPremium ? 0 : series.tests.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Series header — clickable to collapse. A <div role="button">, not a
          real <button>, because it contains its own nested "Enroll" button —
          buttons can't validly nest inside buttons in HTML. */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
      >
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 text-lg flex-shrink-0">
          📚
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{series.titleEn}</span>
            {series.isPremium ? (
              <span className="badge badge-warning">Premium</span>
            ) : (
              <span className="badge badge-success">Free</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            <span>📝 {series.tests.length} Tests</span>
            {freeCount > 0 && <span className="text-emerald-600 font-medium">✓ {freeCount} Free</span>}
            <span>👥 {series.enrolledCount.toLocaleString()} enrolled</span>
          </div>
        </div>
        {!series.isPremium && (
          <div className="flex-shrink-0 mr-2" onClick={e => e.stopPropagation()}>
            {enrolled ? (
              <span className="text-xs font-semibold text-emerald-600 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                ✓ Enrolled
              </span>
            ) : (
              <button
                onClick={() => onEnroll(series.id)}
                disabled={enrolling}
                className="text-xs font-semibold text-primary-600 px-3 py-1.5 bg-primary-50 rounded-xl border border-primary-200 hover:bg-primary-100 transition-all disabled:opacity-60"
              >
                {enrolling ? "…" : "+ Enroll Free"}
              </button>
            )}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Test cards grid */}
      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {series.tests.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No tests published yet. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {series.tests.map((test, i) => (
                <TestCard key={test.id} test={test} isFree={!series.isPremium || test.isFree} index={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fallback demo cards when DB has no series for this group
function EmptyGroupState({ meta }: { meta: typeof GROUP_META[string] }) {
  const DEMO_TESTS = [
    { id: "demo-1", title: `${meta.label.split(" — ")[0]} Free Mock Test 1`,  duration: 60, marks: 100, passingPct: 40, attempts: 24500, negativeMarking: true },
    { id: "demo-2", title: `${meta.label.split(" — ")[0]} Free Mock Test 2`,  duration: 60, marks: 100, passingPct: 40, attempts: 18200, negativeMarking: true },
    { id: "demo-3", title: `Subject Test — Marathi Language`,                 duration: 30, marks: 50,  passingPct: 40, attempts: 12400, negativeMarking: false },
    { id: "demo-4", title: `Subject Test — General Studies`,                  duration: 30, marks: 50,  passingPct: 40, attempts: 9800,  negativeMarking: false },
    { id: "demo-5", title: `Subject Test — History & Geography`,              duration: 30, marks: 50,  passingPct: 40, attempts: 8300,  negativeMarking: false },
    { id: "demo-6", title: `Subject Test — Current Affairs 2026`,             duration: 20, marks: 40,  passingPct: 40, attempts: 6100,  negativeMarking: false },
  ];

  return (
    <div>
      <div className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-3 mb-5 text-sm text-primary-700">
        No live tests published yet for this group. Preview cards below are for demo only.
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 text-lg">📚</div>
          <div>
            <span className="font-bold text-gray-900 text-sm">{meta.label} — Free Test Series</span>
            <div className="text-xs text-gray-400 mt-0.5">6 demo tests • No login required</div>
          </div>
          <span className="ml-auto badge badge-success">Free</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {DEMO_TESTS.map((t, i) => (
            <div key={t.id} className="relative flex flex-col rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full">FREE</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-3 flex-1 line-clamp-2">{t.title}</h4>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-xs font-bold text-gray-800">{t.duration} min</div>
                  <div className="text-[10px] text-gray-400">Duration</div>
                </div>
                <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-xs font-bold text-gray-800">{t.marks}</div>
                  <div className="text-[10px] text-gray-400">Marks</div>
                </div>
                <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-xs font-bold text-gray-800">{t.passingPct}%</div>
                  <div className="text-[10px] text-gray-400">Pass %</div>
                </div>
                <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center">
                  <div className="text-xs font-bold text-gray-800">{t.attempts > 999 ? `${(t.attempts / 1000).toFixed(1)}k` : t.attempts}</div>
                  <div className="text-[10px] text-gray-400">Attempts</div>
                </div>
              </div>
              {t.negativeMarking && (
                <p className="text-[10px] text-rose-500 font-medium mb-3">➖ Negative marking applies</p>
              )}
              <button
                disabled
                title="This is a preview card — the real test isn't published yet"
                className="block w-full text-center bg-gray-200 text-gray-400 text-xs font-semibold py-2.5 rounded-xl cursor-not-allowed"
              >
                Preview Only
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroupTestsPage() {
  const { group = "a" } = useParams<{ group: string }>();
  const navigate = useNavigate();
  const meta = GROUP_META[group.toLowerCase()] ?? GROUP_META["a"];

  const [series,      setSeries]      = useState<TestSeriesItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState<"all" | "free" | "premium">("all");
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState<"default" | "attempts" | "shortest">("default");
  const [enrolled,    setEnrolled]    = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");
    setSeries([]);
    const promises: Promise<any>[] = [
      testSeriesService.getByGroup(group.toLowerCase()),
    ];
    if (isAuthenticated) {
      promises.push(testSeriesService.getEnrolled().catch(() => []));
    }
    Promise.all(promises)
      .then(([seriesData, enrolledData]) => {
        setSeries(seriesData);
        if (enrolledData) {
          setEnrolled(new Set((enrolledData as any[]).map((e: any) => e.id)));
        }
      })
      .catch((e) => {
        // Network error means backend is not running — fall through to demo state
        if (e instanceof TypeError || e.message === "Failed to fetch") return;
        setError(e.message ?? "Failed to load tests");
      })
      .finally(() => setLoading(false));
  }, [group, isAuthenticated]);

  const filteredSeries = series
    .filter(s => {
      if (filter === "free")    return !s.isPremium;
      if (filter === "premium") return s.isPremium;
      return true;
    })
    .map(s => ({
      ...s,
      tests: s.tests
        .filter(t => !search || t.titleEn.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          if (sortBy === "attempts") return b.attemptCount - a.attemptCount;
          if (sortBy === "shortest") return a.duration - b.duration;
          return a.orderIndex - b.orderIndex;
        }),
    }))
    .filter(s => s.tests.length > 0 || !search);

  const totalTests = series.reduce((acc, s) => acc + s.tests.length, 0);
  const freeTests  = series.filter((s) => !s.isPremium).reduce((acc, s) => acc + s.tests.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Group header ── */}
      <div style={{ background: "linear-gradient(135deg, #030108 0%, #6d28d9 55%, #7c3aed 100%)" }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/60 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Test Series</span>
            <span>/</span>
            <span className="text-white">{meta.label.split(" — ")[0]}</span>
          </div>

          <div className="flex items-start gap-5">
            <div className="text-4xl">{meta.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{meta.label}</h1>
              <p className="text-white/70 text-sm mb-4">{meta.description}</p>
              {!loading && (
                <div className="flex gap-4 text-sm">
                  <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                    <div className="font-bold text-lg">{totalTests}</div>
                    <div className="text-white/60 text-xs">Total Tests</div>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2 text-center">
                    <div className="font-bold text-lg text-emerald-300">{freeTests}</div>
                    <div className="text-white/60 text-xs">Free Tests</div>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                    <div className="font-bold text-lg">{series.length}</div>
                    <div className="text-white/60 text-xs">Series</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Group navigation tabs ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {OTHER_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => navigate(`/test-series/group/${g.key}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                group.toLowerCase() === g.key
                  ? "bg-primary-600 text-white shadow"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              <span>{g.icon}</span>
              {g.label}
            </button>
          ))}
        </div>

        {/* ── Search + Filter + Sort ── */}
        {series.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                className="input-field pl-9 bg-white"
                placeholder="Search tests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(["all", "free", "premium"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"}`}>
                  {f === "free" ? "✓ Free" : f === "premium" ? "🔒 Premium" : "All"}
                </button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="input-field w-auto bg-white text-sm">
              <option value="default">Default order</option>
              <option value="attempts">Most attempted</option>
              <option value="shortest">Shortest first</option>
            </select>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Loading tests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary text-sm">Try Again</button>
          </div>
        ) : filteredSeries.length === 0 && series.length === 0 ? (
          <EmptyGroupState meta={meta} />
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No {filter} tests found in this group.</p>
            <button onClick={() => setFilter("all")} className="mt-3 text-primary-600 text-sm font-medium hover:underline">Show all</button>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredSeries.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                enrolled={enrolled.has(s.id)}
                enrolling={enrollingId === s.id}
                onEnroll={async (id) => {
                  if (!isAuthenticated) { navigate("/auth/login"); return; }
                  setEnrollingId(id);
                  try {
                    await testSeriesService.enroll(id);
                    setEnrolled(prev => new Set([...prev, id]));
                  } catch (e: any) {
                    toast.error(e.message ?? "Failed to enroll. Please try again.");
                  } finally { setEnrollingId(null); }
                }}
              />
            ))}
          </div>
        )}

        {/* ── Sign-up nudge ── */}
        {!loading && !error && (
          <div className="mt-10 rounded-2xl p-6 text-center text-white" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 100%)" }}>
            <h3 className="text-lg font-bold mb-1">Start Preparing for Free</h3>
            <p className="text-white/70 text-sm mb-4">
              All free tests are open to everyone — no login needed. Create an account to save your progress and track analytics.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/auth/register" className="bg-white text-primary-700 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
                Sign Up Free
              </Link>
              <Link to="/auth/login" className="border border-white/30 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
