import { api, setTokens, clearTokens, clearTestProgress } from "../lib/api";

export interface User {
  id:         string;
  name:       string;
  email:      string;
  phone:      string;
  role:       string;
  language:   string;
  avatar?:    string;
  isVerified: boolean;
  profile?: {
    targetExam?:  string;
    district?:    string;
    attemptYear?: number;
    referralCode?:string;
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
  subscriptions?: Array<{ plan: string; endDate: string }>;
}

interface AuthResponse {
  user:         User;
  accessToken:  string;
  refreshToken: string;
}

export const authService = {
  async register(data: {
    name: string; email: string; phone: string;
    password: string; language?: "en" | "mr";
    targetExam?: string; district?: string; referral?: string;
  }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/register", data, { auth: false });
    clearTestProgress();
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/login", { email, password }, { auth: false });
    clearTestProgress();
    setTokens(res.accessToken, res.refreshToken);
    return res;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken }).catch(() => {});
    clearTokens();
  },

  async getMe(): Promise<User> {
    return api.get<User>("/auth/me");
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email }, { auth: false });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post("/auth/reset-password", { token, newPassword }, { auth: false });
  },
};

// Persist current user in memory across route changes
let _currentUser: User | null = null;

export const getCurrentUser  = () => _currentUser;
export const setCurrentUser  = (u: User | null) => { _currentUser = u; };
