import { Link } from "react-router-dom";
import {
  Zap, ClipboardList, FileSpreadsheet, Upload, Users, BarChart2, Settings,
} from "lucide-react";

const QUICK_ACTIONS = [
  { icon: ClipboardList,   label: "Create Test Series",  link: "/admin/test-series",    gradient: "from-violet-500 to-purple-600" },
  { icon: FileSpreadsheet, label: "Import Questions",    link: "/admin/question-bank",  gradient: "from-cyan-500 to-primary-500" },
  { icon: Upload,          label: "Upload Material",     link: "/admin/study-material", gradient: "from-emerald-500 to-teal-500" },
  { icon: Users,           label: "Manage Users",        link: "/admin/users",          gradient: "from-indigo-500 to-violet-500" },
  { icon: BarChart2,       label: "Analytics",           link: "/admin/analytics",      gradient: "from-amber-400 to-orange-500" },
  { icon: Settings,        label: "Settings",            link: "/admin/settings",       gradient: "from-slate-500 to-gray-600" },
];

export function QuickActions() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="font-bold text-gray-900">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.link}
              className="group flex flex-col items-center text-center gap-2 p-3 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-purple-sm transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                {a.label}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
