import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SkeletonBarChart } from "../../common/Skeleton";

export interface SubjectPerformance { subject: string; attempts: number; avgAccuracy: number; }

interface SubjectPerformanceTableProps {
  data: SubjectPerformance[];
  loading?: boolean;
  limit?: number;
  viewAllLink: string;
}

export function SubjectPerformanceTable({ data, loading, limit = 5, viewAllLink }: SubjectPerformanceTableProps) {
  const rows = data.slice(0, limit);
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">Subject Performance</h3>
        <Link to={viewAllLink} className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
          View full breakdown <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <SkeletonBarChart />
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No subject performance data yet. Complete some tests first.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th className="text-center">Attempts</th>
                <th className="text-center">Avg Accuracy</th>
                <th className="w-32">Score Bar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.subject}>
                  <td className="font-semibold text-gray-900">{s.subject}</td>
                  <td className="text-center text-gray-600 text-xs">{s.attempts.toLocaleString()}</td>
                  <td className="text-center">
                    <span className={`font-bold text-sm ${s.avgAccuracy >= 70 ? "text-emerald-600" : s.avgAccuracy >= 55 ? "text-amber-600" : "text-red-500"}`}>
                      {s.avgAccuracy}%
                    </span>
                  </td>
                  <td>
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
      )}
    </div>
  );
}
