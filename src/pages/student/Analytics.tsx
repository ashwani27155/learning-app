import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { analyticsService, type SubjectAnalytic, type ProgressPoint, type WeakTopic } from "../../services/analyticsService";
import { api } from "../../lib/api";
import { Skeleton } from "../../components/common/Skeleton";

// ── Radar chart (SVG, no lib) ─────────────────────────────────────────────────
function RadarChart({ subjects }: { subjects: Array<{ name: string; accuracy: number }> }) {
  const cx = 150; const cy = 150; const r = 110;
  const N = subjects.length;
  if (N === 0) return null;
  const angleStep = (2 * Math.PI) / N;
  const startAngle = -Math.PI / 2;
  const pt = (i: number, scale: number) => {
    const a = startAngle + i * angleStep;
    return { x: cx + scale * r * Math.cos(a), y: cy + scale * r * Math.sin(a) };
  };
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const values = subjects.map(s => s.accuracy / 100);
  const dataPoints = values.map((v, i) => pt(i, v));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(" ");
  const labels = subjects.map(s => s.name.split(" ")[0]);
  const labelOffset = 24;
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {gridLevels.map(level => {
        const ring = subjects.map((_, i) => pt(i, level));
        return <polygon key={level} points={ring.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
      })}
      {subjects.map((_, i) => {
        const end = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />;
      })}
      <polygon points={polyPoints} fill="#7c3aed" fillOpacity="0.25" stroke="#7c3aed" strokeWidth="2" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#7c3aed" />)}
      {labels.map((label, i) => {
        const pos = pt(i, 1 + labelOffset / r);
        const anchor = pos.x < cx - 5 ? "end" : pos.x > cx + 5 ? "start" : "middle";
        const color = subjects[i].accuracy >= 70 ? "#059669" : subjects[i].accuracy >= 55 ? "#d97706" : "#dc2626";
        return (
          <text key={i} x={pos.x} y={pos.y} textAnchor={anchor} dominantBaseline="middle" fontSize="10" fontWeight="600" fill={color}>
            {label} {subjects[i].accuracy}%
          </text>
        );
      })}
      {gridLevels.map(l => (
        <text key={l} x={cx + 3} y={cy - l * r} fontSize="8" fill="#9ca3af">{Math.round(l * 100)}%</text>
      ))}
    </svg>
  );
}

