import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService, type MyTest } from "../../services/userService";
import { DEMO_MODE } from "@/lib/demoMode";
import { Skeleton } from "../../components/common/Skeleton";


const MOCK_TESTS: MyTest[] = [
  {
    id: "demo-enroll-1",
    enrolledAt: "2026-01-15T10:00:00Z",
    series: {
      id: "series-1",
      titleEn: "MPSC Rajyaseva Mock Test Series 2026",
      titleMr: "एमपीएससी राज्यसेवा मॉक टेस्ट सिरीज 2026",
      groupType: "GROUP_A",
      type: "MOCK",
      isPremium: false,
      tests: [
        { id: "demo-test-1", titleEn: "Rajyaseva Mock Test #1 – GS Paper I",        status: "published" },
        { id: "demo-test-2", titleEn: "Rajyaseva Mock Test #2 – GS Paper II",       status: "published" },
        { id: "demo-test-3", titleEn: "Rajyaseva Mock Test #3 – Marathi Language",  status: "published" },
        { id: "demo-test-4", titleEn: "Rajyaseva Mock Test #4 – History & Geo",     status: "published" },
      ],
    },
  },
  {
    id: "demo-enroll-2",
    enrolledAt: "2026-02-20T10:00:00Z",
    series: {
      id: "series-2",
      titleEn: "PSI / STI / ASO Combined Test Series",
      titleMr: "पीएसआय / एसटीआय / एएसओ एकत्रित टेस्ट सिरीज",
      groupType: "GROUP_B",
      type: "SECTIONAL",
      isPremium: false,
      tests: [
        { id: "demo-test-5", titleEn: "History & Geography – Sectional Test 1", status: "published" },
        { id: "demo-test-6", titleEn: "Polity & Economy – Sectional Test 1",    status: "published" },
      ],
    },
  },
  {
    id: "demo-enroll-3",
    enrolledAt: "2026-03-10T10:00:00Z",
    series: {
      id: "series-3",
      titleEn: "CSAT Speed Test Series",
      titleMr: "सीसॅट स्पीड टेस्ट सिरीज",
      groupType: "GROUP_A",
      type: "SPEED_TEST",
      isPremium: true,
      tests: [
        { id: "demo-test-7", titleEn: "CSAT Speed Test #1 – Reasoning & Maths", status: "published" },
      ],
    },
  },
];

const GROUP_SECTIONS: Record<string, {
  label: string; sublabel: string; icon: string;
  gradient: string; accent: string; badgeClass: string;
}> = {
  GROUP_A: {
    label: "Group A",  sublabel: "Gazetted Posts — Rajyaseva, Class I & II",
    icon: "🏛️", gradient: "from-primary-700 to-primary-500",
    accent: "bg-primary-600", badgeClass: "bg-white/20 text-white",
  },
  GROUP_B: {
    label: "Group B",  sublabel: "Non-Gazetted — PSI, STI, ASO",
    icon: "👮", gradient: "from-primary-700 to-primary-500",
    accent: "bg-primary-600", badgeClass: "bg-white/20 text-white",
  },
  GROUP_C: {
    label: "Group C",  sublabel: "Technical Posts — Junior Engineer & related",
    icon: "⚙️", gradient: "from-purple-700 to-purple-500",
    accent: "bg-purple-600", badgeClass: "bg-white/20 text-white",
  },
  GROUP_D: {
    label: "Group D",  sublabel: "Class IV — Support Staff",
    icon: "📋", gradient: "from-emerald-700 to-emerald-500",
    accent: "bg-emerald-600", badgeClass: "bg-white/20 text-white",
  },
  default: {
    label: "General",  sublabel: "Other test series",
    icon: "📝", gradient: "from-gray-600 to-gray-500",
    accent: "bg-gray-600", badgeClass: "bg-white/20 text-white",
  },
};

const TYPE_COLOR: Record<string, string> = {
  MOCK:       "bg-purple-100 text-purple-700",
  GROUP_WISE: "bg-primary-100 text-primary-700",
  SUBJECT_WISE: "bg-primary-100 text-primary-700",
  SECTIONAL:  "bg-sky-100 text-sky-700",
  PYQ:        "bg-amber-100 text-amber-700",
  LIVE:       "bg-red-100 text-red-700",
  SPEED_TEST: "bg-orange-100 text-orange-700",
  DAILY_QUIZ: "bg-teal-100 text-teal-700",
};

