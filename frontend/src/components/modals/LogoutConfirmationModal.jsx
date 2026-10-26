import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
      {/* Liquid Glass Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={() => {
          if (!isLoggingOut) closeLogoutModal();
        }}
      />

      {/* Liquid Glass Modal Card with ambient 3D Liquid Spheres */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[360px] sm:max-w-[380px] rounded-[30px] liquid-glass-modal p-6 text-slate-800 z-10 animate-in zoom-in-95 duration-200 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.2),0_12px_28px_-6px_rgba(100,116,139,0.15)] border border-white/95"
      >
        {/* Decorative 3D Liquid Glass Spheres floating around the modal */}
        <div 
          className="liquid-glass-sphere absolute -top-5 -right-5 w-12 h-12 pointer-events-none animate-float-gentle opacity-85 z-0"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="liquid-glass-sphere absolute -bottom-4 -left-4 w-9 h-9 pointer-events-none animate-float-reverse opacity-75 z-0"
          style={{ animationDuration: '10s' }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeLogoutModal}
          disabled={isLoggingOut}
          className="relative z-10 absolute top-4.5 right-4.5 liquid-glass-pill text-slate-400 hover:text-slate-800 p-1.5 rounded-xl transition cursor-pointer disabled:opacity-40 active:scale-90"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Titles */}
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="w-13 h-13 rounded-2xl liquid-glass-pill bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-rose-600/5 border border-rose-400/50 flex items-center justify-center text-rose-600 shrink-0 shadow-sm shadow-rose-500/10 animate-float-gentle">
            <LogOut className="w-5.5 h-5.5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3
              id="logout-modal-title"
              className="text-base sm:text-lg font-black text-slate-900 tracking-tight liquid-heading"
            >
              Sign out of RemindIQ?
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[280px] mx-auto">
              Are you sure you want to end your current session? You will need to
              sign back in to manage reminder schedules and receive call alerts.
            </p>
          </div>
        </div>

        {/* Current Active Account Box */}
        {user && (
          <div className="relative z-10 mt-4.5 p-3 rounded-2xl liquid-glass-pill flex items-center gap-3 border border-white/90 shadow-xs">
            <div className="w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-xs font-bold text-slate-800 shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user.name || "Logged-in User"}
              </p>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {user.email}
              </p>
            </div>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase ${
                user.role === "superadmin"
                  ? "bg-amber-500/15 text-amber-800 border border-amber-400/40"
                  : "bg-slate-200/80 text-slate-700 border border-slate-300/60"
              }`}
            >
              {user.role || "User"}
            </span>
          </div>
        )}

        {/* Actions: Cancel vs Confirm Logout */}
        <div className="relative z-10 mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={closeLogoutModal}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-2.5 rounded-xl sm:rounded-2xl liquid-glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/90 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-40 shadow-xs"
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={confirmLogout}
            disabled={isLoggingOut}
            className="flex-1 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 cursor-pointer active:scale-95 disabled:opacity-50 border border-white/20"
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
