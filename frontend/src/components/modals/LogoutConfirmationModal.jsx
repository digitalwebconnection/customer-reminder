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

      {/* Liquid Glass Modal Card with ambient 3D Liquid Spheres - Compact & Streamlined */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-75 sm:max-w-[320px] rounded-3xl liquid-glass-modal p-4 sm:p-5 text-slate-800 z-10 animate-in zoom-in-95 duration-200 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.2),0_10px_25px_-5px_rgba(100,116,139,0.15)] border border-white/95"
      >
        {/* Decorative 3D Liquid Glass Spheres */}
        <div 
          className="liquid-glass-sphere absolute -top-3.5 -right-3.5 w-8 h-8 pointer-events-none animate-float-gentle opacity-80 z-0"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="liquid-glass-sphere absolute -bottom-3 -left-3 w-6 h-6 pointer-events-none animate-float-reverse opacity-70 z-0"
          style={{ animationDuration: '10s' }}
        />

        {/* Close Button strictly on Top Right */}
        <button
          type="button"
          onClick={closeLogoutModal}
          disabled={isLoggingOut}
          className="absolute top-3 right-3 z-20 liquid-glass-pill text-slate-400 hover:text-slate-800 p-1.5 rounded-xl transition cursor-pointer disabled:opacity-40 active:scale-90 shadow-xs"
          title="Cancel"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Icon + Concise Title */}
        <div className="relative z-10 flex flex-col items-center text-center gap-2 pt-1">
          <div className="w-10 h-10 rounded-xl liquid-glass-pill bg-linear-to-br from-rose-500/15 via-rose-500/10 to-rose-600/5 border border-rose-400/50 flex items-center justify-center text-rose-600 shrink-0 shadow-xs animate-float-gentle">
            <LogOut className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3
              id="logout-modal-title"
              className="text-sm sm:text-base font-black text-slate-900 tracking-tight liquid-heading"
            >
              Sign out of RemindIQ?
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              End your current session?
            </p>
          </div>
        </div>

        {/* Current Active Account Box (Compact) */}
        {user && (
          <div className="relative z-10 mt-3 p-2 rounded-xl liquid-glass-pill flex items-center gap-2.5 border border-white/90 shadow-xs">
            <div className="w-7 h-7 rounded-lg liquid-glass flex items-center justify-center text-[11px] font-bold text-slate-800 shrink-0 shadow-xs">
              {initial}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                {user.name || "Logged-in User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate font-mono leading-tight">
                {user.email}
              </p>
            </div>
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded-full font-extrabold tracking-wider uppercase ${
                user.role === "superadmin"
                  ? "bg-amber-500/15 text-amber-800 border border-amber-400/40"
                  : "bg-slate-200/80 text-slate-700 border border-slate-300/60"
              }`}
            >
              {user.role || "User"}
            </span>
          </div>
        )}

        {/* Actions: Cancel vs Confirm Logout (Compact) */}
        <div className="relative z-10 mt-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeLogoutModal}
            disabled={isLoggingOut}
            className="flex-1 px-3 py-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 hover:bg-white/90 text-[11px] font-bold transition cursor-pointer active:scale-95 disabled:opacity-40 shadow-xs"
          >
            Stay In
          </button>

          <button
            type="button"
            onClick={confirmLogout}
            disabled={isLoggingOut}
            className="flex-1 px-3 py-2 rounded-xl bg-linear-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 cursor-pointer active:scale-95 disabled:opacity-50 border border-white/20"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