function SkeletonAnalytics() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="card p-5 h-48 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="card p-5 h-64 rounded-2xl" />
        <Skeleton className="card p-5 h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview,   setOverview]   = useState<any>(null);
  const [subjects,   setSubjects]   = useState<SubjectAnalytic[]>([]);
  const [progress,   setProgress]   = useState<ProgressPoint[]>([]);
  const [weak,       setWeak]       = useState<WeakTopic[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [trendView,  setTrendView]  = useState<"score" | "percentile">("score");

  useEffect(() => {
    Promise.all([
      analyticsService.getOverview(),
      analyticsService.getSubjectAnalytics(),
      analyticsService.getProgress(),
      analyticsService.getWeakTopics(),
      api.get<any[]>("/subjects"),
    ])
      .then(([ov, subs, prog, wk, subjectList]) => {
        setOverview(ov);
        const nameMap: Record<string, string> = {};
        (subjectList ?? []).forEach((s: any) => { nameMap[s.id] = s.nameEn; });
        setSubjects(subs.map(s => ({ ...s, name: nameMap[s.subjectId] ?? s.subject ?? s.subjectId })));
        setProgress(prog);
        setWeak(wk.map(w => ({ ...w, subjectName: nameMap[w.subjectId] ?? w.subjectId })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonAnalytics />;

  // No data yet
  if (!overview || overview.testsCompleted === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Detailed performance insights and improvement areas</p>
        </div>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No data yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Take at least one test to see your performance analytics here.
          </p>
          <Link to="/test-series/group/a" className="btn-primary">Start a Free Test →</Link>
        </div>
      </div>
    );
  }

  const maxScore = progress.length ? Math.max(...progress.map(d => d.score), 1) : 100;
  const recentScore = progress.length ? progress[progress.length - 1].score : overview.avgScore;
  const firstScore  = progress.length ? progress[0].score : recentScore;
  const improvement = recentScore - firstScore;

  return (
    <div className="space-y-4">
      <div className="page-header">
        <h1 className="page-title">Performance Analytics</h1>
        <p className="page-subtitle">Detailed performance insights and improvement areas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Avg Score",     value: `${overview.avgScore}%`,                  icon: "📊", sub: `${overview.testsCompleted} tests taken` },
          { label: "Questions",     value: overview.totalAttempted.toLocaleString(),  icon: "❓", sub: `${overview.totalCorrect} correct` },
          { label: "Study Streak",  value: `${overview.currentStreak} days`,          icon: "🔥", sub: `Best: ${overview.longestStreak} days` },
          { label: "Tests Done",    value: overview.testsCompleted,                   icon: "✅", sub: "Submitted attempts" },
        ].map(k => (
          <div key={k.label} className="card p-3 md:p-4">
            <div className="text-xl mb-1">{k.icon}</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-xs font-medium text-gray-700">{k.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Score Trend */}
      {progress.length > 0 && (
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm">📈 Score Progression ({progress.length} tests)</h3>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setTrendView("score")} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${trendView === "score" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"}`}>Score</button>
            </div>
          </div>
          <div className="flex items-end gap-2 h-28">
            {progress.map((d, i) => {
              const val = d.score;
              const label = new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] font-bold text-primary-600">{val}%</div>
                  <div className="w-full bg-primary-500 rounded-t-lg hover:bg-primary-600 transition-all"
                    style={{ height: `${(val / maxScore) * 90}px` }} />
                  <div className="text-[9px] text-gray-400 truncate w-full text-center">{label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>First: {firstScore}%</span>
            <span className="text-emerald-600 font-semibold">Latest: {recentScore}%</span>
            <span className={`font-semibold ${improvement >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {improvement >= 0 ? "+" : ""}{improvement}% change
            </span>
          </div>
        </div>
      )}

      {/* Radar + Subject bars */}
      {subjects.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4 md:p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">🕸️ Subject Strength Radar</h3>
              <RadarChart subjects={subjects.map(s => ({ name: s.subject, accuracy: s.accuracy }))} />
              <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Strong (&gt;70%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />Average</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Weak (&lt;55%)</span>
              </div>
            </div>

            <div className="card p-4 md:p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">📚 Subject-wise Performance</h3>
              <div className="space-y-3">
                {subjects.map(s => (
                  <div key={s.subjectId} className="flex items-center gap-2">
                    <div className="text-xs font-medium text-gray-800 w-24 flex-shrink-0 truncate">{s.subject}</div>
                    <div className="flex-1">
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.accuracy >= 70 ? "bg-emerald-500" : s.accuracy >= 55 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${s.accuracy}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${s.accuracy >= 70 ? "text-emerald-600" : s.accuracy >= 55 ? "text-amber-600" : "text-red-500"}`}>
                      {s.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Weak topics */}
      {weak.length > 0 && (
        <div className="card p-4 md:p-5">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">🎯 Weak Areas — Practice Now</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weak.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center font-bold text-red-600 text-xs flex-shrink-0">
                  {w.accuracy}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-xs truncate">{(w as any).subjectName ?? w.subjectId}</div>
                  <div className="text-[10px] text-gray-400">{w.correct}/{w.total} correct</div>
                </div>
                <Link to="/test-series/group/a" className="btn-primary text-xs py-1 px-2.5 flex-shrink-0 whitespace-nowrap">Practice</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Syllabus Coverage Tracker */}
      {subjects.length > 0 && (
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">🗺️ Syllabus Coverage Tracker</h3>
            <span className="text-xs text-gray-400">
              {subjects.filter(s => s.total > 0).length} of {subjects.length} subjects started
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map(s => {
              const BASELINE = 50;
              const coverage = s.total > 0 ? Math.min(100, Math.round((s.total / BASELINE) * 100)) : 0;
              const notStarted = s.total === 0;
              const strong     = s.accuracy >= 70 && s.total > 0;
              const borderCls  = notStarted ? "border-gray-200 bg-gray-50" : strong ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50";
              const labelCls   = notStarted ? "text-gray-400" : strong ? "text-emerald-700" : "text-amber-700";
              const barCls     = notStarted ? "bg-gray-300" : strong ? "bg-emerald-500" : "bg-amber-400";
              return (
                <div key={s.subjectId} className={`rounded-xl border p-3 ${borderCls}`}>
                  <p className={`text-xs font-semibold truncate mb-2 ${labelCls}`}>{(s as any).name ?? s.subjectId}</p>
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-1.5">
                    <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${coverage}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className={labelCls}>{notStarted ? "Not started" : `${coverage}% covered`}</span>
                    {!notStarted && <span className={labelCls}>{s.accuracy}% acc</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">Coverage is estimated based on questions attempted vs. ~50 questions per subject.</p>
        </div>
      )}
    </div>
  );
}
