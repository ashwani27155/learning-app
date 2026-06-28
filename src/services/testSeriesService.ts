import { api } from "../lib/api";

export interface SeriesTest {
  id: string;
  titleEn: string;
  titleMr: string;
  status: string;
  duration: number;
  totalMarks: number;
  passingPct: number;
  negativeMarking: boolean;
  attemptCount: number;
  orderIndex: number;
  isFree: boolean;
}

export interface TestSeriesItem {
  id: string;
  titleEn: string;
  titleMr: string;
  descriptionEn?: string;
  type: string;
  groupType?: string;
  isPremium: boolean;
  price: number;
  discountedPrice?: number;
  thumbnail?: string;
  status: string;
  enrolledCount: number;
  subject?: { nameEn: string; nameMr: string };
  tests: SeriesTest[];
}

export const testSeriesService = {
  async getByGroup(group: string): Promise<TestSeriesItem[]> {
    return api.get<TestSeriesItem[]>(`/test-series/group/${group}`);
  },

  async getAll(params?: { page?: number; limit?: number; type?: string; group?: string }): Promise<TestSeriesItem[]> {
    return api.get<TestSeriesItem[]>(`/test-series`, { params: params as any });
  },

  async getById(seriesId: string): Promise<TestSeriesItem> {
    return api.get<TestSeriesItem>(`/test-series/${seriesId}`);
  },

  async enroll(seriesId: string): Promise<void> {
    await api.post(`/test-series/${seriesId}/enroll`);
  },

  async getEnrolled(): Promise<Array<{ id: string }>> {
    const data = await api.get<any[]>("/test-series/enrolled/me");
    return (data ?? []).map((e: any) => ({ id: e.id ?? e.series?.id }));
  },

  async getLeaderboard(testId: string): Promise<Array<{
    rank: number; score: number; timeTaken: number; percentage: number;
    user: { name: string; avatar?: string };
  }>> {
    return api.get(`/tests/${testId}/leaderboard`);
  },
};
