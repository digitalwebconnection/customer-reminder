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
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 select-none"
    >
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Centered Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl liquid-glass-modal shadow-2xl p-6 text-slate-800 z-10 text-center space-y-4"
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centered Crimson Icon Badge */}
        <div className="w-13 h-13 rounded-2xl bg-rose-500/10 border border-rose-300/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Trash2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Centered Title & Subtitle */}
        <div className="space-y-1 text-center">
          <h3
            id="delete-reminder-title"
            className="text-base font-bold text-slate-900 tracking-tight"
          >
            Delete Reminder?
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            This action cannot be undone.
          </p>
        </div>

        {/* Message with customer name & phone */}
        <div className="p-3 rounded-2xl liquid-glass-pill text-xs text-slate-700 leading-relaxed font-medium text-center">
          Delete reminder for{" "}
          <span className="font-bold text-slate-900">
            {reminder.name || "Customer"}
          </span>
          {reminder.phone ? (
            <span className="text-slate-500 font-mono text-[11px]"> ({reminder.phone})</span>
          ) : null}
          ?
        </div>

        {/* Action Buttons: Balanced 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer active:scale-95 disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full py-2.5 rounded-full bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
