import { ReactNode, useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = "confirm-dialog-title";

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isDanger ? "bg-red-100 text-red-600" : "bg-primary-100 text-primary-700"
          }`}>
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-bold text-gray-900 text-base">{title}</h2>
            <div className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button type="button" ref={cancelRef} onClick={onCancel} disabled={isLoading}
            className="btn-ghost border border-gray-200 flex-1 justify-center disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className={`flex-1 justify-center font-semibold rounded-xl text-sm px-5 py-2.5 inline-flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary-600 text-white hover:bg-primary-700"
            }`}>
            {isLoading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
