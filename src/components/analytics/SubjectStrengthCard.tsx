import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  analyticsService,
  type SubjectAnalytic, type SubjectTrendPoint, type AllSubjectsTrend, type TrendGranularity,
} from "../../services/analyticsService";
import { SkeletonBarChart } from "../common/Skeleton";
import { DEMO_MODE } from "@/lib/demoMode";

const strengthColor = (accuracy: number) =>
  accuracy >= 70 ? "#10b981" : accuracy >= 55 ? "#f59e0b" : "#ef4444";

const LINE_COLORS = ["#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

const GRANULARITIES: { key: TrendGranularity; label: string }[] = [
  { key: "daily",   label: "Daily" },
  { key: "weekly",  label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <strong>{p.value === null || p.value === undefined ? "No attempts" : `${p.value}%`}</strong>
        </p>
      ))}
    </div>
  );
};

const formatPeriod = (period: string, granularity: TrendGranularity) => {
  const d = new Date(period.length === 7 ? `${period}-01` : period);
  if (granularity === "daily")  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (granularity === "weekly") return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const PERIOD_COUNT: Record<TrendGranularity, number> = { daily: 30, weekly: 12, monthly: 12, yearly: 5 };

// ── Demo-mode mock generators (deterministic, no backend calls) ─────────────
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
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function mockAccuracyAt(seed: number, currentAccuracy: number, index: number, count: number): number {
  const start = Math.max(15, currentAccuracy - 28);
  const noise = ((seed + index * 17) % 9) - 4;
  return Math.max(10, Math.min(100, Math.round(start + (currentAccuracy - start) * (index / Math.max(1, count - 1)) + noise)));
}

function buildMockTrend(subjectId: string, currentAccuracy: number, granularity: TrendGranularity): SubjectTrendPoint[] {
  const periods = buildMockPeriods(granularity);
  const seed = subjectId.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return periods.map((period, i) => {
    const accuracy = mockAccuracyAt(seed, currentAccuracy, i, periods.length);
    return { period, accuracy, correct: Math.round(accuracy * 0.4), total: 40 };
  });
}

function buildMockAllSubjectsTrend(subjects: SubjectAnalytic[], granularity: TrendGranularity): AllSubjectsTrend {
  const periods = buildMockPeriods(granularity);
  const trend = periods.map((period, i) => {
    const row: Record<string, string | number | null> = { period };
    for (const s of subjects) {
      const seed = s.subjectId.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
      row[s.subjectId] = mockAccuracyAt(seed, s.accuracy, i, periods.length);
    }
    return row;
  });
  return { subjectIds: subjects.map(s => s.subjectId), trend };
}

function GranularityToggle({ value, onChange }: { value: TrendGranularity; onChange: (g: TrendGranularity) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {GRANULARITIES.map(g => (
        <button
          key={g.key}
          onClick={() => onChange(g.key)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${value === g.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500"}`}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

export default function SubjectStrengthCard({
  subjects,
  subjectMap,
}: {
  subjects: SubjectAnalytic[];
  subjectMap: Record<string, string>;
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [compareAll,        setCompareAll]        = useState(false);
  const [granularity,       setGranularity]       = useState<TrendGranularity>("monthly");

  const data = subjects.map(s => ({
    subjectId: s.subjectId,
    name:      subjectMap[s.subjectId] ?? s.subject ?? s.subjectId,
    accuracy:  s.accuracy,
  }));

  const selectedAccuracy = subjects.find(s => s.subjectId === selectedSubjectId)?.accuracy ?? 60;

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ["analytics", "subject-trend", selectedSubjectId, granularity],
    queryFn:  () => analyticsService.getSubjectTrend(selectedSubjectId!, granularity),
    enabled:  !DEMO_MODE && !!selectedSubjectId && !compareAll,
    initialData: DEMO_MODE && selectedSubjectId && !compareAll
      ? buildMockTrend(selectedSubjectId, selectedAccuracy, granularity)
      : undefined,
  });

  const { data: allTrend, isLoading: allTrendLoading } = useQuery({
    queryKey: ["analytics", "subjects-trend", granularity],
    queryFn:  () => analyticsService.getAllSubjectsTrend(granularity),
    enabled:  !DEMO_MODE && compareAll,
    initialData: DEMO_MODE && compareAll ? buildMockAllSubjectsTrend(subjects, granularity) : undefined,
  });

  if (subjects.length === 0) return null;

  const selectedName = selectedSubjectId ? (subjectMap[selectedSubjectId] ?? selectedSubjectId) : null;
  const trendData = (trend ?? []).map(t => ({ ...t, label: formatPeriod(t.period, granularity) }));

  const allTrendData = (allTrend?.trend ?? []).map(row => ({
    ...row,
    label: formatPeriod(String(row.period), granularity),
  }));

  const showPanel = compareAll || !!selectedSubjectId;

  const openCompareAll = () => { setCompareAll(true); setSelectedSubjectId(null); };
  const closePanel     = () => { setCompareAll(false); setSelectedSubjectId(null); };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-bold text-gray-900 text-sm">📚 Subject Strength</h2>
        <button
          onClick={() => (compareAll ? closePanel() : openCompareAll())}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${compareAll ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          📊 {compareAll ? "Comparing All Subjects" : "Compare All Subjects"}
        </button>
      </div>

      <div className="px-5 py-4">
        {!compareAll && (
          <>
            <p className="text-xs text-gray-400 mb-3">Click a bar to see your improvement trend for that subject</p>
            <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11, fill: "#374151" }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                <Bar
                  dataKey="accuracy"
                  name="Accuracy"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  cursor="pointer"
                  onClick={(d: any) => setSelectedSubjectId(d.subjectId)}
                >
                  {data.map(d => (
                    <Cell key={d.subjectId} fill={strengthColor(d.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {showPanel && (
          <div className={compareAll ? "" : "mt-5 pt-4 border-t border-gray-100"}>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm">
                {compareAll ? "📈 All Subjects — Progress Trend" : `📈 ${selectedName} — Progress Trend`}
              </h3>
              <div className="flex items-center gap-2">
                <GranularityToggle value={granularity} onChange={setGranularity} />
                <button onClick={closePanel} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">
                  ✕ Close
                </button>
              </div>
            </div>

            {compareAll ? (
              allTrendLoading ? (
                <SkeletonBarChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={allTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {(allTrend?.subjectIds ?? []).map((id, i) => (
                      <Line
                        key={id}
                        type="monotone"
                        dataKey={id}
                        name={subjectMap[id] ?? id}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : trendLoading ? (
              <SkeletonBarChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: "#7c3aed", r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
