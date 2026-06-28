import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, TrendingUp, FileText, Database, BookOpen,
  Users, Settings, Globe, LogOut, Bell, Menu, ChevronLeft,
  ChevronRight, X, ClipboardCheck, AlertTriangle, Printer,
  Tag, Star, MessageSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const PAGE_TITLES: Record<string, string> = {
  "/admin":                "Dashboard",
  "/admin/analytics":      "Analytics",
  "/admin/test-series":    "Test Series",
  "/admin/question-bank":  "Question Bank",
  "/admin/study-material": "Study Material",
  "/admin/users":          "Users",
  "/admin/coupons":        "Coupons",
  "/admin/testimonials":   "Testimonials",
  "/admin/notifications":  "Notifications",
  "/admin/discussions":    "Discussions",
  "/admin/audit-logs":     "Audit Logs",
  "/admin/settings":       "Settings",
  "/admin/paper-builder":  "Paper Builder",
  "/admin/live-monitor":   "Live Monitor",
};

const adminNav = [
  {
    section: "Overview",
    items: [
      { path: "/admin",           Icon: LayoutDashboard, label: "Dashboard", exact: true },
      { path: "/admin/analytics", Icon: TrendingUp,      label: "Analytics" },
    ],
  },
  {
    section: "Content",
    items: [
      { path: "/admin/test-series",    Icon: FileText,  label: "Test Series" },
      { path: "/admin/question-bank",  Icon: Database,  label: "Question Bank" },
      { path: "/admin/study-material", Icon: BookOpen,  label: "Study Material" },
      { path: "/admin/paper-builder",  Icon: Printer,   label: "Paper Builder" },
    ],
  },
  {
    section: "Management",
    items: [
      { path: "/admin/users",         Icon: Users,          label: "Users" },
      { path: "/admin/coupons",       Icon: Tag,            label: "Coupons" },
      { path: "/admin/testimonials",  Icon: Star,           label: "Testimonials" },
      { path: "/admin/notifications", Icon: Bell,           label: "Notifications" },
      { path: "/admin/discussions",   Icon: MessageSquare,  label: "Discussions" },
      { path: "/admin/audit-logs",    Icon: ClipboardCheck, label: "Audit Logs" },
      { path: "/admin/settings",   Icon: Settings,       label: "Settings" },
    ],
  },
];

const sidebarBg = "linear-gradient(180deg,#0f0a2e 0%,#1e1b4b 40%,#5b21b6 100%)";

interface SidebarInnerProps {
  showLabels: boolean;
  isActive: (path: string, exact?: boolean) => boolean;
  onClose?: () => void;
}

