import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { usePwa } from "../../context/PwaContext";

export default function InstallPwaBanner() {
  const { isInstalled, promptInstall } = usePwa();
  const [dismissed, setDismissed] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if dismissed within the last 2 days
    const lastDismissed = localStorage.getItem("remindiq_pwa_banner_dismissed");
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed, 10);
      if (elapsed < 2 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Only show if not already installed as standalone
    if (!isInstalled) {
      // Delay display slightly so initial page load is clean
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setDismissed(true);
      setIsClosing(false);
      localStorage.setItem("remindiq_pwa_banner_dismissed", Date.now().toString());
    }, 250);
  };

  const handleInstallClick = async () => {
    await promptInstall();
  };

  if (dismissed || isInstalled) return null;

  return (
    <div
      style={{ bottom: typeof window !== 'undefined' && window.innerWidth < 640 ? "max(4.75rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))" : undefined }}
      className={`fixed sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-45 select-none transition-all duration-300 ease-out ${
        isClosing
          ? "opacity-0 translate-y-6 pointer-events-none"
          : "animate-in slide-in-from-bottom-5 duration-300 opacity-100 translate-y-0"
      }`}
    >
      <div className="group p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 hover:bg-slate-900/98 border border-indigo-500/30 hover:border-indigo-500/50 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 text-slate-100 ring-1 ring-indigo-500/20 hover:shadow-indigo-500/10 transition-all duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/40 border border-white/20 animate-float-slow">
            <Smartphone className="w-5 h-5" />
            <div className="absolute -inset-0.5 rounded-xl bg-indigo-500/20 blur-xs pointer-events-none -z-10 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                Download RemindIQ App
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 animate-pulse">
                FREE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Install on your phone for call alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="btn-shimmer px-3.5 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 hover:brightness-110 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 duration-150"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 hover:rotate-90 active:scale-90 transition-all duration-300 cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
