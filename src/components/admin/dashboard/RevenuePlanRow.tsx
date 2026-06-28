import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { IndianRupee, ChevronRight } from "lucide-react";
import { SkeletonBarChart } from "../../common/Skeleton";

const PLAN_DONUT_COLORS = ["#94a3b8", "#64748b", "#f59e0b", "#7c3aed"];
const PLAN_LEGEND = [
  { label: "Free",     color: "#94a3b8" },
  { label: "Silver",   color: "#64748b" },
  { label: "Gold",     color: "#f59e0b" },
  { label: "Platinum", color: "#7c3aed" },
];

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2.5 text-sm">
      <p className="font-semibold text-gray-500 text-xs mb-0.5">{label}</p>
      <p className="text-violet-700 font-bold">₹{(payload[0].value / 1000).toFixed(1)}k</p>
    </div>
  );
}

interface RevenuePlanRowProps {
  revenueData: Array<{ month: string; value: number }>;
  revenueLoading: boolean;
  totalRevenue: number;
  donutData: Array<{ name: string; value: number }>;
  totalPlanUsers: number;
}

export function RevenuePlanRow({ revenueData, revenueLoading, totalRevenue, donutData, totalPlanUsers }: RevenuePlanRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* Revenue — AreaChart */}
      <div className="lg:col-span-2 card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900">Revenue Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">All-time paid transactions</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl">
            <IndianRupee className="w-3.5 h-3.5" />
            ₹{Math.round(totalRevenue / 1000)}k
          </div>
        </div>
        {revenueLoading ? (
          <SkeletonBarChart />
        ) : revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis hide />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#7c3aed", strokeWidth: 1, strokeDasharray: "4 2" }} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2}
                fill="url(#revGrad)" dot={false}
                activeDot={{ r: 5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-44 text-gray-400">
            <IndianRupee className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No payment data yet</p>
          </div>
        )}
      </div>

      {/* Plan Distribution — Donut */}
      <div className="card p-6 flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-gray-900">Plan Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">By subscription tier</p>
        </div>

        {donutData.length > 0 ? (
          <>
            <div className="flex justify-center mb-3">
              <PieChart width={140} height={140}>
                <Pie
                  data={donutData}
                  cx={70} cy={70}
                  innerRadius={42} outerRadius={62}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {donutData.map((_: any, i: number) => (
                    <Cell key={i} fill={PLAN_DONUT_COLORS[i % PLAN_DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} users`, ""]} />
              </PieChart>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_LEGEND.map((l) => {
                const match = donutData.find((d) => d.name === l.label.toLowerCase());
                return (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-gray-600">{l.label}</span>
                    <span className="text-xs font-bold text-gray-800 ml-auto">{match?.value ?? 0}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-3 flex-1 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-6 bg-gray-100 rounded-lg" />)}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">{totalPlanUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">Total users</div>
          </div>
          <Link to="/admin/users"
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
