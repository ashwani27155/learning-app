import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, BarChart2, TrendingUp, BookOpen,
  Calendar, Layers, Trophy, Gem, LogOut,
  Bell, Menu, ChevronLeft, ChevronRight, X, Flame, User, Bookmark, Gift,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { userService, type Notification } from "../../services/userService";
import { api } from "../../lib/api";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                  "Dashboard",
  "/dashboard/my-tests":         "My Tests",
  "/dashboard/my-results":       "My Results",
  "/dashboard/analytics":        "Analytics",
  "/dashboard/study-material":   "Study Material",
  "/dashboard/bookmarks":        "Bookmarked Questions",
  "/dashboard/referrals":        "Refer & Share",
  "/dashboard/profile":          "My Profile",
  "/dashboard/notifications":    "Notifications",
  "/dashboard/daily-practice":   "Daily Practice",
  "/dashboard/flashcards":       "Flashcards",
  "/dashboard/leaderboard":      "Leaderboard",
};

const MAIN_NAV = [
  { path: "/dashboard",                  Icon: LayoutDashboard, label: "Dashboard",     exact: true },
  { path: "/dashboard/my-tests",         Icon: FileText,        label: "My Tests" },
  { path: "/dashboard/my-results",       Icon: BarChart2,       label: "Results" },
  { path: "/dashboard/analytics",        Icon: TrendingUp,      label: "Analytics" },
  { path: "/dashboard/study-material",   Icon: BookOpen,        label: "Study Material" },
  { path: "/dashboard/bookmarks",        Icon: Bookmark,        label: "Bookmarks" },
  { path: "/dashboard/referrals",        Icon: Gift,            label: "Refer & Share" },
  { path: "/dashboard/profile",          Icon: User,            label: "My Profile" },
];

const PRACTICE_NAV = [
  { path: "/dashboard/daily-practice", Icon: Calendar,      label: "Daily Practice" },
  { path: "/dashboard/flashcards",     Icon: Layers,        label: "Flashcards" },
  { path: "/dashboard/leaderboard",    Icon: Trophy,        label: "Leaderboard" },
];

const BOTTOM_NAV = [
  { path: "/dashboard",            Icon: LayoutDashboard, label: "Home",    exact: true },
  { path: "/dashboard/my-tests",   Icon: FileText,        label: "Tests" },
  { path: "/dashboard/analytics",  Icon: TrendingUp,      label: "Progress" },
  { path: "/dashboard/my-results", Icon: BarChart2,       label: "Results" },
];

interface SidebarInnerProps {
  showLabels: boolean;
  isActive: (path: string, exact?: boolean) => boolean;
  onClose?: () => void;
}

function SidebarInner({ showLabels, isActive, onClose }: SidebarInnerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: publicSettingsRaw } = useQuery({
    queryKey: ["public-settings"],
    queryFn:  () => api.get<any>("/settings"),
    staleTime: 300_000,
  });
  const publicSettings = (publicSettingsRaw as any)?.data ?? publicSettingsRaw ?? null;
  const referAndShareVisible = publicSettings?.dashboardVisibility?.referAndShare ?? true;
  const mainNav = MAIN_NAV.filter(item => referAndShareVisible || item.path !== "/dashboard/referrals");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <>
      {/* User card */}
      <div className="px-4 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-phonepe-card flex items-center justify-center text-white font-bold shadow-purple-sm flex-shrink-0">
            {initials}
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user?.name ?? "Student"}</div>
              <div className="text-xs text-primary-300">{user?.profile?.targetExam ?? "MPSC Aspirant"}</div>
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className="ml-auto p-1 rounded-lg text-primary-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {showLabels && (user?.streak?.currentStreak ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">
              {user!.streak!.currentStreak} day streak
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-4">
        <div>
          {showLabels && <p className="sidebar-section-label">Main</p>}
          <div className="space-y-0.5">
            {mainNav.map(({ path, Icon, label, exact }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                title={!showLabels ? label : undefined}
                className={`sidebar-link ${isActive(path, exact) ? "active" : ""}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {showLabels && <span className="truncate">{label}</span>}
              </Link>
            ))}
          </div>
        </div>

        <div>
          {showLabels && <p className="sidebar-section-label">Practice Tools</p>}
          <div className="space-y-0.5">
            {PRACTICE_NAV.map(({ path, Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                title={!showLabels ? label : undefined}
                className={`sidebar-link ${isActive(path) ? "active" : ""}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {showLabels && <span className="truncate">{label}</span>}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-white/10 space-y-0.5 flex-shrink-0">
        <Link
          to="/pricing"
          onClick={onClose}
          title={!showLabels ? "Upgrade" : undefined}
          className="sidebar-link"
        >
          <Gem className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Upgrade Plan</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={!showLabels ? "Logout" : undefined}
          className="sidebar-link w-full text-left"
          style={{ color: "#fca5a5" }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationBell() {
  const navigate = useNavigate();
  const [open,         setOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,       setUnread]       = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    userService.getNotifications()
      .then(r => { setNotifications(r.notifications.slice(0, 5)); setUnread(r.unreadCount); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAll = async () => {
    await userService.markAllRead().catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary-600 hover:underline font-medium">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              You're all caught up!
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { setOpen(false); if (n.link) navigate(n.link); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors ${!n.isRead ? "bg-primary-50/40" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm flex-shrink-0">🔔</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <button onClick={() => { setOpen(false); navigate("/dashboard/notifications"); }}
              className="w-full text-center text-xs text-primary-600 font-semibold hover:underline">
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const sidebarBg = "linear-gradient(180deg,#1e1b4b 0%,#5b21b6 60%,#6d28d9 100%)";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f7f4fc" }}>

      {/* Desktop Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-60" : "w-16"} hidden md:flex flex-col flex-shrink-0 transition-all duration-300`}
        style={{ background: sidebarBg }}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-phonepe-card flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-purple-sm">
            M
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">MPSC Sadhak</div>
              <div className="text-[10px] text-primary-400 tracking-widest">STUDENT PORTAL</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="ml-auto p-1.5 rounded-lg text-primary-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        <SidebarInner showLabels={sidebarOpen} isActive={isActive} />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <aside className="w-72 flex flex-col flex-shrink-0 drawer-slide-in" style={{ background: sidebarBg }}>
            <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-phonepe-card flex items-center justify-center text-white font-bold text-sm shadow-purple-sm">M</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm">MPSC Sadhak</div>
                <div className="text-[10px] text-primary-400 tracking-widest">STUDENT PORTAL</div>
              </div>
            </div>
            <SidebarInner showLabels={true} isActive={isActive} onClose={() => setDrawerOpen(false)} />
          </aside>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 md:h-16 bg-white border-b border-primary-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-purple-sm z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-all -ml-1"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-[15px] font-bold text-gray-900 leading-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white border-t border-primary-100"
        style={{ boxShadow: "0 -2px 12px rgba(95,37,159,0.1)" }}
      >
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(({ path, Icon, label, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link key={path} to={path} className={`bottom-nav-item ${active ? "active" : ""}`}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-b-full" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setDrawerOpen(true)} className="bottom-nav-item">
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
