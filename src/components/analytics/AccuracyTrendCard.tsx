import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { analyticsService, type AccuracyTrendPoint, type TrendGranularity } from "../../services/analyticsService";
import { SkeletonBarChart } from "../common/Skeleton";
import { DEMO_MODE } from "@/lib/demoMode";

const strengthColor = (accuracy: number) =>
  accuracy >= 70 ? "#10b981" : accuracy >= 55 ? "#f59e0b" : "#ef4444";

const GRANULARITIES: { key: TrendGranularity; label: string }[] = [
  { key: "daily",   label: "Day" },
  { key: "weekly",  label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "yearly",  label: "Year" },
];

const PERIOD_COUNT: Record<TrendGranularity, number> = { daily: 30, weekly: 12, monthly: 12, yearly: 5 };

const formatPeriod = (period: string, granularity: TrendGranularity) => {
  if (granularity === "yearly") return period;
  const d = new Date(period.length === 7 ? `${period}-01` : period);
  if (granularity === "monthly") return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── Demo-mode mock generator (deterministic, no backend calls) ──────────────
function buildMockPeriods(granularity: TrendGranularity): string[] {
  const now = new Date();
  const n = PERIOD_COUNT[granularity];
  return Array.from({ length: n }, (_, i) => {
    if (granularity === "daily") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i));
      return d.toISOString().slice(0, 10);
    }
    if (granularity === "weekly") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i) * 7);
      return d.toISOString().slice(0, 10);
    }
    if (granularity === "yearly") return String(now.getFullYear() - (n - 1 - i));
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function buildMockTrend(currentAccuracy: number, granularity: TrendGranularity): AccuracyTrendPoint[] {
  const periods = buildMockPeriods(granularity);
  const start = Math.max(15, currentAccuracy - 25);
  return periods.map((period, i) => {
    const noise = ((i * 13) % 9) - 4;
    const accuracy = Math.max(10, Math.min(100, Math.round(start + (currentAccuracy - start) * (i / Math.max(1, periods.length - 1)) + noise)));
    return { period, accuracy, correct: Math.round(accuracy * 0.4), total: 40 };
  });
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs" style={{ color: p.color }}>
        Accuracy: <strong>{p.value === null || p.value === undefined ? "No attempts" : `${p.value}%`}</strong>
      </p>
    </div>
  );
};

export default function AccuracyTrendCard({ currentAccuracy }: { currentAccuracy: number }) {
  const [granularity, setGranularity] = useState<TrendGranularity>("monthly");

  const { data: trend, isLoading } = useQuery({
    queryKey: ["analytics", "accuracy-trend", granularity],
    queryFn:  () => analyticsService.getAccuracyTrend(granularity),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? buildMockTrend(currentAccuracy, granularity) : undefined,
  });

  const data = (trend ?? []).map(t => ({ ...t, label: formatPeriod(t.period, granularity) }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-bold text-gray-900 text-sm">📈 Answer Accuracy</h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {GRANULARITIES.map(g => (
            <button
              key={g.key}
              onClick={() => setGranularity(g.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${granularity === g.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <SkeletonBarChart />
        ) : data.every(d => d.total === 0) ? (
          <p className="text-sm text-gray-400 text-center py-10">No test attempts in this period yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="accuracy" name="Accuracy" radius={[6, 6, 0, 0]} maxBarSize={28}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.accuracy === null ? "#e5e7eb" : strengthColor(d.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
