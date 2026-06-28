import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { userService, type UserProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

const TARGET_EXAMS = ["RAJYASEVA", "PSI", "STI", "ASO", "MAINS", "OTHER"];
const LANGUAGES = [{ value: "en", label: "English" }, { value: "mr", label: "मराठी" }];

export default function StudentProfile() {
  const { user, refreshUser } = useAuth();
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [avatarLoading,setAvatarLoading]= useState(false);
  const [activeTab,    setActiveTab]    = useState<"profile" | "password" | "notifications">("profile");
  const [notifPrefs,   setNotifPrefs]   = useState({ testReminders: true, resultAlerts: true, streakNudges: true, weeklyDigest: false });
  const [notifSaving,  setNotifSaving]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [name,        setName]        = useState("");
  const [language,    setLanguage]    = useState("en");
  const [targetExam,  setTargetExam]  = useState("");
  const [district,    setDistrict]    = useState("");
  const [attemptYear, setAttemptYear] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    userService.getProfile()
      .then(p => {
        setProfile(p);
        setName(p.name);
        setLanguage(p.language ?? "en");
        setTargetExam(p.profile?.targetExam ?? "");
        setDistrict(p.profile?.district ?? "");
        setAttemptYear(p.profile?.attemptYear ? String(p.profile.attemptYear) : "");
        setDateOfBirth(p.profile?.dateOfBirth ? p.profile.dateOfBirth.slice(0, 10) : "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("Only JPG, PNG, WEBP allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await api.post("/users/avatar", fd);
      await refreshUser();
      toast.success("Profile photo updated!");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setAvatarLoading(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await userService.updateProfile({
        name: name.trim(), language,
        targetExam: targetExam || undefined,
        district:   district   || undefined,
        attemptYear: attemptYear ? Number(attemptYear) : undefined,
        dateOfBirth: dateOfBirth || undefined,
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setPwSaving(true);
    try {
      await userService.changePassword(currentPw, newPw);
      toast.success("Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeSub = profile?.subscriptions?.[0];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information and preferences</p>
      </div>

      {/* Profile completion indicator */}
      {(() => {
        const fields = [
          profile?.name, profile?.email, profile?.phone,
          profile?.profile?.targetExam, profile?.profile?.district,
          profile?.profile?.attemptYear, profile?.profile?.dateOfBirth,
        ];
        const filled = fields.filter(Boolean).length;
        const pct = Math.round((filled / fields.length) * 100);
        if (pct >= 100) return null;
        return (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e9d5ff" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#7c3aed" strokeWidth="3"
                  strokeDasharray={`${pct * 0.942} 94.2`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-700">{pct}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-800">Profile {pct}% complete</p>
              <p className="text-xs text-primary-600 mt-0.5">Complete your profile for better test recommendations.</p>
            </div>
          </div>
        );
      })()}

      {/* Profile summary card */}
      <div className="card p-6 flex items-center gap-5 mb-6">
        <div className="relative flex-shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute -bottom-1.5 -right-1.5 w-10 h-10 flex items-center justify-center"
            title="Change photo"
            aria-label="Change profile photo"
          >
            <span className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs shadow-sm hover:bg-gray-50 transition-colors">
              {avatarLoading ? "…" : "📷"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-lg">{profile?.name}</h2>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{profile?.phone}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`badge ${activeSub ? "badge-success" : "badge-info"}`}>
            {activeSub ? activeSub.plan.toUpperCase() : "FREE"}
          </div>
          {profile?.streak && (
            <p className="text-xs text-gray-500 mt-1">🔥 {profile.streak.currentStreak} day streak</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["profile", "password", "notifications"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
              activeTab === tab ? "bg-primary-500 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {tab === "profile" ? "👤 Profile Info" : tab === "password" ? "🔒 Change Password" : "🔔 Notifications"}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="card p-6 space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <input className="input-field disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" value={profile?.phone ?? ""} disabled readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email ID</label>
              <input className="input-field disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" value={profile?.email ?? ""} disabled readOnly />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Your registered email and mobile number can't be changed here — contact support if you need to update them.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred Language</label>
            <div className="flex gap-3">
              {LANGUAGES.map(l => (
                <button key={l.value} type="button"
                  onClick={() => setLanguage(l.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    language === l.value ? "bg-primary-500 text-white border-primary-500" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Exam</label>
            <select className="input-field" value={targetExam} onChange={e => setTargetExam(e.target.value)}>
              <option value="">Select exam</option>
              {TARGET_EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">District</label>
              <input className="input-field" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Pune" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Attempt Year</label>
              <input type="number" className="input-field" value={attemptYear} onChange={e => setAttemptYear(e.target.value)} placeholder="e.g. 2026" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
            <input type="date" className="input-field" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={handleChangePassword} className="card p-6 space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input type="password" className="input-field" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input type="password" className="input-field" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input type="password" className="input-field" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary disabled:opacity-60">
            {pwSaving ? "Updating…" : "Change Password"}
          </button>
        </form>
      )}

      {/* ── Notifications Tab ── */}
      {activeTab === "notifications" && (
        <div className="card p-6 space-y-5 max-w-lg">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Notification Preferences</h3>
            <p className="text-xs text-gray-400">Control which notifications you receive</p>
          </div>
          {([
            { key: "testReminders",  label: "Test Reminders",       desc: "Upcoming test and live session alerts" },
            { key: "resultAlerts",   label: "Result Alerts",         desc: "When your test results are published" },
            { key: "streakNudges",   label: "Streak Nudges",         desc: "Daily reminders to maintain your study streak" },
            { key: "weeklyDigest",   label: "Weekly Digest",         desc: "Weekly summary of your performance" },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [key]: !p[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[key] ? "bg-violet-600" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
          <button
            onClick={async () => {
              setNotifSaving(true);
              try {
                await api.put("/users/profile", { notifPrefs });
                toast.success("Notification preferences saved");
              } catch (e: any) { toast.error(e.message ?? "Save failed"); }
              finally { setNotifSaving(false); }
            }}
            disabled={notifSaving}
            className="btn-primary text-sm disabled:opacity-60"
          >
            {notifSaving ? "Saving…" : "Save Preferences ✓"}
          </button>
        </div>
      )}
    </div>
  );
}
