import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2, Bell, Users, CreditCard, User, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { api } from "../../lib/api";
import { SkeletonKPICard } from "../../components/common/Skeleton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

interface NotificationItem {
  id:        string;
  title:     string;
  message:   string;
  type:      string;
  link?:     string | null;
  isRead:    boolean;
  createdAt: string;
  user?:     { id: string; name: string; email: string } | null;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", title: "New Test Series Live!",  message: "MPSC Rajyaseva 2026 Prelims series is now available.", type: "broadcast", isRead: true,  createdAt: "2026-06-01", user: { id: "u1", name: "Aarav Kulkarni", email: "aarav@example.com" } },
  { id: "2", title: "Subscription expiring",  message: "Your Pro plan expires in 3 days — renew to keep access.", type: "billing",  isRead: false, createdAt: "2026-06-05", user: { id: "u2", name: "Meera Joshi", email: "meera@example.com" } },
  { id: "3", title: "Maintenance Notice",     message: "Scheduled maintenance on Sunday 2 AM – 4 AM IST.", type: "broadcast", isRead: false, createdAt: "2026-06-06", user: { id: "u3", name: "Om Pawar", email: "om@example.com" } },
];

interface SendForm {
  title: string; message: string; type: string; link: string;
  audience: "all" | "plan" | "user"; plan: string; userId: string;
}

const PLAN_OPTIONS = ["free", "basic", "pro", "premium"];

function SendNotificationModal({ onClose, onSent, onDemoSend }: {
  onClose: () => void; onSent: () => void;
  onDemoSend?: (data: Partial<NotificationItem>) => void;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<SendForm>({
    defaultValues: { audience: "all", type: "broadcast" },
  });
  const audience = watch("audience");

  const onSubmit = async (data: SendForm) => {
    try {
      const payload: any = {
        title:   data.title.trim(),
        message: data.message.trim(),
        type:    data.type.trim() || "broadcast",
        link:    data.link.trim() || undefined,
        audience: data.audience,
      };
      if (data.audience === "plan") payload.plan = data.plan;
      if (data.audience === "user") payload.userId = data.userId.trim();

      if (DEMO_MODE) {
        onDemoSend?.(payload);
        toast.success("Notification broadcast (demo)");
        onSent();
        return;
      }
      const res: any = await api.post("/admin/notifications/send", payload);
      toast.success(res?.message ?? "Notification sent");
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      onSent();
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Broadcast Notification</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input className="input-field" placeholder="e.g. New Test Series Live!" {...register("title", { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea className="input-field w-full h-24 resize-none" placeholder="Notification body" {...register("message", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <input className="input-field" placeholder="broadcast" {...register("type")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
              <input className="input-field" placeholder="/test-series/123" {...register("link")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience *</label>
            <select className="input-field" {...register("audience", { required: true })}>
              <option value="all">All students</option>
              <option value="plan">Users on a specific plan</option>
              <option value="user">A single user (by ID)</option>
            </select>
          </div>
          {audience === "plan" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
              <select className="input-field" {...register("plan", { required: audience === "plan" })}>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
          {audience === "user" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID *</label>
              <input className="input-field" placeholder="Paste the user's ID" {...register("userId", { required: audience === "user" })} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost border border-gray-200 flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
              <Send className="w-4 h-4" /> {isSubmitting ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManageNotifications() {
  const qc = useQueryClient();
  const [showSend, setShowSend] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);
  const [demoNotifications, setDemoNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn:  () => api.get<any>("/admin/notifications"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: { items: MOCK_NOTIFICATIONS, total: MOCK_NOTIFICATIONS.length } } : undefined,
  });
  const notifications: NotificationItem[] = DEMO_MODE
    ? demoNotifications
    : ((data as any)?.data?.items ?? []);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-notifications"] });

  const filtered = notifications.filter(n => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [n.title, n.message, n.user?.name, n.user?.email].filter(Boolean).some(v => v!.toLowerCase().includes(q));
  });

  const confirmDeleteNotification = () => {
    const n = deleteTarget;
    if (!n) return;
    if (DEMO_MODE) {
      setDemoNotifications(prev => prev.filter(x => x.id !== n.id));
      toast.success("Notification deleted");
      setDeleteTarget(null);
      return;
    }
    api.delete(`/admin/notifications/${n.id}`)
      .then(() => { toast.success("Notification deleted"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"))
      .finally(() => setDeleteTarget(null));
  };

  const handleDemoSend = (data: Partial<NotificationItem>) => {
    setDemoNotifications(prev => [{
      id: String(Date.now()), isRead: false, createdAt: new Date().toISOString(),
      user: { id: "demo", name: "Demo Audience", email: "—" },
      ...data,
    } as NotificationItem, ...prev]);
  };

  const typeIcon = (type: string) => {
    if (type === "billing") return <CreditCard className="w-4 h-4" />;
    if (type === "broadcast") return <Users className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Broadcast announcements and review the notification queue</p>
        </div>
        <button onClick={() => setShowSend(true)} className="btn-primary">
          <Send className="w-4 h-4" /> Broadcast
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonKPICard key={i} />)
          : [
              { label: "Total Sent",   value: notifications.length, Icon: Bell },
              { label: "Unread",       value: notifications.filter(n => !n.isRead).length, Icon: User },
              { label: "Broadcasts",   value: notifications.filter(n => n.type === "broadcast").length, Icon: Users },
            ].map(s => (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
                  <s.Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input-field pl-9" placeholder="Search by title, message or recipient..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔔"
            title={notifications.length === 0 ? "No notifications yet" : "No notifications match your search"}
            description={notifications.length === 0 ? "Broadcast an announcement to get started" : "Try a different search term"}
          />
        ) : filtered.map(n => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              {typeIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{n.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">{n.type}</span>
                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
              <div className="text-xs text-gray-400 mt-1">
                {n.user ? `To: ${n.user.name} (${n.user.email})` : ""} · {new Date(n.createdAt).toLocaleString("en-IN")}
              </div>
            </div>
            <button onClick={() => setDeleteTarget(n)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showSend && (
        <SendNotificationModal
          onClose={() => setShowSend(false)}
          onSent={() => setShowSend(false)}
          onDemoSend={handleDemoSend}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete notification?"
        message={<>This will permanently remove "<strong>{deleteTarget?.title}</strong>" from the queue. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeleteNotification}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
