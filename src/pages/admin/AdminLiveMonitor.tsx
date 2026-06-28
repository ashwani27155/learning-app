import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Users, CheckCircle2, Clock, BarChart2, Trophy, AlertTriangle, ArrowLeft, Radio, Flag, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { api, getAccessToken } from "../../lib/api";
import { connectToLiveTest, disconnectLiveTest, onLeaderboardUpdate, onActiveCount, LeaderboardEntry } from "../../lib/liveSocket";

interface MonitorData {
  status:         string;
  scheduledAt:    string | null;
  endsAt:         string | null;
  serverTime:     number;
  maxSeats:       number;
  registeredCount: number;
  activeCount:    number;
  submittedCount: number;
  leaderboard:    { rank: number; name: string; email?: string; score: number; timeSpent: number }[];
  questions:      { id: string; order: number; text: string; attemptRate: number }[];
  participants:   { attemptId: string; userId?: string; name: string; email?: string; status: string; tabSwitches: number; flagged: boolean; flagReason?: string | null }[];
}

function ConfirmModal({ message, onConfirm, onClose }: { message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Confirm Action</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex justify-center">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLiveMonitor() {
  const { testId } = useParams<{ testId: string }>();
  const [liveEntries, setLiveEntries] = useState<LeaderboardEntry[]>([]);
  const [liveActive,  setLiveActive]  = useState(0);
  const [showConfirm, setShowConfirm] = useState<null | "end" | "force-submit">(null);
  const [confirmTarget, setConfirmTarget] = useState<{ attemptId: string; name: string } | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["live-monitor", testId],
    queryFn:  () => api.get<MonitorData>(`/admin/tests/${testId}/live/monitor`),
    refetchInterval: 30_000,
    enabled: !!testId,
  });

  const monitor = data;

  const mutateEnd = useMutation({
    mutationFn: () => api.post(`/admin/tests/${testId}/live/end`),
    onSuccess:  () => { toast.success("Test ended"); refetch(); },
    onError:    (e: any) => toast.error(e.message ?? "Failed to end test"),
  });

  const mutateStart = useMutation({
    mutationFn: () => api.post(`/admin/tests/${testId}/live/start`),
    onSuccess:  () => { toast.success("Test started!"); refetch(); },
    onError:    (e: any) => toast.error(e.message ?? "Failed to start test"),
  });

  const mutateFlag = useMutation({
    mutationFn: ({ attemptId, flagged, reason }: { attemptId: string; flagged: boolean; reason?: string }) =>
      api.post(`/admin/tests/${testId}/live/attempts/${attemptId}/flag`, { flagged, reason }),
    onSuccess:  (_d, vars) => { toast.success(vars.flagged ? "Student flagged" : "Flag removed"); refetch(); },
    onError:    (e: any) => toast.error(e.message ?? "Failed to update flag"),
  });

  const mutateForceSubmit = useMutation({
    mutationFn: (attemptId: string) =>
      api.post(`/admin/tests/${testId}/live/attempts/${attemptId}/force-submit`, { reason: "Ended by administrator" }),
    onSuccess:  () => { toast.success("Force-submit signal sent"); refetch(); },
    onError:    (e: any) => toast.error(e.message ?? "Failed to force-submit"),
  });

  // Socket connection for real-time updates
  useEffect(() => {
    if (!testId) return;
    const token = getAccessToken() ?? undefined;
    connectToLiveTest(testId, token);
    const offLb = onLeaderboardUpdate(setLiveEntries);
    const offAc = onActiveCount(setLiveActive);
    return () => {
      offLb(); offAc();
      disconnectLiveTest(testId);
    };
  }, [testId]);

  const leaderboard = liveEntries.length > 0 ? liveEntries : (monitor?.leaderboard ?? []);
  const activeCount = liveActive || monitor?.activeCount || 0;
  const submittedPct = monitor && monitor.registeredCount > 0
    ? Math.round((monitor.submittedCount / monitor.registeredCount) * 100)
    : 0;

  const statusColor: Record<string, string> = {
    live:      "bg-red-100 text-red-700",
    scheduled: "bg-primary-100 text-primary-700",
    ended:     "bg-gray-100 text-gray-600",
    draft:     "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {showConfirm === "end" && (
        <ConfirmModal
          message="End the live test now? All active students will be force-submitted."
          onConfirm={() => mutateEnd.mutate()}
          onClose={() => setShowConfirm(null)}
        />
      )}

      {showConfirm === "force-submit" && confirmTarget && (
        <ConfirmModal
          message={`Force-submit ${confirmTarget.name}'s attempt now? This will immediately end their test and disqualify any further attempts.`}
          onConfirm={() => mutateForceSubmit.mutate(confirmTarget.attemptId)}
          onClose={() => { setShowConfirm(null); setConfirmTarget(null); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/admin/test-series" className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title mb-0">Live Monitor</h1>
              {monitor?.status && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor[monitor.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {monitor.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />}
                  {monitor.status}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {monitor?.endsAt && `Ends ${new Date(monitor.endsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {monitor?.status === "scheduled" && (
            <button onClick={() => mutateStart.mutate()} disabled={mutateStart.isPending}
              className="btn-primary text-sm">
              <Radio className="w-4 h-4" /> Go Live Now
            </button>
          )}
          {monitor?.status === "live" && (
            <button onClick={() => setShowConfirm("end")}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> End Test Now
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Registered",  value: monitor?.registeredCount ?? "—", Icon: Users,        bg: "bg-primary-50",    ic: "text-primary-600"    },
          { label: "Active Now",  value: activeCount,                     Icon: Radio,        bg: "bg-red-50",     ic: "text-red-600"     },
          { label: "Submitted",   value: monitor?.submittedCount ?? "—",  Icon: CheckCircle2, bg: "bg-emerald-50", ic: "text-emerald-600" },
          { label: "Max Seats",   value: monitor?.maxSeats || "∞",        Icon: Clock,        bg: "bg-violet-50",  ic: "text-violet-600"  },
        ].map(({ label, value, Icon, bg, ic }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Submission progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Submission Progress</h2>
          <span className="text-sm font-bold text-primary-600">{submittedPct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${submittedPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {monitor?.submittedCount ?? 0} of {monitor?.registeredCount ?? 0} registered students submitted
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Live Leaderboard */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Live Leaderboard</h2>
            {liveEntries.length > 0 && (
              <span className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Live
              </span>
            )}
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No submissions yet</p>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className="w-6 text-sm font-bold text-gray-500 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
                    {entry.email && <p className="text-xs text-gray-400 truncate">{entry.email}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary-600">{entry.score} pts</p>
                    <p className="text-[10px] text-gray-400">{Math.floor((entry.timeSpent ?? 0) / 60)}m taken</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-question attempt rates */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-primary-500" />
            <h2 className="font-bold text-gray-900">Question Accuracy</h2>
          </div>
          {!monitor?.questions?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {monitor.questions.map((q) => (
                <div key={q.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 truncate flex-1 mr-2">Q{q.order}. {q.text}</span>
                    <span className={`font-bold flex-shrink-0 ${q.attemptRate >= 60 ? "text-emerald-600" : q.attemptRate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                      {q.attemptRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${q.attemptRate >= 60 ? "bg-emerald-500" : q.attemptRate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${q.attemptRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Participants & Integrity */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-gray-900">Participants & Integrity</h2>
        </div>
        {!monitor?.participants?.length ? (
          <p className="text-sm text-gray-400 text-center py-6">No participants yet</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {monitor.participants.map((p) => {
              const tabColor = p.tabSwitches >= 6 ? "text-red-600 bg-red-50" : p.tabSwitches >= 3 ? "text-amber-600 bg-amber-50" : "text-gray-500 bg-gray-100";
              return (
                <div key={p.attemptId} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 flex-wrap">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                      {p.name}
                      {p.flagged && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">🚩 Flagged</span>
                      )}
                    </p>
                    {p.email && <p className="text-xs text-gray-400 truncate">{p.email}</p>}
                    {p.flagged && p.flagReason && <p className="text-xs text-red-500 truncate mt-0.5">Reason: {p.flagReason}</p>}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {p.status.replace(/_/g, " ")}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tabColor}`} title="Tab switches + fullscreen exits combined">
                    {p.tabSwitches} integrity violation{p.tabSwitches === 1 ? "" : "s"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => mutateFlag.mutate({ attemptId: p.attemptId, flagged: !p.flagged, reason: p.flagged ? undefined : "Suspicious activity during live test" })}
                      disabled={mutateFlag.isPending}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${p.flagged ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                    >
                      <Flag className="w-3 h-3" /> {p.flagged ? "Unflag" : "Flag"}
                    </button>
                    {p.status === "in_progress" && (
                      <button
                        onClick={() => { setConfirmTarget({ attemptId: p.attemptId, name: p.name }); setShowConfirm("force-submit"); }}
                        disabled={mutateForceSubmit.isPending}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Force Submit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
