import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowBigUp, MessageCircle, CheckCircle2, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { discussionService, type DiscussionPost } from "../../services/discussionService";
import { useAuth } from "../../context/AuthContext";
import { EmptyState } from "../../components/common/EmptyState";
import { PostComposer } from "./PostComposer";
import { ReplyList } from "./ReplyList";
import { timeAgo } from "./timeAgo";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

interface DiscussionThreadProps {
  questionId?: string;
  testId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function PostCard({ post }: { post: DiscussionPost }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [resolving, setResolving] = useState(false);

  const repliesKey = ["discussion-replies", post.id];
  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: repliesKey,
    queryFn: () => discussionService.getReplies(post.id),
    enabled: expanded,
  });

  const invalidatePosts = () => qc.invalidateQueries({ queryKey: ["discussion-posts"] });

  const handleUpvote = async () => {
    if (upvoted) return;
    setUpvoted(true);
    try {
      await discussionService.upvotePost(post.id);
      qc.setQueryData<any>(["discussion-posts"], (old: any) => {
        if (!old) return old;
        return { ...old, posts: old.posts.map((p: DiscussionPost) => p.id === post.id ? { ...p, upvotes: p.upvotes + 1 } : p) };
      });
    } catch {
      setUpvoted(false);
      toast.error("Failed to upvote");
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await discussionService.resolvePost(post.id);
      toast.success("Marked as resolved");
      invalidatePosts();
    } catch {
      toast.error("Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  const handleReply = async (content: string) => {
    try {
      await discussionService.createReply(post.id, content);
      qc.invalidateQueries({ queryKey: repliesKey });
      qc.setQueryData<any>(["discussion-posts"], (old: any) => {
        if (!old) return old;
        return { ...old, posts: old.posts.map((p: DiscussionPost) => p.id === post.id ? { ...p, _count: { replies: p._count.replies + 1 } } : p) };
      });
      toast.success("Reply added");
    } catch {
      toast.error("Failed to post reply");
    }
  };

  const canResolve = !post.isResolved && user && (user.id === post.user.id || ["admin", "superadmin"].includes(user.role));

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initials(post.user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{post.user.name}</span>
            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
            {post.isPinned && (
              <span className="badge badge-purple text-[10px] gap-1"><Pin className="w-2.5 h-2.5" /> Pinned</span>
            )}
            {post.isResolved && (
              <span className="badge badge-success text-[10px] gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Resolved</span>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={handleUpvote}
              disabled={upvoted}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${upvoted ? "text-primary-600" : "text-gray-400 hover:text-primary-600"}`}
            >
              <ArrowBigUp className="w-4 h-4" fill={upvoted ? "currentColor" : "none"} />
              {post.upvotes}
            </button>
            <button
              onClick={() => setExpanded(e => !e)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {post._count.replies} {post._count.replies === 1 ? "reply" : "replies"}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {canResolve && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {resolving ? "Marking…" : "Mark resolved"}
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <ReplyList replies={repliesData?.replies ?? []} isLoading={repliesLoading} />
          <div className="pl-12">
            <PostComposer onSubmit={handleReply} placeholder="Write a reply…" submitLabel="Reply" />
          </div>
        </div>
      )}
    </div>
  );
}

export function DiscussionThread({ questionId, testId, emptyTitle = "No discussions yet", emptyDescription = "Start the conversation — ask a question or share an insight." }: DiscussionThreadProps) {
  const qc = useQueryClient();
  const queryKey = ["discussion-posts", { questionId, testId }];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => discussionService.listPosts({ questionId, testId }),
  });

  const handleCreatePost = async (content: string) => {
    try {
      await discussionService.createPost({ content, questionId, testId });
      toast.success("Posted");
      qc.invalidateQueries({ queryKey: ["discussion-posts"] });
    } catch {
      toast.error("Failed to post — please try again");
    }
  };

  return (
    <div className="space-y-4">
      <PostComposer onSubmit={handleCreatePost} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Couldn't load discussions. Please try again.</p>
          <button onClick={() => refetch()} className="btn-outline">Try again</button>
        </div>
      ) : !data || data.posts.length === 0 ? (
        <EmptyState icon="💬" title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {data.posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
