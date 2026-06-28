import { TrendMiniChart } from "./TrendMiniChart";
import { SubjectPerformanceTable, type SubjectPerformance } from "./SubjectPerformanceTable";
import { ActivityFeed, type ActivityItem } from "./ActivityFeed";

interface GrowthTabProps {
  signups: Array<{ day: string; value: number }>;
  signupsLoading: boolean;
  signupsTotal: number;
  attemptTrend: Array<{ month: string; value: number }>;
  attemptTrendLoading: boolean;
  questionGrowth: Array<{ week: string; value: number }>;
  questionGrowthLoading: boolean;
  subjectPerformance: SubjectPerformance[];
  subjectPerformanceLoading: boolean;
  activities: ActivityItem[];
  activityLoading: boolean;
}

export function GrowthTab({
  signups, signupsLoading, signupsTotal,
  attemptTrend, attemptTrendLoading,
  questionGrowth, questionGrowthLoading,
  subjectPerformance, subjectPerformanceLoading,
  activities, activityLoading,
}: GrowthTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendMiniChart
          title="New Signups"
          subtitle="Last 30 days"
          data={signups}
          xKey="day"
          valueKey="value"
          type="area"
          color="#7c3aed"
          loading={signupsLoading}
          headline={`${signupsTotal}`}
          emptyLabel="No signups yet"
        />
        <TrendMiniChart
          title="Test Attempts"
          subtitle="Last 6 months"
          data={attemptTrend}
          xKey="month"
          valueKey="value"
          type="bar"
          color="#7c3aed"
          loading={attemptTrendLoading}
          emptyLabel="No attempt data yet"
        />
        <TrendMiniChart
          title="Questions Added"
          subtitle="Last 5 weeks"
          data={questionGrowth}
          xKey="week"
          valueKey="value"
          type="line"
          color="#7c3aed"
          loading={questionGrowthLoading}
          emptyLabel="No question data yet"
        />
      </div>

      <SubjectPerformanceTable
        data={subjectPerformance}
        loading={subjectPerformanceLoading}
        limit={5}
        viewAllLink="/admin/analytics"
      />

      <ActivityFeed activities={activities} loading={activityLoading} limit={10} title="Recent Activity" />
    </div>
  );
}
