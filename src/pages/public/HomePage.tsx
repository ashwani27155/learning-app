import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const FALLBACK_STATS = [
  { value: "50,000+", label: "Students" },
  { value: "2,500+",  label: "Tests" },
  { value: "1,50,000+", label: "Questions" },
  { value: "94%",    label: "Success Rate" },
];

const testSeries = {
  group: [
    { key: "a", title: "Group A — Gazetted",       subtitle: "Rajyaseva & Class-I posts", tests: 45, enrolled: 12400, price: 0,   badge: "Free" },
    { key: "b", title: "Group B — Non-Gazetted",   subtitle: "PSI, STI, ASO combined",    tests: 38, enrolled: 9800,  price: 999, badge: "Popular" },
    { key: "c", title: "Group C — Technical",      subtitle: "Junior Engineer & related",  tests: 30, enrolled: 7600,  price: 799, badge: "" },
    { key: "d", title: "Group D — Class IV",       subtitle: "Support staff posts",        tests: 25, enrolled: 5400,  price: 499, badge: "" },
  ],
  subject: [
    { subject: "Marathi Language", icon: "📖", tests: 28, questions: 2800, color: "bg-primary-50 border-primary-200" },
    { subject: "General Studies",  icon: "🌍", tests: 45, questions: 4500, color: "bg-green-50 border-green-200" },
    { subject: "History",          icon: "🏛️", tests: 22, questions: 2200, color: "bg-yellow-50 border-yellow-200" },
    { subject: "Geography",        icon: "🗺️", tests: 20, questions: 2000, color: "bg-primary-50 border-primary-200" },
    { subject: "Political Science",icon: "⚖️", tests: 18, questions: 1800, color: "bg-red-50 border-red-200" },
    { subject: "Economics",        icon: "💰", tests: 16, questions: 1600, color: "bg-orange-50 border-orange-200" },
  ],
  pyq: [
    { year: "2024", exam: "Rajyaseva Pre",   questions: 100, time: "60 min", attempts: 24500 },
    { year: "2023", exam: "Rajyaseva Pre",   questions: 100, time: "60 min", attempts: 31200 },
    { year: "2024", exam: "PSI Pre Exam",    questions: 100, time: "60 min", attempts: 18700 },
    { year: "2023", exam: "STI Pre Exam",    questions: 100, time: "60 min", attempts: 15300 },
  ],
  live: [
    { title: "Rajyaseva Mock Test #12", date: "Tomorrow 10:00 AM", seats: 500, registered: 342, status: "open" },
    { title: "PSI Full Mock 2024",      date: "Jun 5, 2:00 PM",    seats: 300, registered: 189, status: "open" },
    { title: "STI Grand Test",          date: "Jun 8, 11:00 AM",   seats: 200, registered: 200, status: "full" },
  ],
};

const materials = [
  { title: "MPSC Rajyaseva Complete Syllabus 2026", type: "PDF",   subject: "All Subjects",    pages: 248, downloads: 18400, access: "Free" },
  { title: "Maharashtra Geography — Complete Notes", type: "PDF",   subject: "Geography",       pages: 96,  downloads: 12300, access: "Free" },
  { title: "MPSC Current Affairs May 2026",          type: "PDF",   subject: "Current Affairs", pages: 64,  downloads: 9800,  access: "Free" },
  { title: "Marathi Grammar Complete Guide",         type: "Ebook", subject: "Marathi",         pages: 320, downloads: 7600,  access: "Premium" },
  { title: "History Timeline Handbook",              type: "PDF",   subject: "History",         pages: 72,  downloads: 11200, access: "Free" },
  { title: "Science & Technology Notes 2026",        type: "PDF",   subject: "Science",         pages: 128, downloads: 8900,  access: "Basic" },
];

const testimonials = [
  { name: "Priya Deshmukh", exam: "MPSC State Service 2023", rank: 45, photo: "PD", content: "MPSC Sadhak's subject-wise analysis helped me identify my weak areas quickly. The bilingual test interface made a huge difference in my preparation." },
  { name: "Rahul Bhosale",  exam: "PSI 2024",               rank: 12, photo: "RB", content: "The PYQ test series and live mock tests gave me real exam confidence. Analytics showed exactly where I needed to improve." },
  { name: "Anjali Kulkarni",exam: "STI 2023",               rank: 8,  photo: "AK", content: "The bilingual test series — English and Marathi — was exactly what I needed. Clean UI and detailed result analysis after every test." },
];

