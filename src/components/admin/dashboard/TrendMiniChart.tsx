import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SkeletonBarChart } from "../../common/Skeleton";

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs" style={{ color: payload[0].color }}>
        {typeof payload[0].value === "number" ? payload[0].value.toLocaleString() : payload[0].value}
      </p>
    </div>
  );
};

interface TrendMiniChartProps {
  title: string;
  subtitle?: string;
  data: Array<Record<string, any>>;
  xKey: string;
  valueKey: string;
  type: "area" | "bar" | "line";
  color: string;
  loading?: boolean;
  emptyLabel?: string;
  headline?: string;
}

export function TrendMiniChart({ title, subtitle, data, xKey, valueKey, type, color, loading, emptyLabel = "No data yet", headline }: TrendMiniChartProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        {headline && <span className="text-sm font-bold" style={{ color }}>{headline}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mb-4">{subtitle}</p>}

      {loading ? (
        <SkeletonBarChart />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[140px] text-gray-400 text-sm">{emptyLabel}</div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          {type === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`tmc-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey={valueKey} stroke={color} strokeWidth={2}
                fill={`url(#tmc-${color.replace("#", "")})`} dot={false} />
            </AreaChart>
          ) : type === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f3f4f6", radius: 6 }} />
              <Bar dataKey={valueKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey={valueKey} stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
