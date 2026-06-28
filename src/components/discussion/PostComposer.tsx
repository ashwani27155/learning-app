import { useState } from "react";
import { Send } from "lucide-react";

interface PostComposerProps {
  onSubmit: (content: string) => Promise<void> | void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function PostComposer({ onSubmit, placeholder = "Ask a question or share your thoughts…", submitLabel = "Post", autoFocus }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        autoFocus={autoFocus}
        className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">Be respectful and on-topic — moderators may remove inappropriate posts.</p>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="btn-primary-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          {submitting ? "Posting…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
