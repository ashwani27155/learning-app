import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { api } from "../../lib/api";
import { SkeletonBarChart } from "../../components/common/Skeleton";
import { DEMO_MODE } from "@/lib/demoMode";


const DIFF_COLORS: Record<string, string> = {
  easy: "#10b981", medium: "#f59e0b", hard: "#ef4444", expert: "#7c3aed",
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-xs text-gray-500">{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function AdminAnalytics() {
  const [activeExam, setActiveExam] = useState("MPSC");

  const { data: dashData } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn:  () => api.get<any>("/admin/dashboard"),
    enabled:  !DEMO_MODE,
    staleTime: 60_000,
  });

  const { data: attemptTrend = [], isLoading: trendLoading } = useQuery({
    queryKey: ["admin", "attempt-trend"],
    queryFn:  () => api.get<any[]>("/admin/analytics/attempt-trend"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: questionGrowth = [], isLoading: growthLoading } = useQuery({
    queryKey: ["admin", "question-growth"],
    queryFn:  () => api.get<any[]>("/admin/analytics/question-growth"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: usageStatsData, isLoading: usageLoading } = useQuery({
    queryKey: ["question-usage-stats", activeExam],
    queryFn:  () => api.get<any>("/questions/usage-stats", { params: { examType: activeExam } }),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: subjectPerf = [], isLoading: subjectLoading } = useQuery({
    queryKey: ["admin", "subject-performance", activeExam],
    queryFn:  () => api.get<any[]>("/admin/analytics/subject-performance"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  // Build pie data from usage stats
  const usageBuckets: Array<{ name: string; value: number; color: string }> = usageStatsData?.data?.usageBuckets ?? usageStatsData?.usageBuckets ?? [];
  const diffBuckets: Array<{ name: string; value: number; color: string }> = (usageStatsData?.data?.byDifficulty ?? usageStatsData?.byDifficulty ?? []).map((d: any) => ({
    name: d.difficulty ?? d.name ?? "Unknown",
    value: d._count?.id ?? d.value ?? 0,
    color: DIFF_COLORS[(d.difficulty ?? d.name ?? "").toLowerCase()] ?? "#9ca3af",
  }));

  // Radar data from subject perf
  const radarData = (subjectPerf as any[]).slice(0, 6).map((s: any) => ({
    subject: s.subject?.slice(0, 10) ?? "—",
    A: s.avgAccuracy ?? 0,
  }));

  const kpis = [
    { label: "Total Attempts",   value: (dashData?.totalAttempts ?? "—").toLocaleString?.() ?? "—",   icon: "📝", color: "bg-primary-50 text-primary-600" },
    { label: "Total Users",      value: (dashData?.totalUsers ?? "—").toLocaleString?.() ?? "—",       icon: "👥", color: "bg-primary-50 text-purple-600" },
    { label: "New Today",        value: (dashData?.newUsersToday ?? "—").toLocaleString?.() ?? "—",    icon: "🆕", color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Revenue",    value: dashData ? `₹${Math.round((dashData.totalRevenue ?? 0) / 1000)}k` : "—", icon: "💰", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Platform-wide performance insights and question bank health</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["MPSC", "UPSC", "NEET", "JEE"].map(exam => (
            <button key={exam} onClick={() => setActiveExam(exam)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeExam === exam ? "bg-primary-600 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3 ${k.color}`}>{k.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Monthly Attempts + Questions Added */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-1">📈 Monthly Test Attempts</h3>
          <p className="text-xs text-gray-400 mb-5">Total submitted attempts per month (last 6 months)</p>
          {trendLoading ? <SkeletonBarChart /> : (attemptTrend as any[]).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attemptTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f3f4f6", radius: 6 }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[6,6,0,0]} maxBarSize={40} name="Attempts" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No attempt data yet</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-1">📚 Questions Added Weekly</h3>
          <p className="text-xs text-gray-400 mb-5">New questions uploaded per week (last 5 weeks)</p>
          {growthLoading ? <SkeletonBarChart /> : (questionGrowth as any[]).length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={questionGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 4 }} name="Questions" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No question data yet</div>}
        </div>
      </div>

      {/* Row 2: Usage + Difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-1">🔄 Question Usage Distribution</h3>
          <p className="text-xs text-gray-400 mb-5">How many times questions have been used in tests</p>
          {usageLoading ? <SkeletonBarChart /> : usageBuckets.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={usageBuckets} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {usageBuckets.map((entry: any, index: number) => <Cell key={index} fill={entry.color ?? "#a78bfa"} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {usageBuckets.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color ?? "#a78bfa" }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No usage data yet</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-1">⚡ Difficulty Distribution</h3>
          <p className="text-xs text-gray-400 mb-5">Question bank composition by difficulty level</p>
          {usageLoading ? <SkeletonBarChart /> : diffBuckets.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={diffBuckets} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {diffBuckets.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {diffBuckets.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600 capitalize">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-700 ml-auto">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No difficulty data yet</div>}
        </div>
      </div>

      {/* Row 3: Subject Performance + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-bold text-gray-900 mb-5">📚 Subject-wise Platform Performance</h3>
          {subjectLoading ? <SkeletonBarChart /> : (subjectPerf as any[]).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400">
                    <th className="pb-2 text-left font-medium">Subject</th>
                    <th className="pb-2 text-center font-medium">Attempts</th>
                    <th className="pb-2 text-center font-medium">Avg Accuracy</th>
                    <th className="pb-2 text-left font-medium w-32">Score Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(subjectPerf as any[]).map((s: any) => (
                    <tr key={s.subject} className="hover:bg-gray-50">
                      <td className="py-3 font-semibold text-gray-900 text-sm">{s.subject}</td>
                      <td className="py-3 text-center text-gray-600 text-xs">{s.attempts.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`font-bold text-sm ${s.avgAccuracy >= 70 ? "text-emerald-600" : s.avgAccuracy >= 55 ? "text-amber-600" : "text-red-500"}`}>
                          {s.avgAccuracy}%
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="h-2 bg-gray-100 rounded-full w-28">
                          <div className={`h-full rounded-full ${s.avgAccuracy >= 70 ? "bg-emerald-500" : s.avgAccuracy >= 55 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${s.avgAccuracy}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-400 py-8 text-center">No subject performance data yet. Complete some tests first.</p>}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-5">🎯 Subject Coverage Radar</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <PolarGrid stroke="#f3f4f6" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Accuracy" dataKey="A" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-400 text-sm">No radar data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
