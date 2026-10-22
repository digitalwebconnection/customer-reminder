import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, Loader2 } from "lucide-react";

/**
 * DeleteReminderModal
 * Compact, lightweight confirmation modal for deleting a reminder lead.
 */
export default function DeleteReminderModal({
  isOpen,
  onClose,
  onConfirm,
  reminder,
  isDeleting = false,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !reminder) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-reminder-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
    >
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Compact Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-90 rounded-xl bg-zinc-950/95 border border-zinc-800/90 shadow-2xl shadow-black/90 p-4 sm:p-5 text-zinc-100 z-10 animate-in zoom-in-95 duration-150 ring-1 ring-white/10"
      >
        {/* Top Header: Icon + Title + Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-md shadow-rose-950/40">
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="delete-reminder-title"
                className="text-sm font-bold text-white tracking-tight"
              >
                Delete Reminder?
              </h3>
              <p className="text-[11px] text-zinc-500">
                This action cannot be undone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer disabled:opacity-40 -mr-1 -mt-1"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message with customer name & phone */}
        <div className="mt-3.5 py-2.5 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 text-xs text-zinc-300 leading-relaxed">
          Delete reminder for{" "}
          <span className="font-semibold text-white">
            {reminder.name || "Customer"}
          </span>
          {reminder.phone ? (
            <span className="text-zinc-400 font-mono text-[11px]"> ({reminder.phone})</span>
          ) : null}
          ?
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
