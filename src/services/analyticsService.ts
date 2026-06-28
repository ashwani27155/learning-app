import { api } from "../lib/api";

export interface AnalyticsOverview {
  testsCompleted: number;
  avgScore: number;
  totalCorrect: number;
  totalAttempted: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SubjectAnalytic {
  subjectId: string;
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface ProgressPoint {
  date: string;
  score: number;
  netScore: number;
  maxScore: number;
}

export interface WeakTopic {
  subjectId: string;
  accuracy: number;
  correct: number;
  total: number;
}

export type TrendGranularity = "daily" | "weekly" | "monthly" | "yearly";

export interface SubjectTrendPoint {
  period:   string;        // "YYYY-MM-DD" (daily/weekly start), "YYYY-MM" (monthly), or "YYYY" (yearly)
  accuracy: number | null; // null = no attempts that period
  correct:  number;
  total:    number;
}

export type AccuracyTrendPoint = SubjectTrendPoint;

export interface AllSubjectsTrend {
  subjectIds: string[];
  trend: Array<Record<string, string | number | null>>; // each row: { period, [subjectId]: accuracy | null }
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    return api.get<AnalyticsOverview>("/analytics/overview");
  },

  async getSubjectAnalytics(): Promise<SubjectAnalytic[]> {
    return api.get<SubjectAnalytic[]>("/analytics/subjects");
  },

  async getProgress(): Promise<ProgressPoint[]> {
    return api.get<ProgressPoint[]>("/analytics/progress");
  },

  async getWeakTopics(): Promise<WeakTopic[]> {
    return api.get<WeakTopic[]>("/analytics/weak-topics");
  },

  async getAccuracyTrend(granularity: TrendGranularity = "monthly"): Promise<AccuracyTrendPoint[]> {
    return api.get<AccuracyTrendPoint[]>(`/analytics/accuracy-trend?granularity=${granularity}`);
  },

  async getSubjectTrend(subjectId: string, granularity: TrendGranularity = "monthly"): Promise<SubjectTrendPoint[]> {
    return api.get<SubjectTrendPoint[]>(`/analytics/subject-trend/${subjectId}?granularity=${granularity}`);
  },

  async getAllSubjectsTrend(granularity: TrendGranularity = "monthly"): Promise<AllSubjectsTrend> {
    return api.get<AllSubjectsTrend>(`/analytics/subjects-trend?granularity=${granularity}`);
  },
};