const features = [
  { icon: "🌐", title: "Bilingual Tests",        desc: "Questions in English & Marathi" },
  { icon: "📊", title: "Smart Analytics",        desc: "Subject-wise performance tracking" },
  { icon: "🔴", title: "Live Tests",             desc: "Real-time scheduled exams" },
  { icon: "🏆", title: "Leaderboard",            desc: "State-level rank comparison" },
  { icon: "🔖", title: "Bookmarks",              desc: "Save important questions" },
  { icon: "💬", title: "Discussion Forum",       desc: "Expert Q&A for every question" },
  { icon: "🎯", title: "PYQ Coverage",           desc: "All previous year questions" },
  { icon: "📱", title: "Study Anywhere",         desc: "Mobile-friendly interface" },
];

const SUBJECT_ICONS: Record<string, string> = {
  MAR: "📖", GS: "🌍", HIS: "🏛️", GEO: "🗺️", POL: "⚖️", ECO: "💰", SCI: "🔬",
};
const SUBJECT_COLORS: Record<string, string> = {
  MAR: "bg-primary-50 border-primary-200",   GS:  "bg-green-50 border-green-200",
  HIS: "bg-yellow-50 border-yellow-200", GEO: "bg-primary-50 border-primary-200",
  POL: "bg-red-50 border-red-200",     ECO: "bg-orange-50 border-orange-200",
  SCI: "bg-teal-50 border-teal-200",
};

type TabType = "group" | "subject" | "pyq" | "live";

