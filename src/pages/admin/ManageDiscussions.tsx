import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pin, CheckCircle2, Trash2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { SkeletonKPICard } from "../../components/common/Skeleton";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { EmptyState } from "../../components/common/EmptyState";
import { DEMO_MODE } from "@/lib/demoMode";

interface DiscussionPost {
  id:         string;
  content:    string;
  isPinned:   boolean;
  isResolved: boolean;
  createdAt:  string;
  user?:      { id: string; name: string; email: string } | null;
  _count?:    { replies: number };
}

const MOCK_DISCUSSIONS: DiscussionPost[] = [
  { id: "1", content: "Can someone explain the post-2019 status of Article 370 in simple terms? Doubt in Indian Polity.", isPinned: true,  isResolved: true,  createdAt: "2026-05-12", user: { id: "u1", name: "Aarav Kulkarni", email: "aarav@example.com" }, _count: { replies: 8 } },
  { id: "2", content: "Which books/sources do you recommend for CSAT prep alongside GS?", isPinned: false, isResolved: false, createdAt: "2026-06-01", user: { id: "u2", name: "Meera Joshi",   email: "meera@example.com" }, _count: { replies: 3 } },
  { id: "3", content: "Spam: visit my-shady-link.example for free pdf notes!!!", isPinned: false, isResolved: false, createdAt: "2026-06-05", user: { id: "u3", name: "spammer99",     email: "spam@example.com" }, _count: { replies: 0 } },
];

export default function ManageDiscussions() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pinned" | "unresolved">("all");
  const [deleteTarget, setDeleteTarget] = useState<DiscussionPost | null>(null);
  const [demoPosts, setDemoPosts] = useState<DiscussionPost[]>(MOCK_DISCUSSIONS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-discussions"],
    queryFn:  () => api.get<any>("/admin/discussions"),
    enabled:  !DEMO_MODE,
    initialData: DEMO_MODE ? { data: { items: MOCK_DISCUSSIONS, total: MOCK_DISCUSSIONS.length } } : undefined,
  });
  const posts: DiscussionPost[] = DEMO_MODE ? demoPosts : ((data as any)?.data?.items ?? []);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-discussions"] });

  const filtered = posts.filter(p => {
    if (filter === "pinned")     return p.isPinned;
    if (filter === "unresolved") return !p.isResolved;
    return true;
  });

  const togglePin = (p: DiscussionPost) => {
    if (DEMO_MODE) {
      setDemoPosts(prev => prev.map(x => x.id === p.id ? { ...x, isPinned: !x.isPinned } : x));
      toast.success(p.isPinned ? "Post unpinned" : "Post pinned");
      return;
    }
    api.patch(`/admin/discussions/${p.id}/pin`)
      .then(() => { toast.success(p.isPinned ? "Post unpinned" : "Post pinned"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"));
  };

  const toggleResolve = (p: DiscussionPost) => {
    if (DEMO_MODE) {
      setDemoPosts(prev => prev.map(x => x.id === p.id ? { ...x, isResolved: !x.isResolved } : x));
      toast.success(p.isResolved ? "Marked unresolved" : "Marked resolved");
      return;
    }
    api.patch(`/admin/discussions/${p.id}/resolve`)
      .then(() => { toast.success(p.isResolved ? "Marked unresolved" : "Marked resolved"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"));
  };

  const confirmDeletePost = () => {
    const p = deleteTarget;
    if (!p) return;
    if (DEMO_MODE) {
      setDemoPosts(prev => prev.filter(x => x.id !== p.id));
      toast.success("Post deleted");
      setDeleteTarget(null);
      return;
    }
    api.delete(`/admin/discussions/${p.id}`)
      .then(() => { toast.success("Post deleted"); refresh(); })
      .catch((e: any) => toast.error(e.message ?? "Failed"))
      .finally(() => setDeleteTarget(null));
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "all",        label: "All" },
    { key: "pinned",     label: "Pinned" },
    { key: "unresolved", label: "Unresolved" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Discussions</h1>
        <p className="page-subtitle">Pin, resolve, or remove community discussion posts</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : [
              { label: "Total Posts", value: posts.length },
              { label: "Pinned",      value: posts.filter(p => p.isPinned).length },
              { label: "Resolved",    value: posts.filter(p => p.isResolved).length },
              { label: "Unresolved",  value: posts.filter(p => !p.isResolved).length },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)
          : filtered.map(p => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.isPinned && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.isResolved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isResolved ? "Resolved" : "Open"}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm mt-1.5 line-clamp-2">{p.content}</p>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                      <span>{p.user?.name ?? "Unknown user"}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {p._count?.replies ?? 0} replies</span>
                      <span>{new Date(p.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePin(p)}
                      title={p.isPinned ? "Unpin" : "Pin"}
                      className={`p-2 rounded-lg transition-all ${p.isPinned ? "text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"}`}>
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleResolve(p)}
                      title={p.isResolved ? "Mark unresolved" : "Mark resolved"}
                      className={`p-2 rounded-lg transition-all ${p.isResolved ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} title="Delete post"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        {!isLoading && filtered.length === 0 && (
          <div className="card">
            <EmptyState icon="💬" title="No discussions found" description="Try a different filter" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete post?"
        message={<>This will permanently remove this post by <strong>{deleteTarget?.user?.name ?? "this user"}</strong> and all its replies. This cannot be undone.</>}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDeletePost}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
