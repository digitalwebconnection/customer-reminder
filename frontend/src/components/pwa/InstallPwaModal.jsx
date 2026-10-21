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

  if (!showIosModal) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-10001 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setShowIosModal(false)}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-slate-900/98 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-7 backdrop-blur-2xl text-slate-100 ring-1 ring-black/70 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/35 border border-white/20">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Download Mobile App
                </h3>
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
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
            onClick={() => setShowIosModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-3 rounded-2xl border border-white/6">
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Full-screen view</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant call alerts</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Offline access</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>1-Tap quick launch</span>
          </div>
        </div>

        {/* Instructions: iPhone (Safari) or Android (Chrome) */}
        {isIos ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <span>🍎 Apple iOS (Safari) Instructions:</span>
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/6">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5 flex-1">
                  Tap the <Share className="w-4 h-4 text-indigo-400" /> <strong>Share</strong> button at bottom
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/6">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-1">
                  Scroll down & tap <PlusSquare className="w-4 h-4 text-indigo-400" /> <strong>Add to Home Screen</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/6">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="flex-1">
                  Tap <strong>Add</strong> in the top-right corner. Done!
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <span>🤖 Android / Chrome Instructions:</span>
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={async () => {
                    await promptInstall();
                    setShowIosModal(false);
                  }}
                  className="btn-shimmer w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/35 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Tap Here to Install App Now</span>
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/6">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="flex-1">
                      Tap the <strong>three dots menu (⋮)</strong> in Chrome top right
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-white/6">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="flex-1">
                      Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowIosModal(false)}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>,
    document.body
  );
}
