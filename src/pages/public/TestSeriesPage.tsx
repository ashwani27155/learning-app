import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Layers, Clock, Users, ChevronDown, ChevronUp,
  Lock, Play, Radio, Search,
  Zap, FileText, Star, AlertTriangle, ArrowUpDown,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Test {
  id: string; titleEn: string; titleMr?: string;
  durationMin: number; totalMarks: number; totalQuestions: number;
  passingPercent: number; negativeMarking: boolean;
  status: string; attemptCount?: number; isFree?: boolean;
}
interface Series {
  id: string; titleEn: string; titleMr?: string;
  type: string; groupType?: string;
  isPremium: boolean; price?: number;
  testCount?: number; enrolledCount?: number;
  status: string; description?: string;
  tests?: Test[];
}

// ── Sidebar categories ─────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "group", label: "Group Wise", icon: Layers,
    children: [
      { id: "GROUP_A", label: "Group A (Gazetted)", sub: "Rajyaseva, Class I & II" },
      { id: "GROUP_B", label: "Group B (Non-Gazetted)", sub: "PSI, STI, ASO" },
      { id: "GROUP_C", label: "Group C (Technical)", sub: "Junior Engineer" },
      { id: "GROUP_D", label: "Group D (Support)", sub: "Support Staff" },
    ],
  },
  { id: "SUBJECT_WISE", label: "Subject Wise",  icon: BookOpen },
  { id: "PYQ",          label: "Previous Year",  icon: FileText },
  { id: "FREE",         label: "Free Tests",     icon: Star },
  { id: "LIVE",         label: "Live Tests",      icon: Radio },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function LiveCountdown({ scheduledAt }: { scheduledAt?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!scheduledAt) return;
    const update = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setLabel("LIVE NOW"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [scheduledAt]);
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${label === "LIVE NOW" ? "bg-red-100 text-red-600 animate-pulse" : "bg-orange-50 text-orange-600"}`}>
      {label || "Upcoming"}
    </span>
  );
}

function SeriesCard({ series, isEnrolled }: { series: Series; isEnrolled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLive = series.type === "LIVE";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Type badge */}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 uppercase tracking-wide">
                {series.type.replace(/_/g, " ")}
              </span>
              {/* Free / Premium */}
              {!series.isPremium ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">FREE</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">PREMIUM</span>
              )}
              {/* Live */}
              {isLive && <LiveCountdown />}
            </div>
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{series.titleEn}</h3>
            {series.titleMr && <p className="text-xs text-gray-500 mt-0.5 italic">{series.titleMr}</p>}
            {series.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{series.description}</p>}
          </div>

          {/* Price / enroll */}
          <div className="flex-shrink-0 text-right">
            {isEnrolled ? (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">Enrolled</span>
            ) : series.isPremium ? (
              <span className="text-sm font-bold text-gray-900">
                {series.price ? `₹${series.price}` : "Premium"}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600">Free</span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          {series.testCount !== undefined && (
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{series.testCount} Tests</span>
          )}
          {series.enrolledCount !== undefined && (
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{series.enrolledCount.toLocaleString("en-IN")} Enrolled</span>
          )}
        </div>

        {/* Expand toggle */}
        {(series.tests ?? []).length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "Hide tests" : `View ${(series.tests ?? []).length} tests`}
          </button>
        )}
      </div>

      {/* Expanded test list */}
      {expanded && (series.tests ?? []).length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {(series.tests ?? []).map((test, idx) => (
            <TestRow key={test.id} test={test} idx={idx} isPremiumSeries={series.isPremium} isEnrolled={isEnrolled} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestRow({ test, idx, isPremiumSeries, isEnrolled }: { test: Test; idx: number; isPremiumSeries: boolean; isEnrolled: boolean }) {
  const locked = isPremiumSeries && !isEnrolled && !test.isFree;
  const t = test as any;

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-medium text-gray-900 truncate">{test.titleEn}</p>
          {test.negativeMarking && (
            <span title="Negative marking applies" className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />−ve
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400 flex-wrap">
          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{t.duration ?? test.durationMin}m</span>
          <span>{t.totalQuestions ?? "?"} Q</span>
          <span>{t.totalMarks} marks</span>
          {t.passingPct > 0 && <span>Pass: {t.passingPct}%</span>}
          {(t.attemptCount ?? test.attemptCount) > 0 && (
            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{(t.attemptCount ?? test.attemptCount).toLocaleString("en-IN")}</span>
          )}
        </div>
      </div>
      {locked ? (
        <Link to="/pricing" className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl hover:bg-amber-100 transition-all flex-shrink-0">
          <Lock className="w-3 h-3" /> Subscribe
        </Link>
      ) : (
        <Link to={`/test/${test.id}/instructions`}
          className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-1.5 rounded-xl hover:bg-primary-100 transition-all flex-shrink-0">
          <Play className="w-3 h-3" /> Start
        </Link>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TestSeriesPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();

  const categoryParam = params.get("category") ?? "GROUP_A";
  const searchParam   = params.get("q") ?? "";

  const [openGroup, setOpenGroup] = useState(true);
  const [search, setSearch]       = useState(searchParam);
  const [sortBy, setSortBy]       = useState("enrolledCount");

  const setCategory = (cat: string) => {
    setParams(p => { p.set("category", cat); p.delete("q"); return p; });
    setSearch("");
  };

  // ── Enrolled series (only when logged in) ─────────────────────────────────
  const { data: enrolledRaw } = useQuery({
    queryKey: ["enrolled-series"],
    queryFn:  () => api.get<any>("/test-series/enrolled/me"),
    enabled:  !!user,
    staleTime: 60_000,
  });
  const enrolledIds = useMemo(() => {
    const list = enrolledRaw?.data ?? (Array.isArray(enrolledRaw) ? enrolledRaw : []);
    return new Set<string>(list.map((e: any) => e.id ?? e.seriesId));
  }, [enrolledRaw]);

  // ── API fetch ──────────────────────────────────────────────────────────────
  const isGroupCategory = categoryParam.startsWith("GROUP_");

  const { data: seriesRaw, isLoading } = useQuery({
    queryKey: ["test-series-browse", categoryParam, sortBy],
    queryFn: () => {
      if (isGroupCategory) {
        return api.get<any>(`/test-series/group/${categoryParam.replace("GROUP_", "").toLowerCase()}`);
      }
      const baseParams: Record<string, any> = { sortBy, order: "desc", limit: 30 };
      if (categoryParam === "FREE") {
        return api.get<any>("/test-series", { params: { ...baseParams, isPremium: false, status: "published" } });
      }
      if (categoryParam === "LIVE") {
        return api.get<any>("/test-series", { params: { ...baseParams, type: "LIVE" } });
      }
      return api.get<any>("/test-series", { params: { ...baseParams, type: categoryParam, status: "published" } });
    },
    staleTime: 60_000,
  });

  const rawList: Series[] = useMemo(() => {
    const data = seriesRaw?.data ?? seriesRaw;
    return Array.isArray(data) ? data : [];
  }, [seriesRaw]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rawList;
    const q = search.toLowerCase();
    return rawList.filter(s => s.titleEn.toLowerCase().includes(q) || s.titleMr?.toLowerCase().includes(q));
  }, [rawList, search]);

  // Active category label
  const activeLabel = (() => {
    for (const cat of CATEGORIES) {
      if (cat.children) {
        const child = cat.children.find(c => c.id === categoryParam);
        if (child) return child.label;
      }
      if (cat.id === categoryParam) return cat.label;
    }
    return "Test Series";
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top search bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div>
            <Link to="/" className="text-xs text-gray-400 hover:text-primary-600 transition-colors">Home</Link>
            <span className="text-gray-300 mx-1.5">›</span>
            <span className="text-xs font-semibold text-gray-700">{activeLabel}</span>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search test series…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          {user ? (
            <Link to="/dashboard" className="btn-primary text-xs px-4 py-2">My Dashboard</Link>
          ) : (
            <Link to="/auth/login" className="btn-primary text-xs px-4 py-2">Sign in</Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-0 min-h-[calc(100vh-56px)]">

        {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 py-6 px-3 hidden md:block sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Browse</p>
          <nav className="space-y-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isParentActive = cat.children
                ? cat.children.some(c => c.id === categoryParam)
                : cat.id === categoryParam;

              if (cat.children) {
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => setOpenGroup(o => !o)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isParentActive ? "text-primary-700 bg-primary-50" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{cat.label}</span>
                      </div>
                      {openGroup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {openGroup && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                        {cat.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => setCategory(child.id)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-all ${categoryParam === child.id ? "bg-primary-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                          >
                            <div className="text-xs font-semibold">{child.label}</div>
                            <div className={`text-[10px] ${categoryParam === child.id ? "text-primary-200" : "text-gray-400"}`}>{child.sub}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${categoryParam === cat.id ? "bg-primary-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${categoryParam === cat.id && cat.id === "LIVE" ? "text-red-400 animate-pulse" : ""}`} />
                  <span>{cat.label}</span>
                  {cat.id === "FREE" && <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${categoryParam === cat.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"}`}>FREE</span>}
                  {cat.id === "LIVE"  && <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${categoryParam === cat.id ? "bg-white/20 text-white" : "bg-red-100 text-red-600"}`}>LIVE</span>}
                </button>
              );
            })}
          </nav>

          {/* Upgrade CTA */}
          {!user && (
            <div className="mt-8 mx-2 bg-gradient-to-br from-primary-600 to-violet-600 rounded-2xl p-4 text-white">
              <Zap className="w-5 h-5 mb-2 text-yellow-300" />
              <p className="text-xs font-bold mb-1">Unlock All Tests</p>
              <p className="text-[10px] text-primary-200 mb-3">Get unlimited access with a Silver, Gold or Platinum plan</p>
              <Link to="/pricing" className="block text-center text-[11px] font-bold bg-white text-primary-700 rounded-xl py-1.5 hover:bg-primary-50 transition-colors">
                View Plans
              </Link>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-5">
          {/* Section heading */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900">{activeLabel}</h2>
              {!isLoading && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {filtered.length} series found{search ? ` for "${search}"` : ""}
                </p>
              )}
            </div>
            {!isGroupCategory && (
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="enrolledCount">Most Popular</option>
                  <option value="createdAt">Newest</option>
                  <option value="price">Price: Low to High</option>
                </select>
              </div>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <BookOpen className="w-14 h-14 opacity-20 mb-4" />
              <p className="text-base font-semibold text-gray-500">No test series found</p>
              <p className="text-sm mt-1">
                {search ? "Try a different search term" : "Check back soon — more series are being added"}
              </p>
            </div>
          )}

          {/* Series list */}
          {!isLoading && filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map(series => (
                <SeriesCard key={series.id} series={series} isEnrolled={enrolledIds.has(series.id)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
