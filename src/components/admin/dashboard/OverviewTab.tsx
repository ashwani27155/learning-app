import { SkeletonKPICard } from "../../common/Skeleton";
import { KpiCard, type KpiCardProps } from "./KpiCard";
import { AlertStrip, type DashboardAlert } from "./AlertStrip";
import { RevenuePlanRow } from "./RevenuePlanRow";
import { QuickActions } from "./QuickActions";
import { ActivityFeed, type ActivityItem } from "./ActivityFeed";

interface OverviewTabProps {
  alerts: DashboardAlert[];
  kpisLoading: boolean;
  kpis: KpiCardProps[] | null;
  revenueData: Array<{ month: string; value: number }>;
  revenueLoading: boolean;
  totalRevenue: number;
  donutData: Array<{ name: string; value: number }>;
  totalPlanUsers: number;
  activities: ActivityItem[];
  activityLoading: boolean;
}

export function OverviewTab({
  alerts, kpisLoading, kpis, revenueData, revenueLoading, totalRevenue,
  donutData, totalPlanUsers, activities, activityLoading,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <AlertStrip alerts={alerts} />

      {/* KPI strip — 5 up */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {kpisLoading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonKPICard key={i} />)
          : (kpis ?? []).map((k) => <KpiCard key={k.label} {...k} compact />)
        }
      </div>

      <RevenuePlanRow
        revenueData={revenueData}
        revenueLoading={revenueLoading}
        totalRevenue={totalRevenue}
        donutData={donutData}
        totalPlanUsers={totalPlanUsers}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={activityLoading} limit={5} expandable />
        </div>
      </div>
    </div>
  );
}
