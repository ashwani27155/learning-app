import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Gift, Copy, Check, Users, Award } from "lucide-react";
import { userService } from "../../services/userService";
import { Skeleton } from "../../components/common/Skeleton";
import { api } from "../../lib/api";

const APP_URL = window.location.origin;

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userService.getProfile(),
  });

  const { data: publicSettingsRaw, isLoading: settingsLoading } = useQuery({
    queryKey: ["public-settings"],
    queryFn:  () => api.get<any>("/settings"),
    staleTime: 300_000,
  });
  const publicSettings = (publicSettingsRaw as any)?.data ?? publicSettingsRaw ?? null;
  const referAndShareVisible = publicSettings?.dashboardVisibility?.referAndShare ?? true;

  if (!settingsLoading && !referAndShareVisible) {
    return <Navigate to="/dashboard" replace />;
  }

  const code = profile?.profile?.referralCode;
  const shareLink = code ? `${APP_URL}/auth/register?ref=${code}` : "";
  const shareMessage = `Join me on MPSC Sadhak — the smartest way to prepare for MPSC exams! Use my referral code ${code} when you sign up. ${shareLink}`;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary-600" />
          Refer & Share
        </h1>
        <p className="page-subtitle">Invite fellow aspirants to MPSC Sadhak using your personal referral code.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-44 rounded-2xl" />
      ) : !code ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500">A referral code hasn't been generated for your account yet. Please check back soon, or contact support.</p>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-8 text-center text-white"
            style={{ background: "linear-gradient(135deg,#6d28d9 0%,#7c3aed 60%,#f59e0b 100%)" }}>
            <p className="text-sm opacity-80 mb-2">Your referral code</p>
            <div className="inline-flex items-center gap-3 bg-white/15 rounded-2xl px-6 py-3">
              <span className="text-3xl font-bold tracking-widest">{code}</span>
              <button
                onClick={() => handleCopy(code)}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Copy referral code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs opacity-70 mt-4">Share this code or your link below — friends who sign up help you both grow.</p>
            {!!profile?.referredCount && (
              <p className="text-sm font-semibold mt-3">
                🎉 You've referred {profile.referredCount} {profile.referredCount === 1 ? "person" : "people"} so far
              </p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-3">🔗 Your referral link</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input readOnly value={shareLink} className="input-field text-sm flex-1" onFocus={e => e.target.select()} />
              <button onClick={() => handleCopy(shareLink)} className="btn-outline text-sm flex items-center gap-2 justify-center">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy link
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                💬 Share on WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareMessage)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sky-50 text-sky-700 border-2 border-sky-200 hover:bg-sky-100 transition-colors"
              >
                ✈️ Share on Telegram
              </a>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">💡 How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">1. Share your code</p>
                <p className="text-xs text-gray-500">Send your referral code or link to friends preparing for MPSC exams.</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">2. They sign up</p>
                <p className="text-xs text-gray-500">Your friend enters your code while creating their MPSC Sadhak account.</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-900">3. You both get 7 days free</p>
                <p className="text-xs text-gray-500">When they subscribe to a paid plan, you both get 7 bonus days added to your subscription.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
