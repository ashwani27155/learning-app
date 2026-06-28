import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { DEMO_MODE } from "@/lib/demoMode";
import { Users, CreditCard, IndianRupee, ClipboardList, Database, RefreshCw } from "lucide-react";
import { DashboardTabs } from "../../components/admin/dashboard/DashboardTabs";
import { OverviewTab } from "../../components/admin/dashboard/OverviewTab";
import { GrowthTab } from "../../components/admin/dashboard/GrowthTab";
import type { KpiCardProps } from "../../components/admin/dashboard/KpiCard";
import type { DashboardAlert } from "../../components/admin/dashboard/AlertStrip";
import type { ActivityItem } from "../../components/admin/dashboard/ActivityFeed";
import { actionTypeFromLog } from "../../components/admin/dashboard/ActivityFeed";

const today = new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function AdminDashboard() {
  const [tab, setTab] = useState<"overview" | "growth">("overview");
  const qc = useQueryClient();

  const { data: dashData, isLoading: kpisLoading, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn:  async () => api.get<any>("/admin/dashboard"),
    enabled:  !DEMO_MODE,
    staleTime: 30_000,
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn:  async () => {
      const raw = await api.get<any[]>("/admin/analytics/revenue");
      if (!Array.isArray(raw)) return [];
      return raw.filter((r: any) => r.status === "paid").map((r: any) => ({
        month: "Revenue", value: Number(r._sum?.amount ?? 0),
      }));
    },
    enabled: !DEMO_MODE,
  });

  const { data: planData } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn:  () => api.get<any>("/admin/analytics/plans"),
    enabled:  !DEMO_MODE,
    staleTime: 60_000,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["admin", "pending"],
    queryFn:  () => api.get<any>("/admin/pending-actions"),
    enabled:  !DEMO_MODE,
    staleTime: 60_000,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn:  async () => {
      const res = await api.get<any>("/admin/audit-logs?limit=10");
      return res?.data ?? res ?? [];
    },
    enabled:  !DEMO_MODE,
    staleTime: 30_000,
  });

  const { data: registrationsData = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn:  () => api.get<Array<{ createdAt: string; role: string }>>("/admin/analytics/registrations"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: attemptTrend = [], isLoading: attemptTrendLoading } = useQuery({
    queryKey: ["admin", "attempt-trend"],
    queryFn:  () => api.get<any[]>("/admin/analytics/attempt-trend"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: questionGrowth = [], isLoading: questionGrowthLoading } = useQuery({
    queryKey: ["admin", "question-growth"],
    queryFn:  () => api.get<any[]>("/admin/analytics/question-growth"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  const { data: subjectPerformance = [], isLoading: subjectPerformanceLoading } = useQuery({
    queryKey: ["admin", "subject-performance"],
    queryFn:  () => api.get<any[]>("/admin/analytics/subject-performance"),
    enabled:  !DEMO_MODE,
    staleTime: 120_000,
  });

  // Bucket the last 30 days of raw registration rows into a daily series.
  const signups = useMemo(() => {
    const days: Array<{ day: string; value: number }> = [];
    const counts: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      counts[key] = 0;
      days.push({ day: key, value: 0 });
    }
    (registrationsData ?? []).forEach((u) => {
      const key = new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (key in counts) counts[key] += 1;
    });
    return days.map((d) => ({ day: d.day, value: counts[d.day] ?? 0 }));
  }, [registrationsData]);

  const signupsTotal = (registrationsData ?? []).length;
  const signupsSpark = signups.map((d) => d.value);

  const kpis: KpiCardProps[] | null = dashData ? [
    {
      label: "Total Students",
      value: dashData.totalUsers?.toLocaleString() ?? "—",
      change: `+${dashData.newUsersToday ?? 0}`,
      changeLabel: "today",
      icon: Users,
      accent: "blue",
      link: "/admin/users",
      spark: signupsSpark.length > 2 ? signupsSpark : undefined,
    },
    {
      label: "Active Subscribers",
      value: ((planData as any)?.activeSubs ?? dashData.activeSubs ?? 0).toLocaleString?.() ?? "—",
      change: "+0",
      changeLabel: "this week",
      icon: CreditCard,
      accent: "violet",
      link: "/admin/users",
    },
    {
      label: "Revenue (Total)",
      value: `₹${Math.round((dashData.totalRevenue ?? 0) / 1000)}k`,
      change: "+12%",
      changeLabel: "vs last month",
      icon: IndianRupee,
      accent: "emerald",
      link: "/admin/analytics",
    },
    {
      label: "Tests Conducted",
      value: dashData.totalAttempts?.toLocaleString() ?? "—",
      change: "All time",
      changeLabel: "",
      icon: ClipboardList,
      accent: "amber",
      link: "/admin/test-series",
    },
    {
      label: "Questions in Bank",
      value: (dashData.totalQuestions ?? 0).toLocaleString(),
      change: pendingData ? `${pendingData.pendingQuestions ?? 0}` : "—",
      changeLabel: "pending review",
      icon: Database,
      accent: "violet",
      link: "/admin/question-bank",
    },
  ] : null;

  const planDist: any[] = (planData as any)?.plans ?? [];
  const totalPlanUsers: number = (planData as any)?.totalUsers ?? 0;
  const donutData = planDist.map((p: any) => ({ name: p.plan, value: p.count }));

  const alerts: DashboardAlert[] = pendingData ? [
    pendingData.pendingQuestions > 0 && {
      label: `${pendingData.pendingQuestions} questions pending approval`,
      link: "/admin/question-bank",
      color: "amber",
    },
    pendingData.pendingMaterials > 0 && {
      label: `${pendingData.pendingMaterials} study materials need review`,
      link: "/admin/study-material",
      color: "blue",
    },
  ].filter(Boolean) as DashboardAlert[] : [];

  const activities: ActivityItem[] = Array.isArray(activityData)
    ? activityData.slice(0, 10).map((log: any) => ({
        type: actionTypeFromLog(log.entityType ?? "", log.action ?? ""),
        text: `${log.action} ${log.entityType} by ${log.changedBy?.name ?? "Admin"}`,
        time: new Date(log.changedAt).toLocaleString("en-IN", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }),
      }))
    : [];

  const lastRefreshed = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back <span className="gradient-text">Admin</span> 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DashboardTabs
            tabs={[{ id: "overview", label: "Overview" }, { id: "growth", label: "Growth & Activity" }]}
            active={tab}
            onChange={(id) => setTab(id as "overview" | "growth")}
          />
          {lastRefreshed && (
            <span className="text-xs text-gray-400">Updated {lastRefreshed}</span>
          )}
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </span>
        </div>
      </div>

      {tab === "overview" ? (
        <OverviewTab
          alerts={alerts}
          kpisLoading={kpisLoading}
          kpis={kpis}
          revenueData={revenueData}
          revenueLoading={revenueLoading}
          totalRevenue={dashData?.totalRevenue ?? 0}
          donutData={donutData}
          totalPlanUsers={totalPlanUsers}
          activities={activities}
          activityLoading={activityLoading}
        />
      ) : (
        <GrowthTab
          signups={signups}
          signupsLoading={registrationsLoading}
          signupsTotal={signupsTotal}
          attemptTrend={attemptTrend}
          attemptTrendLoading={attemptTrendLoading}
          questionGrowth={questionGrowth}
          questionGrowthLoading={questionGrowthLoading}
          subjectPerformance={subjectPerformance}
          subjectPerformanceLoading={subjectPerformanceLoading}
          activities={activities}
          activityLoading={activityLoading}
        />
      )}
    </div>
  );
}
