import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "../../lib/api";
import { SkeletonListItem } from "../../components/common/Skeleton";
import { DEMO_MODE } from "@/lib/demoMode";


interface AuditLog {
  id:          string;
  entityType:  string;
  entityId:    string;
  action:      string;
  changedAt:   string;
  ipAddress?:  string;
  metadata?:   Record<string, any>;
  diff?:       Record<string, any>;
  changedBy:   { name: string; email: string; role: string };
}

const MOCK_LOGS: AuditLog[] = [
  { id: "1", entityType: "question", entityId: "q-001", action: "approved",   changedAt: new Date(Date.now() - 2 * 60000).toISOString(),       changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
  { id: "2", entityType: "question", entityId: "q-002", action: "created",    changedAt: new Date(Date.now() - 10 * 60000).toISOString(),      changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" }, metadata: { examType: "MPSC", difficulty: "medium" } },
  { id: "3", entityType: "question", entityId: "q-003", action: "rejected",   changedAt: new Date(Date.now() - 30 * 60000).toISOString(),      changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" }, metadata: { reason: "Duplicate of Q#45" } },
  { id: "4", entityType: "test",     entityId: "t-001", action: "published",  changedAt: new Date(Date.now() - 60 * 60000).toISOString(),      changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
  { id: "5", entityType: "question", entityId: "q-004", action: "updated",    changedAt: new Date(Date.now() - 90 * 60000).toISOString(),      changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
  { id: "6", entityType: "question", entityId: "q-005", action: "deleted",    changedAt: new Date(Date.now() - 3 * 3600000).toISOString(),     changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
  { id: "7", entityType: "user",     entityId: "u-001", action: "updated",    changedAt: new Date(Date.now() - 5 * 3600000).toISOString(),     changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
  { id: "8", entityType: "question", entityId: "q-006", action: "approved",   changedAt: new Date(Date.now() - 24 * 3600000).toISOString(),    changedBy: { name: "Super Admin", email: "admin@mpsc.com", role: "admin" } },
];

const ACTION_COLOR: Record<string, string> = {
  created:    "bg-primary-100 text-primary-700",
  updated:    "bg-amber-100 text-amber-700",
  deleted:    "bg-red-100 text-red-700",
  approved:   "bg-emerald-100 text-emerald-700",
  rejected:   "bg-red-100 text-red-700",
  published:  "bg-purple-100 text-purple-700",
  archived:   "bg-slate-100 text-slate-600",
  bulk_approved: "bg-emerald-100 text-emerald-700",
  bulk_deleted:  "bg-red-100 text-red-700",
};

const ENTITY_ICON: Record<string, string> = {
  question: "❓",
  test:     "📝",
  user:     "👤",
  exam:     "🏛️",
  default:  "📋",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min  = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr   = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function AuditLogs() {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction]         = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["audit-logs", { page, entityType, action }],
    queryFn:  async () => {
      // Use raw response to preserve pagination metadata
      const res = await api.get<any>("/admin/audit-logs", {
        params: { page, limit: 25, entityType: entityType || undefined, action: action || undefined },
        raw: true,
      } as any);
      const json = await (res as any).json();
      return json;
    },
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: MOCK_LOGS, pagination: { total: 8, page: 1, limit: 25, totalPages: 1 } } : undefined,
  });

  const logs: AuditLog[]  = DEMO_MODE
    ? ((rawData as any)?.data ?? [])
    : ((rawData as any)?.data ?? []);
  const pagination        = (rawData as any)?.pagination;

  const filtered = logs.filter(l =>
    (!entityType || l.entityType === entityType) &&
    (!action     || l.action === action) &&
    (!search     || l.changedBy?.name?.toLowerCase().includes(search.toLowerCase()) || l.entityId?.includes(search))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Complete history of admin actions on questions, tests, and users</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9 text-sm py-2 w-full"
            placeholder="Search by user or entity ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field text-sm py-2" value={entityType} onChange={e => setEntityType(e.target.value)}>
          <option value="">All Entities</option>
          <option value="question">Questions</option>
          <option value="test">Tests</option>
          <option value="user">Users</option>
          <option value="exam">Exams</option>
        </select>

        <select className="input-field text-sm py-2" value={action} onChange={e => setAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Log table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {pagination ? `${pagination.total.toLocaleString()} entries` : `${filtered.length} entries`}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)
            : filtered.length === 0
              ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium">No audit logs found</p>
                </div>
              )
              : filtered.map(log => (
                <div key={log.id} className="px-4 py-3 hover:bg-gray-50 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Entity icon */}
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                      {ENTITY_ICON[log.entityType] ?? ENTITY_ICON.default}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-700 font-medium capitalize">{log.entityType}</span>
                        <span className="text-xs text-gray-400 font-mono">{log.entityId.slice(0, 8)}…</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>by <strong className="text-gray-700">{log.changedBy.name}</strong></span>
                        <span>·</span>
                        <span>{log.changedBy.email}</span>
                        {log.ipAddress && <><span>·</span><span className="font-mono">{log.ipAddress}</span></>}
                      </div>
                      {/* Metadata preview */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && !expandedId?.includes(log.id) && (
                        <div className="mt-1 text-xs text-gray-400 truncate">
                          {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </div>
                      )}
                    </div>

                    {/* Time + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(log.changedAt)}</span>
                      {(log.diff || log.metadata) && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                        >
                          {expandedId === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded diff / metadata */}
                  {expandedId === log.id && (
                    <div className="mt-2 ml-12 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Metadata</p>
                          <div className="space-y-1">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-600 w-28 flex-shrink-0">{k}</span>
                                <span className="text-gray-800">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {log.diff && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Changes (before → after)</p>
                          <pre className="text-xs text-gray-600 overflow-auto max-h-40 bg-white p-2 rounded-lg border border-gray-200">
                            {JSON.stringify(log.diff, null, 2)}
                          </pre>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(log.changedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost border border-gray-200 text-sm disabled:opacity-40">
              ← Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost border border-gray-200 text-sm disabled:opacity-40">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
