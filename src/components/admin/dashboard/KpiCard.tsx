import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { SparkLine } from "./SparkLine";

export const KPI_GRADIENTS: Record<string, { grad: string; color: string }> = {
  blue:    { grad: "from-primary-500 to-primary-600",  color: "#8b5cf6" },
  violet:  { grad: "from-indigo-500 to-primary-700",   color: "#4f46e5" },
  emerald: { grad: "from-emerald-500 to-teal-600",     color: "#10b981" },
  amber:   { grad: "from-amber-400 to-orange-500",     color: "#f59e0b" },
};

export interface KpiCardProps {
  label: string; value: string; change: string; changeLabel: string;
  icon: any; accent: string; link: string; spark?: number[];
  compact?: boolean;
}

export function KpiCard({ label, value, change, changeLabel, icon: Icon, accent, link, spark, compact = false }: KpiCardProps) {
  const g = KPI_GRADIENTS[accent] ?? KPI_GRADIENTS.blue;
  return (
    <Link to={link} className="kpi-card group block">
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${g.grad} flex items-center justify-between ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
        <div className={`rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ${compact ? "w-8 h-8" : "w-10 h-10"}`}>
          <Icon className={compact ? "w-4 h-4 text-white" : "w-5 h-5 text-white"} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
      </div>
      {/* Body */}
      <div className={compact ? "px-4 pt-3 pb-2.5" : "px-5 pt-4 pb-3"}>
        <div className={`font-bold text-gray-900 tracking-tight ${compact ? "text-xl" : "text-2xl"}`}>{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              {change}
            </span>
            {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
          </div>
          {spark && spark.length > 2 && (
            <div className="opacity-70">
              <SparkLine data={spark} color={g.color} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
