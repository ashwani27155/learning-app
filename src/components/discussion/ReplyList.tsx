import type { DiscussionReply } from "../../services/discussionService";
import { timeAgo } from "./timeAgo";

function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}

interface ReplyListProps {
  replies: DiscussionReply[];
  isLoading?: boolean;
}

export function ReplyList({ replies, isLoading }: ReplyListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 pl-12">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (replies.length === 0) {
    return <p className="text-xs text-gray-400 pl-12">No replies yet — be the first to respond.</p>;
  }

  return (
    <div className="space-y-3 pl-12">
      {replies.map((r) => (
        <div key={r.id} className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {initials(r.user.name)}
          </div>
          <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">{r.user.name}</span>
              <span className="text-[11px] text-gray-400">{timeAgo(r.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed whitespace-pre-wrap">{r.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
