import { api } from "../lib/api";

export interface MyTest {
  id: string;
  series: {
    id: string;
    titleEn: string;
    titleMr: string;
    groupType?: string;
    type: string;
    isPremium: boolean;
    tests: Array<{ id: string; titleEn: string; status: string }>;
  };
  enrolledAt: string;
}

export interface MyResult {
  id: string;
  testId: string;
  attemptId: string;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  maxScore: number;
  percentage: number;
  rank?: number;
  percentile?: number;
  timeTaken?: number;
  isPassed: boolean;
  createdAt: string;
  test: { titleEn: string };
  attempt: { startedAt: string; submittedAt?: string };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  language: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    targetExam?: string;
    district?: string;
    attemptYear?: number;
    dateOfBirth?: string;
    referralCode?: string;
  };
  streak?: { currentStreak: number; longestStreak: number };
  subscriptions?: Array<{ plan: string; endDate: string }>;
  referredCount?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const userService = {
  async getMyTests(): Promise<MyTest[]> {
    return api.get<MyTest[]>("/users/my-tests");
  },

  async getMyResults(): Promise<MyResult[]> {
    return api.get<MyResult[]>("/users/my-results");
  },

  async getProfile(): Promise<UserProfile> {
    return api.get<UserProfile>("/users/profile");
  },

  async updateProfile(data: {
    name?: string;
    language?: string;
    targetExam?: string;
    district?: string;
    attemptYear?: number;
    dateOfBirth?: string;
  }): Promise<UserProfile> {
    return api.put<UserProfile>("/users/profile", data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put("/users/change-password", { currentPassword, newPassword });
  },

  async getStreak(): Promise<{ currentStreak: number; longestStreak: number }> {
    return api.get("/users/streak");
  },

  async completeDailyQuiz(): Promise<{ currentStreak: number; longestStreak: number }> {
    return api.post("/users/daily-quiz-complete");
  },

  async getBookmarks(): Promise<Array<{ id: string; textEn: string; textMr: string; difficulty?: string; subject?: { nameEn: string } }>> {
    return api.get("/users/bookmarks");
  },

  async addBookmark(questionId: string): Promise<void> {
    await api.post(`/users/bookmarks/${questionId}`);
  },

  async removeBookmark(questionId: string): Promise<void> {
    await api.delete(`/users/bookmarks/${questionId}`);
  },

  async getNotifications(unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return api.get("/users/notifications", { params: { unread: unreadOnly ? "true" : undefined } });
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.put(`/users/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.put("/users/notifications/read-all");
  },
};
