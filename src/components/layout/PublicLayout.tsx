import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Test Series",    href: "/test-series" },
  { label: "Study Material", href: "/#study-material" },
  { label: "Current Affairs", href: "/current-affairs" },
  { label: "Leaderboard",    href: "/leaderboard" },
  { label: "Pricing",        href: "/pricing" },
];

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const activeSub = user?.subscriptions?.find(
    (s: any) => s.isActive && new Date(s.endDate) > new Date()
  );

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const profileLinks = [
    { icon: "🏠", label: "My Dashboard",  to: "/dashboard" },
    { icon: "👤", label: "My Profile",     to: "/dashboard/profile" },
    { icon: "📝", label: "My Tests",       to: "/dashboard/my-tests" },
    { icon: "📊", label: "My Results",     to: "/dashboard/my-results" },
    { icon: "💎", label: "Subscription",   to: "/dashboard/subscription" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-primary-100 shadow-purple-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-phonepe-card flex items-center justify-center text-white font-bold text-lg shadow-purple-sm">
                M
              </div>
              <div>
                <div className="font-bold text-gray-900 text-[15px] leading-tight">MPSC Sadhak</div>
                <div className="text-[10px] text-primary-500 font-medium tracking-wide">YOUR EXAM PARTNER</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-all">
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                /* ── Logged-in: avatar + dropdown ── */
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 focus:outline-none"
                    aria-label="Open profile menu"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-200 hover:ring-primary-400 transition-all">
                      {initials}
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">

                      {/* User header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Active subscription badge */}
                      {activeSub && (
                        <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                          <span className="text-xs">💎</span>
                          <span className="text-xs font-semibold text-amber-700 capitalize">{activeSub.plan} Plan</span>
                          <span className="text-xs text-amber-500 ml-auto">
                            till {new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      )}

                      {/* Nav links */}
                      <div className="py-2">
                        {profileLinks.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-base w-5 text-center">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="text-base w-5 text-center">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Logged-out: Login + Start Free ── */
                <>
                  <Link to="/auth/login" className="hidden sm:inline-flex btn-ghost text-sm py-2 px-4">
                    Login
                  </Link>
                  <Link to="/auth/register" className="btn-primary text-sm py-2">
                    Start Free
                  </Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-primary-50" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen
                  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-primary-100 py-3 space-y-1 animate-fade-in">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href}
                  className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700"
                  onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}

              {user ? (
                /* Mobile: logged-in links */
                <>
                  <div className="px-3 py-2 flex items-center gap-3 border-t border-primary-100 mt-2 pt-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      {activeSub && <p className="text-xs text-amber-600 font-medium">💎 {activeSub.plan} Plan</p>}
                    </div>
                  </div>
                  {profileLinks.map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-primary-50"
                    >
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
                  >
                    <span>🚪</span> Logout
                  </button>
                </>
              ) : (
                /* Mobile: logged-out buttons */
                <div className="pt-2 flex gap-2">
                  <Link to="/auth/login"    className="flex-1 text-center btn-outline text-sm py-2" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/auth/register" className="flex-1 text-center btn-primary text-sm py-2" onClick={() => setMobileOpen(false)}>Register</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* ── Footer ── */}
      <footer className="bg-dark-900 text-primary-300 pt-12 pb-6 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-phonepe-card flex items-center justify-center text-white font-bold shadow-purple-sm">M</div>
                <div>
                  <div className="font-bold text-white text-sm">MPSC Sadhak</div>
                  <div className="text-[10px] text-primary-400 tracking-widest font-medium">YOUR EXAM PARTNER</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-primary-400">
                Maharashtra's best online MPSC exam preparation platform with bilingual test series.
              </p>
              <div className="flex gap-3 mt-4">
                {["📱","💬","▶️","📸"].map((icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary-600 flex items-center justify-center text-sm transition-all">{icon}</a>
                ))}
              </div>
            </div>
            {[
              {
                title: "Platform",
                links: [
                  { label: "Test Series",    href: "/test-series" },
                  { label: "Study Material", href: "/study-material" },
                  { label: "Pricing",        href: "/pricing" },
                  { label: "Daily Quiz",     href: "/auth/register" },
                ],
              },
              {
                title: "Exams",
                links: [
                  { label: "Rajyaseva",  href: "/test-series/group/a" },
                  { label: "PSI",        href: "/test-series/group/b" },
                  { label: "STI",        href: "/test-series/group/b" },
                  { label: "ASO",        href: "/test-series/group/b" },
                  { label: "Group C",    href: "/test-series/group/c" },
                  { label: "Group D",    href: "/test-series/group/d" },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "About Us",       href: "/about" },
                  { label: "Contact",        href: "/contact" },
                  { label: "FAQ",            href: "/faq" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms",          href: "/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-primary-400 hover:text-white transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-primary-400">© 2026 MPSC Sadhak. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-primary-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