function SidebarInner({ showLabels, isActive, onClose }: SidebarInnerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "SA";

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <>
      {/* User card (only when expanded) */}
      {showLabels && (
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Gradient avatar with online dot */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-xs shadow-purple-sm">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1e1b4b] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.name ?? "Admin"}</div>
              <div className="text-primary-400 text-[10px] truncate">{user?.email ?? "admin@mpsc-sadhak.com"}</div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-primary-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {adminNav.map((section, idx) => (
          <div key={section.section} className="mb-1">
            {/* Section separator (not before first) */}
            {idx > 0 && showLabels && (
              <div className="h-px bg-white/10 mx-2 mt-2 mb-3" />
            )}
            {showLabels && (
              <p className="sidebar-section-label">{section.section}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, Icon, label, exact }) => {
                const active = isActive(path, exact);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    title={!showLabels ? label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-white/15 text-white border-l-2 border-accent-400 pl-2.5"
                        : "text-primary-300 hover:text-white hover:bg-white/10 border-l-2 border-transparent pl-2.5"
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-accent-400" : ""}`} />
                    {showLabels && <span className="truncate">{label}</span>}
                    {active && showLabels && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-white/10 space-y-0.5 flex-shrink-0">
        <Link
          to="/"
          onClick={onClose}
          title={!showLabels ? "View Site" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-primary-400 hover:text-white hover:bg-white/10 text-sm transition-all border-l-2 border-transparent pl-2.5"
        >
          <Globe className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>View Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={!showLabels ? "Logout" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 text-sm transition-all w-full text-left border-l-2 border-transparent pl-2.5"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => location.pathname.startsWith(key + "/"))?.[1] ??
    "Admin Panel";

  const { data: pendingData } = useQuery({
    queryKey: ["admin", "pending"],
    queryFn:  () => api.get<any>("/admin/pending-actions"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const totalPending = (pendingData?.pendingQuestions ?? 0) + (pendingData?.pendingMaterials ?? 0);

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const { user } = useAuth();
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "SA";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f7f4fc" }}>

      {/* Desktop Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-60"} hidden md:flex flex-col flex-shrink-0 transition-all duration-300`}
        style={{ background: sidebarBg }}
      >
        {/* Logo row */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-purple-sm text-sm">
            M
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm truncate">MPSC Sadhak</div>
              <div className="text-[10px] text-accent-400 tracking-widest font-medium">ADMIN PANEL</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto p-1.5 rounded-lg text-primary-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <SidebarInner showLabels={!collapsed} isActive={isActive} />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <aside className="w-72 flex flex-col flex-shrink-0 drawer-slide-in" style={{ background: sidebarBg }}>
            <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold shadow-purple-sm text-sm">M</div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">MPSC Sadhak</div>
                <div className="text-[10px] text-accent-400 tracking-widest font-medium">ADMIN PANEL</div>
              </div>
            </div>
            <SidebarInner showLabels={true} isActive={isActive} onClose={() => setDrawerOpen(false)} />
          </aside>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 md:h-16 bg-white border-b border-primary-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-purple-sm z-10">

          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden p-2 rounded-xl hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-all -ml-1 flex-shrink-0"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb — visible on sm+ */}
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <Link to="/admin" className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0 hidden sm:block">
                Admin
              </Link>
              {location.pathname !== "/admin" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 hidden sm:block" />
                  <span className="font-bold text-gray-900 truncate">{pageTitle}</span>
                </>
              )}
              {location.pathname === "/admin" && (
                <span className="font-bold text-gray-900 hidden sm:block">{pageTitle}</span>
              )}
              {/* Mobile: just page title */}
              <span className="font-bold text-gray-900 sm:hidden truncate">{pageTitle}</span>
            </div>
          </div>

          {/* Right: bell + date + avatar */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(o => !o)}
                className="relative p-2 rounded-xl hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-all"
              >
                <Bell className="w-5 h-5" />
                {totalPending > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {totalPending > 9 ? "9+" : totalPending}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-bold text-sm text-gray-900">Pending Actions</p>
                    <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {pendingData?.pendingQuestions > 0 && (
                      <Link to="/admin/question-bank" onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pendingData.pendingQuestions} questions need approval</p>
                          <p className="text-xs text-gray-400">Question Bank</p>
                        </div>
                      </Link>
                    )}
                    {pendingData?.pendingMaterials > 0 && (
                      <Link to="/admin/study-material" onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pendingData.pendingMaterials} materials need review</p>
                          <p className="text-xs text-gray-400">Study Material</p>
                        </div>
                      </Link>
                    )}
                    {pendingData?.newUsersToday > 0 && (
                      <Link to="/admin/users" onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pendingData.newUsersToday} new users today</p>
                          <p className="text-xs text-gray-400">User Management</p>
                        </div>
                      </Link>
                    )}
                    {(!pendingData || (totalPending === 0 && !pendingData?.newUsersToday)) && (
                      <p className="text-sm text-gray-400 text-center py-6">No pending actions</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-xs text-gray-400 hidden sm:inline">
              {new Date().toLocaleDateString("en-IN")}
            </span>

            {/* Avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-xs shadow-purple-sm cursor-pointer">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
