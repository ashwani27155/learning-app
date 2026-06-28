import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authService, setCurrentUser, type User } from "../services/auth.service";
import { getAccessToken, clearTokens } from "../lib/api";
import { DEMO_MODE } from "../lib/demoMode";

interface RegisterData {
  name: string; email: string; phone: string;
  password: string; language?: "en" | "mr";
  targetExam?: string; district?: string; referral?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_STUDENT: User = {
  id: "demo-student",
  name: "Arjun Patil",
  email: "student@mpsc.com",
  phone: "9876543210",
  role: "student",
  language: "en",
  isVerified: true,
  profile: { targetExam: "RAJYASEVA", district: "Pune" },
  streak: { currentStreak: 12, longestStreak: 21 },
  subscriptions: [{ plan: "free", endDate: "" }],
};

const DEMO_ADMIN: User = {
  id: "demo-admin",
  name: "Super Admin",
  email: "admin@mpsc.com",
  phone: "9000000000",
  role: "admin",
  language: "en",
  isVerified: true,
};

const DEMO_USERS: Record<string, User> = {
  "student@mpsc.com": DEMO_STUDENT,
  "admin@mpsc.com": DEMO_ADMIN,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      const role = localStorage.getItem("demo_role");
      const demoUser = role === "admin" ? DEMO_ADMIN : role === "student" ? DEMO_STUDENT : null;
      if (demoUser) { setUser(demoUser); setCurrentUser(demoUser); }
      setIsLoading(false);
      return;
    }
    const token = getAccessToken();
    if (!token) { setIsLoading(false); return; }
    authService
      .getMe()
      .then((u) => { setUser(u); setCurrentUser(u); })
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    if (DEMO_MODE) {
      const demoUser = DEMO_USERS[email.toLowerCase().trim()];
      if (!demoUser)
        throw new Error("Invalid credentials. Use student@mpsc.com or admin@mpsc.com");
      localStorage.setItem("demo_role", demoUser.role === "admin" ? "admin" : "student");
      setUser(demoUser);
      setCurrentUser(demoUser);
      return demoUser;
    }
    const { user: u } = await authService.login(email, password);
    setUser(u);
    setCurrentUser(u);
    return u;
  };

  // Mirrors login() — without this, registering stores tokens but never
  // updates context state, so isAuthenticated stays false and the very
  // first ProtectedRoute render after signup bounces back to /auth/login.
  const register = async (data: RegisterData): Promise<User> => {
    const { user: u } = await authService.register(data);
    setUser(u);
    setCurrentUser(u);
    return u;
  };

  const logout = () => {
    if (DEMO_MODE) {
      localStorage.removeItem("demo_role");
    } else {
      const refresh = localStorage.getItem("refreshToken") ?? "";
      authService.logout(refresh).catch(() => {});
    }
    setUser(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (DEMO_MODE) return;
    const u = await authService.getMe();
    setUser(u);
    setCurrentUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
