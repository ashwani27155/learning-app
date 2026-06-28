import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { userService, type Notification } from "../../services/userService";

const TYPE_ICON: Record<string, string> = {
  test:         "📝",
  result:       "📊",
  subscription: "💳",
  streak:       "🔥",
  system:       "🔔",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return "just now";
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [markingAll,    setMarkingAll]     = useState(false);

  const load = () => {
    setLoading(true);
    userService.getNotifications()
      .then(r => { setNotifications(r.notifications); setUnreadCount(r.unreadCount); })
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* non-critical */ }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await userService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">Stay up to date with your tests and results</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAll} disabled={markingAll}
            className="btn-ghost border border-gray-200 text-sm disabled:opacity-60">
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-lg font-medium text-gray-500">No notifications yet</p>
          <p className="text-sm mt-1">We'll notify you about test results, reminders, and more.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${!n.isRead ? "border-l-4 border-l-primary-500 bg-primary-50/30" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
                  {TYPE_ICON[n.type ?? "system"] ?? "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  {n.link && (
                    <Link to={n.link} className="text-xs text-primary-600 font-medium mt-1 inline-block hover:underline">
                      View →
                    </Link>
                  )}
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
