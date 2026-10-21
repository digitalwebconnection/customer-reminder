import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Download,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { usePwa } from "../../context/PwaContext";

export default function InstallPwaModal() {
  const { showIosModal, setShowIosModal, isIos, promptInstall, isInstallable } = usePwa();
  const [activeTab, setActiveTab] = useState(isIos ? "ios" : "android");
  const [isClosing, setIsClosing] = useState(false);

  // Sync active platform tab when modal opens
  useEffect(() => {
    if (showIosModal) {
      setActiveTab(isIos ? "ios" : "android");
      setIsClosing(false);
    }
  }, [showIosModal, isIos]);

  // Smooth close handler with exit animation
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setShowIosModal(false);
      setIsClosing(false);
    }, 220);
  };

  // Close on Escape key
  useEffect(() => {
    if (!showIosModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIosModal]);

  if (!showIosModal) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Download Mobile App"
      className={`fixed inset-0 z-10001 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-200 select-none ${
        isClosing ? "opacity-0 pointer-events-none" : "animate-backdrop-fade"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-sm sm:max-w-md bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-7 backdrop-blur-2xl text-slate-100 ring-1 ring-black/70 space-y-5 overflow-hidden transition-all duration-200 ${
          isClosing ? "scale-95 opacity-0" : "animate-modal-pop"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow orb */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/35 border border-white/20 animate-float-slow shrink-0">
              <Smartphone className="w-6 h-6" />
              <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-sm pointer-events-none -z-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Download Mobile App
                </h3>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Install RemindIQ on your mobile home screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 active:scale-95 transition-all duration-300 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits list with smooth micro-hover */}
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-3 rounded-2xl border border-white/6">
          <div className="group flex items-center gap-1.5 text-slate-300 p-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-200 transition-all duration-200 cursor-default">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform duration-200 shrink-0" />
            <span>Full-screen view</span>
          </div>
          <div className="group flex items-center gap-1.5 text-slate-300 p-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-200 transition-all duration-200 cursor-default">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform duration-200 shrink-0" />
            <span>Instant call alerts</span>
          </div>
          <div className="group flex items-center gap-1.5 text-slate-300 p-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-200 transition-all duration-200 cursor-default">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform duration-200 shrink-0" />
            <span>Offline access</span>
          </div>
          <div className="group flex items-center gap-1.5 text-slate-300 p-1 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-200 transition-all duration-200 cursor-default">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-transform duration-200 shrink-0" />
            <span>1-Tap quick launch</span>
          </div>
        </div>

        {/* Platform switcher tabs with smooth sliding transition */}
        <div className="relative p-1 bg-slate-950/70 rounded-xl border border-white/8 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("ios")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              activeTab === "ios"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <span>🍎 Apple iOS (Safari)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("android")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              activeTab === "android"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <span>🤖 Android / Chrome</span>
          </button>
        </div>

        {/* Instructions: Smooth Step Cards */}
        {activeTab === "ios" ? (
          <div className="space-y-2.5 animate-slide-in-step">
            <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/6 hover:border-indigo-500/35 hover:translate-x-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ease-out text-xs text-slate-300">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 group-hover:text-white transition-all duration-300 shadow-sm">
                1
              </span>
              <span className="flex items-center gap-1.5 flex-1 leading-relaxed">
                Tap the{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold group-hover:scale-105 transition-transform duration-200">
                  <Share className="w-3.5 h-3.5 text-indigo-400" /> Share
                </span>{" "}
                button in Safari bottom toolbar
              </span>
            </div>

            <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/6 hover:border-indigo-500/35 hover:translate-x-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ease-out text-xs text-slate-300">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 group-hover:text-white transition-all duration-300 shadow-sm">
                2
              </span>
              <span className="flex items-center gap-1.5 flex-1 leading-relaxed">
                Scroll down and tap{" "}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold group-hover:scale-105 transition-transform duration-200">
                  <PlusSquare className="w-3.5 h-3.5 text-indigo-400" /> Add to Home Screen
                </span>
              </span>
            </div>

            <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/6 hover:border-indigo-500/35 hover:translate-x-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ease-out text-xs text-slate-300">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 group-hover:text-white transition-all duration-300 shadow-sm">
                3
              </span>
              <span className="flex-1 leading-relaxed">
                Tap <strong className="text-white font-bold">Add</strong> in the top-right corner. RemindIQ is ready!
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 animate-slide-in-step">
            {isInstallable ? (
              <button
                type="button"
                onClick={async () => {
                  await promptInstall();
                  handleClose();
                }}
                className="btn-shimmer w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/35 cursor-pointer active:scale-[0.98] duration-200"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>Tap Here to Install App Now</span>
              </button>
            ) : (
              <>
                <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/6 hover:border-indigo-500/35 hover:translate-x-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ease-out text-xs text-slate-300">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 group-hover:text-white transition-all duration-300 shadow-sm">
                    1
                  </span>
                  <span className="flex-1 leading-relaxed">
                    Tap the <strong className="text-white font-bold">three dots menu (⋮)</strong> in Chrome top right
                  </span>
                </div>

                <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 hover:bg-slate-900/80 border border-white/6 hover:border-indigo-500/35 hover:translate-x-1.5 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 ease-out text-xs text-slate-300">
                  <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 group-hover:text-white transition-all duration-300 shadow-sm">
                    2
                  </span>
                  <span className="flex-1 leading-relaxed">
                    Tap <strong className="text-white font-bold">Install app</strong> or <strong className="text-white font-bold">Add to Home screen</strong>
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-[0.98] text-white text-xs font-semibold border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-md"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>,
    document.body
  );
}

