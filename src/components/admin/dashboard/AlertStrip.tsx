import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";

export interface DashboardAlert { label: string; link: string; color: string; }

export function AlertStrip({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {alerts.map((a) => (
        <Link key={a.label} to={a.link}
          className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors group ${
            a.color === "amber"
              ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
              : "bg-primary-50 border-primary-200 text-primary-800 hover:bg-primary-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${a.color === "amber" ? "text-amber-500" : "text-primary-500"}`} />
            <span className="text-sm font-medium">{a.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}