export default function HomePage() {
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("group");
  const [matTab, setMatTab] = useState("pdf");

  // Real API: public platform stats
  const { data: publicStatsRaw } = useQuery({
    queryKey: ["public-stats"],
    queryFn:  () => api.get<any>("/stats"),
    staleTime: 300_000,
  });
  const publicStats = (publicStatsRaw as any)?.data ?? publicStatsRaw ?? null;

  // Real API: public site settings (incl. section visibility flags)
  const { data: publicSettingsRaw } = useQuery({
    queryKey: ["public-settings"],
    queryFn:  () => api.get<any>("/settings"),
    staleTime: 300_000,
  });
  const publicSettings = (publicSettingsRaw as any)?.data ?? publicSettingsRaw ?? null;
  const visibility = {
    hero:          publicSettings?.sectionVisibility?.hero          ?? true,
    testSeries:    publicSettings?.sectionVisibility?.testSeries    ?? true,
    studyMaterial: publicSettings?.sectionVisibility?.studyMaterial ?? true,
    features:      publicSettings?.sectionVisibility?.features      ?? true,
    testimonials:  publicSettings?.sectionVisibility?.testimonials  ?? true,
    ctaBanner:     publicSettings?.sectionVisibility?.ctaBanner     ?? true,
  };

  const stats = publicStats ? [
    { value: publicStats.users     > 1000 ? `${Math.round(publicStats.users/1000)}k+`     : `${publicStats.users}+`,     label: "Students" },
    { value: publicStats.series    > 0    ? `${publicStats.series}+`                       : "2,500+",                    label: "Test Series" },
    { value: publicStats.questions > 1000 ? `${Math.round(publicStats.questions/1000)}k+` : `${publicStats.questions}+`, label: "Questions" },
    { value: publicStats.attempts  > 1000 ? `${Math.round(publicStats.attempts/1000)}k+`  : `${publicStats.attempts}+`,  label: "Tests Taken" },
  ] : FALLBACK_STATS;

  // Real API: group-wise series
  const { data: groupSeriesData } = useQuery({
    queryKey: ["home-group-series"],
    queryFn:  () => api.get<any>("/test-series?type=GROUP_WISE&status=published&limit=4"),
    staleTime: 300_000,
  });

  // Real API: subject-wise series
  const { data: subjectSeriesData } = useQuery({
    queryKey: ["home-subject-series"],
    queryFn:  () => api.get<any>("/test-series?type=SUBJECT_WISE&status=published&limit=8"),
    staleTime: 300_000,
    enabled:  activeTab === "subject",
  });

  // Real API: PYQ series
  const { data: pyqSeriesData } = useQuery({
    queryKey: ["home-pyq-series"],
    queryFn:  () => api.get<any>("/test-series?type=PYQ&status=published&limit=8"),
    staleTime: 300_000,
    enabled:  activeTab === "pyq",
  });

  // Real API: free study materials
  const { data: materialsData } = useQuery({
    queryKey: ["home-materials"],
    queryFn:  () => api.get<any>("/study-materials?access=free&limit=6"),
    staleTime: 300_000,
  });

  // Real API: testimonials
  const { data: testimonialsData } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn:  () => api.get<any>("/testimonials?isApproved=true&isFeatured=true&limit=3"),
    staleTime: 600_000,
  });

  // Real API: live tests (scheduled + live status)
  const { data: liveTestsData } = useQuery({
    queryKey: ["home-live-tests"],
    queryFn:  () => api.get<any>("/test-series?type=LIVE&status=published,scheduled,live&limit=6"),
    staleTime: 30_000,
    enabled: activeTab === "live",
  });

  const mutateRegister = useMutation({
    mutationFn: (testId: string) => api.post(`/tests/${testId}/register`),
    onSuccess:  (_, _testId) => {
      toast.success("Registered successfully!");
      qc.invalidateQueries({ queryKey: ["home-live-tests"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Registration failed"),
  });

  const handleRegister = (testId: string) => {
    if (!isAuthenticated) { navigate("/auth/login"); return; }
    mutateRegister.mutate(testId);
  };

  const liveTestsList: any[] = (() => {
    const raw = liveTestsData?.data ?? (Array.isArray(liveTestsData) ? liveTestsData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return testSeries.live;
    return raw.map((s: any) => ({
      id:         s.id,
      title:      s.titleEn ?? "—",
      date:       s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" }) : "TBA",
      seats:      s.maxSeats ?? 0,
      registered: s.registeredCount ?? 0,
      status:     s.maxSeats > 0 && s.registeredCount >= s.maxSeats ? "full"
                : s.status === "live" ? "live"
                : "open",
      liveStatus: s.status,
    }));
  })();

  const liveGroupSeries = ((): typeof testSeries.group => {
    const raw = groupSeriesData?.data ?? (Array.isArray(groupSeriesData) ? groupSeriesData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return testSeries.group;
    return raw.map((s: any) => ({
      key:      s.groupType?.slice(-1).toLowerCase() ?? "a",
      title:    s.titleEn ?? s.title_en ?? "—",
      subtitle: s.descriptionEn ?? "",
      tests:    s.tests?.length ?? 0,
      enrolled: s.enrolledCount ?? 0,
      price:    Number(s.price ?? 0),
      badge:    Number(s.price ?? 0) === 0 ? "Free" : s.isPremium ? "Premium" : "",
    }));
  })();

  const liveMaterials = ((): typeof materials => {
    const raw = materialsData?.data ?? (Array.isArray(materialsData) ? materialsData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return materials;
    return raw.map((m: any) => ({
      title:     m.titleEn ?? m.title_en ?? "—",
      type:      m.type ?? "PDF",
      subject:   m.subject?.nameEn ?? "General",
      pages:     m.pageCount ?? 0,
      downloads: m.downloadCount ?? 0,
      access:    (m.access ?? "free").charAt(0).toUpperCase() + (m.access ?? "free").slice(1),
    }));
  })();

  const liveTestimonials = ((): typeof testimonials => {
    const raw = testimonialsData?.data ?? (Array.isArray(testimonialsData) ? testimonialsData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return testimonials;
    return raw.map((t: any) => ({
      name:    t.name,
      exam:    t.examCleared ?? "MPSC",
      rank:    t.yearCleared ?? 0,
      photo:   t.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "XX",
      content: t.content,
    }));
  })();

  const liveSubjectSeries = ((): typeof testSeries.subject => {
    const raw = subjectSeriesData?.data ?? (Array.isArray(subjectSeriesData) ? subjectSeriesData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return testSeries.subject;
    return raw.map((s: any) => {
      const code = s.subject?.code ?? "";
      return {
        subject:   s.subject?.nameEn ?? s.titleEn ?? "—",
        icon:      s.subject?.icon   ?? SUBJECT_ICONS[code] ?? "📚",
        tests:     s.tests?.length   ?? 0,
        questions: 0,
        color:     SUBJECT_COLORS[code] ?? "bg-gray-50 border-gray-200",
      };
    });
  })();

  const livePyqSeries = ((): typeof testSeries.pyq => {
    const raw = pyqSeriesData?.data ?? (Array.isArray(pyqSeriesData) ? pyqSeriesData : null);
    if (!raw || !Array.isArray(raw) || raw.length === 0) return testSeries.pyq;
    return raw.map((s: any) => {
      const yearMatch = s.titleEn?.match(/\b(20\d{2})\b/);
      return {
        year:     yearMatch ? yearMatch[1] : "—",
        exam:     s.titleEn ?? "PYQ",
        questions: s.tests?.[0]?.totalQuestions ?? 100,
        time:     s.tests?.[0]?.duration ? `${s.tests[0].duration} min` : "60 min",
        attempts: s.enrolledCount ?? 0,
      };
    });
  })();

  return (
    <div>
      {/* ── Hero ── */}
      {visibility.hero && (
      <section className="relative text-white overflow-hidden" style={{ background: "linear-gradient(135deg, #030108 0%, #6d28d9 45%, #7c3aed 80%, #8b5cf6 100%)" }}>
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3" style={{ background: "radial-gradient(circle, rgba(123,47,190,0.35) 0%, transparent 70%)" }}></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/2 -translate-x-1/4" style={{ background: "radial-gradient(circle, rgba(0,186,242,0.15) 0%, transparent 70%)" }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 mb-6 text-sm font-medium border border-white/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              500+ students studying right now
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Ace Your<br />
              <span style={{ color: "#f59e0b" }}>MPSC Exam!</span>
            </h1>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: "#c9b8e8" }}>
              Maharashtra's best online test series platform. Prepare for all MPSC exams with
              bilingual test series in <strong>English & Marathi</strong>, smart analytics, and
              live mock tests.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth/register" className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-all shadow-lg">
                Start for Free →
              </Link>
              <Link to="/dashboard" className="border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all backdrop-blur">
                View Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/15 hover:bg-white/15 transition-all">
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-sm mt-1" style={{ color: "#c9b8e8" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Test Series ── */}
      {visibility.testSeries && (
      <section id="test-series" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Test Series</h2>
          <p className="section-subtitle">Comprehensive test series for all MPSC exams — bilingual (English & Marathi)</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(["group", "subject", "pyq", "live"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary-500 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
              }`}
            >
              {tab === "group"   && "🏛️ Group Wise"}
              {tab === "subject" && "📚 Subject Wise"}
              {tab === "pyq"     && "📋 Previous Year"}
              {tab === "live"    && "🔴 Live Tests"}
            </button>
          ))}
        </div>

        {/* Group Wise */}
        {activeTab === "group" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {liveGroupSeries.map((s) => (
              <Link key={s.key} to={`/test-series/group/${s.key}`} className="card-hover p-5 block hover:no-underline">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 text-lg">🏛️</div>
                  {s.badge && (
                    <span className={`badge ${s.badge === "Free" ? "badge-success" : "badge-warning"}`}>{s.badge}</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{s.subtitle}</p>
                <div className="flex gap-3 text-xs text-gray-500 mb-4">
                  <span>📝 {s.tests} Tests</span>
                  <span>👥 {s.enrolled.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {s.price === 0
                      ? <span className="text-emerald-600 font-bold">Free</span>
                      : <span className="text-gray-900 font-bold">₹{s.price}</span>}
                  </div>
                  <span className="btn-primary text-xs py-1.5 px-3">View Tests →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Subject Wise */}
        {activeTab === "subject" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {liveSubjectSeries.map((s) => (
              <div key={s.subject} className={`card-hover p-4 border text-center ${s.color}`}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm">{s.subject}</h3>
                <div className="mt-2 space-y-0.5">
                  <div className="text-xs text-gray-500">{s.tests} tests</div>
                  {s.questions > 0 && <div className="text-xs text-gray-500">{s.questions.toLocaleString()} Qs</div>}
                </div>
                <Link to="/auth/register" className="mt-3 block text-xs font-semibold text-primary-600 hover:underline">Start →</Link>
              </div>
            ))}
          </div>
        )}

        {/* PYQ */}
        {activeTab === "pyq" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {livePyqSeries.map((p, i) => (
              <div key={i} className="card-hover p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-info">{p.year}</span>
                  <span className="badge badge-purple text-xs">{p.exam}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1"><span>❓</span> {p.questions} Questions</div>
                  <div className="flex items-center gap-1"><span>⏱️</span> {p.time}</div>
                  <div className="col-span-2 flex items-center gap-1"><span>👥</span> {p.attempts.toLocaleString()} attempts</div>
                </div>
                <Link to="/auth/register" className="btn-outline text-xs py-1.5 w-full justify-center">
                  Practice Now
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Live Tests */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {liveTestsList.map((l: any, i: number) => {
              const isFull    = l.status === "full";
              const isLiveNow = l.liveStatus === "live";
              const fillPct   = l.seats > 0 ? Math.min(100, Math.round((l.registered / l.seats) * 100)) : 0;
              return (
                <div key={l.id ?? i} className={`card p-5 border-l-4 ${isLiveNow ? "border-l-red-500" : "border-l-primary-400"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge text-xs ${isFull ? "badge-error" : isLiveNow ? "bg-red-100 text-red-700" : "badge-success"}`}>
                      {isFull ? "Seats Full" : isLiveNow ? "🔴 Live Now" : "Registration Open"}
                    </span>
                    <span className="text-xs text-gray-400">{l.date}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2">{l.title}</h3>
                  {l.seats > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Registered</span>
                        <span>{l.registered}{l.seats > 0 ? `/${l.seats}` : ""}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${isFull ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    disabled={isFull || mutateRegister.isPending}
                    onClick={() => !isFull && handleRegister(l.id)}
                    className={`w-full text-xs py-2 rounded-xl font-semibold transition-all ${
                      isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "btn-primary"
                    }`}
                  >
                    {isFull ? "Seats Full" : isLiveNow ? "Join Now 🔴" : "Register Now 🔴"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bilingual note */}
        <div className="mt-8 flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-2xl">
          <span className="text-2xl flex-shrink-0">🌐</span>
          <div>
            <div className="font-semibold text-primary-900 text-sm">Bilingual Test Interface</div>
            <div className="text-xs text-primary-600 mt-0.5">
              All test series are available in both <strong>English</strong> and <strong>Marathi</strong>.
              Switch language anytime during the exam with a single click.
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Study Material ── */}
      {visibility.studyMaterial && (
      <section id="study-material" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Study Material</h2>
            <p className="section-subtitle">PDFs, Ebooks, and Study Notes — all in one place</p>
          </div>
          <div className="flex gap-2 mb-6 justify-center">
            {["pdf", "ebook", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setMatTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  matTab === t ? "bg-secondary-600 text-white" : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {t === "pdf" ? "📄 PDFs" : t === "ebook" ? "📕 Ebooks" : "📓 Notes"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {liveMaterials.map((m, i) => (
              <div key={i} className="card-hover p-5 flex gap-4">
                <div className="w-12 h-14 bg-red-100 rounded-xl flex items-center justify-center text-red-600 text-2xl flex-shrink-0">
                  {m.type === "PDF" ? "📄" : "📕"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{m.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span>{m.subject}</span>
                    <span>·</span>
                    <span>{m.pages} pages</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${m.access === "Free" ? "badge-success" : m.access === "Basic" ? "badge-info" : "badge-warning"}`}>
                      {m.access}
                    </span>
                    <span className="text-xs text-gray-400">⬇️ {m.downloads.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Features ── */}
      {visibility.features && (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="section-title">Why Choose MPSC Sadhak?</h2>
          <p className="section-subtitle">Everything you need to crack MPSC</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card-hover p-5 text-center">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ── Testimonials ── */}
      {visibility.testimonials && (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Student Success Stories</h2>
            <p className="section-subtitle">Hear from our successful candidates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveTestimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map((s) => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.photo}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.exam} · Rank #{t.rank}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── CTA Banner ── */}
      {visibility.ctaBanner && (
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-10 text-center text-white" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #7c3aed 60%, #8b5cf6 100%)" }}>
          <h2 className="text-3xl font-bold mb-3">Start Your Preparation Today</h2>
          <p className="mb-8 text-lg" style={{ color: "#c9b8e8" }}>
            Join 50,000+ students already preparing on MPSC Sadhak
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth/register" className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition-all">
              Register for Free →
            </Link>
            <Link to="/pricing" className="border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all backdrop-blur">
              View Plans
            </Link>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
