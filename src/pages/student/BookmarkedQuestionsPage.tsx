import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bookmark, BookOpen } from "lucide-react";
import { userService } from "../../services/userService";
import { SkeletonListItem } from "../../components/common/Skeleton";
import { EmptyState } from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

const DIFF_BADGE: Record<string, string> = {
  easy:   "badge-success",
  medium: "badge-warning",
  hard:   "badge-error",
  expert: "badge-dark",
};

export default function BookmarkedQuestionsPage() {
  const qc = useQueryClient();
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const { data: bookmarks, isLoading, isError, refetch } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => userService.getBookmarks(),
  });

  const confirmRemove = async () => {
    if (!pendingRemoveId) return;
    setRemoving(true);
    try {
      await userService.removeBookmark(pendingRemoveId);
      qc.setQueryData<typeof bookmarks>(["bookmarks"], (prev) =>
        prev?.filter((q) => q.id !== pendingRemoveId)
      );
      toast.success("Bookmark removed");
      setPendingRemoveId(null);
    } catch {
      toast.error("Failed to remove bookmark");
    } finally {
      setRemoving(false);
    }
  };

  const pendingQuestion = bookmarks?.find((q) => q.id === pendingRemoveId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary-600" />
          Bookmarked Questions
        </h1>
        <p className="page-subtitle">Questions you've saved for later review — revisit and master them anytime.</p>
      </div>

      {isLoading ? (
        <div className="card p-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonListItem key={i} />)}
        </div>
      ) : isError ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-500 mb-4">Couldn't load your bookmarks. Please try again.</p>
          <button onClick={() => refetch()} className="btn-outline">Try again</button>
        </div>
      ) : !bookmarks || bookmarks.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No bookmarks yet"
          description="While attempting a test, tap the bookmark icon on any question to save it here for quick revision."
          action={
            <Link to="/dashboard/my-tests" className="btn-primary">
              <BookOpen className="w-4 h-4" />
              Browse my tests
            </Link>
          }
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {bookmarks.map((q) => (
            <div key={q.id} className="card p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-4.5 h-4.5" fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.textEn}</p>
                {q.textMr && <p className="text-xs text-gray-400 font-marathi mt-1 line-clamp-1">{q.textMr}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {q.subject?.nameEn && <span className="badge badge-purple text-xs">{q.subject.nameEn}</span>}
                  {q.difficulty && (
                    <span className={`badge ${DIFF_BADGE[q.difficulty] ?? "badge-info"} text-xs`}>{q.difficulty}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPendingRemoveId(q.id)}
                title="Remove bookmark"
                aria-label="Remove bookmark"
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center flex-shrink-0 transition-all"
              >
                <Bookmark className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingRemoveId}
        title="Remove bookmark?"
        message={
          pendingQuestion
            ? <>This will remove <span className="font-medium text-gray-700">"{pendingQuestion.textEn.slice(0, 80)}{pendingQuestion.textEn.length > 80 ? "…" : ""}"</span> from your bookmarks.</>
            : "This question will be removed from your bookmarks."
        }
        confirmLabel="Remove"
        tone="danger"
        isLoading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoveId(null)}
      />
    </div>
  );
}
