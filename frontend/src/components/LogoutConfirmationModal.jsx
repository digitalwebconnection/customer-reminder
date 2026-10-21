import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, AlertTriangle, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LogoutConfirmationModal() {
  const { user, showLogoutModal, closeLogoutModal, confirmLogout, isLoggingOut } =
    useAuth();

  // Close on Escape key
  useEffect(() => {
    if (!showLogoutModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoggingOut) {
        closeLogoutModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal, isLoggingOut, closeLogoutModal]);

  if (!showLogoutModal) return null;

  const initial = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      {/* Dark Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={() => {
          if (!isLoggingOut) closeLogoutModal();
        }}
      />

      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-zinc-950/95 border border-zinc-800/90 shadow-2xl shadow-black/80 p-5 sm:p-6 text-zinc-100 z-10 animate-in zoom-in-95 duration-200 ring-1 ring-white/10"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLogoutModal}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer disabled:opacity-40"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Titles */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
            <LogOut className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="logout-modal-title"
              className="text-base sm:text-lg font-bold text-white tracking-tight"
            >
              Sign out of RemindIQ?
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Are you sure you want to end your current session? You will need to
              sign back in to manage reminder schedules and receive call alerts.
            </p>
          </div>
        </div>

        {/* Current Active Account Box */}
        {user && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {user.name || "Logged-in User"}
              </p>
              <p className="text-[11px] text-zinc-400 truncate font-mono">
                {user.email}
              </p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border uppercase tracking-wider ${
                user.role === "superadmin"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700/60"
              }`}
            >
              {user.role || "User"}
            </span>
          </div>
        )}

        {/* Actions: Cancel vs Confirm Logout */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={closeLogoutModal}
            disabled={isLoggingOut}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-40"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={confirmLogout}
            disabled={isLoggingOut}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