function typeLabel(type: string) {
  const map: Record<string, string> = {
    MOCK: "Mock", GROUP_WISE: "Group", SUBJECT_WISE: "Subject",
    SECTIONAL: "Sectional", PYQ: "PYQ", LIVE: "Live",
    SPEED_TEST: "Speed", DAILY_QUIZ: "Daily Quiz",
  };
  return map[type] ?? type;
}

interface FlatTest {
  id: string;
  titleEn: string;
  status: string;
  seriesTitleEn: string;
  type: string;
  isPremium: boolean;
  groupType: string;
  seriesId: string;
  orderIndex: number;
}

function TestCard({ test, groupAccent, resultMap }: {
  test: FlatTest; groupAccent: string;
  resultMap: Record<string, { score: number; isPassed: boolean; attemptId: string }>;
}) {
  const navigate = useNavigate();
  const isLive = test.status === "published";
  const done = resultMap[test.id];
  // Check for in-progress attempt in localStorage
  const storedAttemptId = localStorage.getItem(`attemptId_${test.id}`);
  const isInProgress = storedAttemptId && !localStorage.getItem(`submittedTest_${test.id}`) && !done;

  return (
    <div className="relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
      {/* Top color bar */}
      <div className={`h-1 w-full ${groupAccent}`} />

      <div className="flex flex-col flex-1 p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[test.type] ?? "bg-gray-100 text-gray-600"}`}>
            {typeLabel(test.type)}
          </span>
          {test.isPremium && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              💎 Premium
            </span>
          )}
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${isLive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
            {isLive ? "● Live" : "⏳ Soon"}
          </span>
        </div>

        {/* Series name */}
        <p className="text-[10px] text-gray-400 leading-tight mb-1 line-clamp-1">{test.seriesTitleEn}</p>

        {/* Test title */}
        <h4 className="font-semibold text-gray-900 text-sm leading-snug flex-1 line-clamp-2 mb-4">
          {test.titleEn}
        </h4>

        {/* Action */}
        {done ? (
          <div className="flex flex-col gap-2">
            <span className={`text-center py-2 rounded-xl text-xs font-bold ${done.isPassed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {Math.round(done.score)}% · {done.isPassed ? "✓ Passed" : "✗ Failed"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/test/${test.id}/result/${done.attemptId}`)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Review
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(`submittedTest_${test.id}`);
                  localStorage.removeItem(`attemptId_${test.id}`);
                  navigate(`/test/${test.id}/instructions`);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
              >
                🔄 Re-attempt
              </button>
            </div>
          </div>
        ) : isInProgress ? (
          <button
            onClick={() => navigate(`/test/${test.id}/attempt`)}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all"
          >
            ▶ Resume Test
          </button>
        ) : isLive ? (
          <button
            onClick={() => navigate(`/test/${test.id}/instructions`)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all ${groupAccent} hover:opacity-90`}
          >
            Start Test →
          </button>
        ) : (
          <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
            Coming Soon
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ meta, count, testCount }: {
  meta: typeof GROUP_SECTIONS[string];
  count: number;
  testCount: number;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${meta.gradient} text-white px-5 py-4 flex items-center gap-4`}>
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg leading-tight">{meta.label}</div>
        <div className="text-white/75 text-xs mt-0.5">{meta.sublabel}</div>
      </div>
      <div className="flex gap-3 text-right flex-shrink-0">
        <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
          <div className="font-bold text-sm">{testCount}</div>
          <div className="text-white/65 text-[10px]">Tests</div>
        </div>
        <div className="bg-white/15 rounded-xl px-3 py-1.5 text-center">
          <div className="font-bold text-sm">{count}</div>
          <div className="text-white/65 text-[10px]">Series</div>
        </div>
      </div>
    </div>
  );
}

export default function MyTests() {
  const [enrollments, setEnrollments] = useState<MyTest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [resultMap,   setResultMap]   = useState<Record<string, { score: number; isPassed: boolean; attemptId: string }>>({});

  useEffect(() => {
    if (DEMO_MODE) {
      setEnrollments(MOCK_TESTS);
      setLoading(false);
      return;
    }
    Promise.all([userService.getMyTests(), userService.getMyResults()])
      .then(([tests, results]) => {
        setEnrollments(tests);
        const map: Record<string, { score: number; isPassed: boolean; attemptId: string }> = {};
        results.forEach(r => {
          if (!map[r.testId] || Number(r.percentage) > map[r.testId].score) {
            map[r.testId] = { score: Number(r.percentage), isPassed: r.isPassed, attemptId: r.attemptId };
          }
        });
        setResultMap(map);
      })
      .catch(e => setError(e.message ?? "Failed to load tests"))
      .finally(() => setLoading(false));
  }, []);

  // Flatten all tests grouped by group type
  const groupKeys = [...new Set(enrollments.map(e => e.series.groupType ?? "default"))];
  const sections = groupKeys.map(gk => {
    const groupEnrollments = enrollments.filter(e => (e.series.groupType ?? "default") === gk);
    const flatTests: FlatTest[] = groupEnrollments.flatMap((e, ei) =>
      (e.series.tests ?? []).map((t, ti) => ({
        id:              t.id,
        titleEn:         t.titleEn,
        status:          t.status,
        seriesTitleEn:   e.series.titleEn,
        type:            e.series.type,
        isPremium:       e.series.isPremium,
        groupType:       gk,
        seriesId:        e.series.id,
        orderIndex:      ei * 100 + ti,
      }))
    );
    return {
      key:      gk,
      meta:     GROUP_SECTIONS[gk] ?? GROUP_SECTIONS.default,
      tests:    flatTests,
      seriesCount: groupEnrollments.length,
    };
  });

  const totalTests = sections.reduce((acc, s) => acc + s.tests.length, 0);

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">My Tests</h1></div>
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-20 rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-44 rounded-2xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">My Tests</h1></div>
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div>
        <div className="page-header flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="page-title">My Tests</h1>
            <p className="page-subtitle">No test series enrolled yet</p>
          </div>
          <Link to="/test-series/group/a" className="btn-primary text-xs py-2">+ Explore Free Tests</Link>
        </div>
        <div className="card p-16 text-center text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="font-semibold text-gray-600 text-lg mb-1">No tests enrolled</p>
          <p className="text-sm mb-6">Browse free test series and start preparing today — no login required.</p>
          <Link to="/test-series/group/a" className="btn-primary">Browse Free Tests →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">My Tests</h1>
          <p className="page-subtitle">
            {sections.length} section{sections.length !== 1 ? "s" : ""} ·{" "}
            {enrollments.length} series ·{" "}
            {totalTests} test{totalTests !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/test-series/group/a" className="btn-primary text-xs py-2">+ Explore More</Link>
      </div>

      {/* Sections */}
      {sections.map(({ key, meta, tests, seriesCount }) => {
        // Per-series progress
        const seriesProgress = enrollments
          .filter(e => (e.series.groupType ?? "default") === key)
          .map(e => {
            const totalInSeries = (e.series.tests ?? []).length;
            const completedInSeries = (e.series.tests ?? []).filter(t => resultMap[t.id]).length;
            return { titleEn: e.series.titleEn, total: totalInSeries, completed: completedInSeries };
          });

        return (
        <div key={key} className="space-y-4">
          {/* Section header */}
          <SectionHeader meta={meta} count={seriesCount} testCount={tests.length} />

          {/* Per-series progress bars */}
          {seriesProgress.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {seriesProgress.map((sp, i) => {
                const pct = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;
                return (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">{sp.titleEn}</span>
                      <span className="text-xs font-bold text-primary-600 ml-2 flex-shrink-0">{sp.completed}/{sp.total}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-primary-400"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{pct}% complete{pct === 100 ? " ✓" : ""}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Test cards grid */}
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No tests available in this section yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {tests.map(test => (
                <TestCard key={test.id} test={test} groupAccent={meta.accent} resultMap={resultMap} />
              ))}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
