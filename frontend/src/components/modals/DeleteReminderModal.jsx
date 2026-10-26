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
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Compact Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl liquid-glass-modal shadow-2xl p-5 text-slate-800 z-10 animate-in zoom-in-95 duration-150"
      >
        {/* Top Header: Icon + Title + Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-300/60 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="delete-reminder-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                Delete Reminder?
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                This action cannot be undone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer disabled:opacity-40"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message with customer name & phone */}
        <div className="mt-4 py-3 px-3.5 rounded-2xl liquid-glass-pill text-xs text-slate-700 leading-relaxed font-medium">
          Delete reminder for{" "}
          <span className="font-bold text-slate-900">
            {reminder.name || "Customer"}
          </span>
          {reminder.phone ? (
            <span className="text-slate-500 font-mono text-[11px]"> ({reminder.phone})</span>
          ) : null}
          ?
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full liquid-glass-pill text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer active:scale-95 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
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
