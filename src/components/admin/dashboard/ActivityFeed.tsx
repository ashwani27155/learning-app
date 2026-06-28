import { useState } from "react";
import {
  Clock, ChevronRight, UserPlus, IndianRupee, AlertTriangle,
  CheckCircle2, Database, ClipboardList, CreditCard,
} from "lucide-react";

import { SkeletonListItem } from "../../common/Skeleton";

const ACTIVITY_ICON: Record<string, { icon: any; bg: string; text: string }> = {
  user:         { icon: UserPlus,      bg: "bg-primary-100",    text: "text-primary-600" },
  payment:      { icon: IndianRupee,   bg: "bg-emerald-100", text: "text-emerald-600" },
  alert:        { icon: AlertTriangle, bg: "bg-amber-100",   text: "text-amber-600" },
  result:       { icon: CheckCircle2,  bg: "bg-violet-100",  text: "text-violet-600" },
  question:     { icon: Database,      bg: "bg-cyan-100",    text: "text-cyan-600" },
  test:         { icon: ClipboardList, bg: "bg-violet-100",  text: "text-violet-600" },
  subscription: { icon: CreditCard,    bg: "bg-emerald-100", text: "text-emerald-600" },
};

export function actionTypeFromLog(entityType: string, action: string): string {
  if (entityType === "user") return "user";
  if (action === "bulk_updated" || action === "approved") return "result";
  return "alert";
}

export interface ActivityItem { type: string; text: string; time: string; }

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading: boolean;
  limit?: number;
  expandable?: boolean;
  title?: string;
}

export function ActivityFeed({ activities, loading, limit = 10, expandable = false, title = "Recent Activity" }: ActivityFeedProps) {
  const [activityLimit, setActivityLimit] = useState(limit);
  const visible = expandable ? activities.slice(0, activityLimit) : activities.slice(0, limit);

  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
          <Clock className="w-4 h-4 text-gray-500" />
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      <div className="flex-1 space-y-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonListItem key={i} />)
          : activities.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            )
            : visible.map((a, i) => {
                const meta = ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.alert;
                const Icon = meta.icon;
                return (
                  <div key={i}
                    className="flex items-start gap-3 py-2.5 px-2 rounded-xl hover:bg-gray-50/70 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-snug capitalize">{a.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                );
              })
        }
      </div>

      {expandable && activities.length > limit && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {activityLimit < activities.length ? (
            <button
              onClick={() => setActivityLimit(activities.length)}
              className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1"
            >
              Show {activities.length - activityLimit} more <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={() => setActivityLimit(limit)} className="text-xs text-gray-400 hover:underline">
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
