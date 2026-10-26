import React from "react";

/**
 * LoadingScreen
 * High-definition Apple VisionOS Liquid Glass loading screen
 * Displays on mobile, tablet & PC with deep obsidian black background,
 * central circular liquid glass orb containing the RemindIQ mark,
 * ambient prismatic light caustics, and a glass pill status loader.
 */
export default function LoadingScreen({ message = "Loading Workspace..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-9999 bg-[#08090d] flex flex-col items-center justify-center p-4 selection:bg-amber-100 select-none overflow-hidden"
    >
      {/* Ambient Prismatic Liquid Glass Caustics */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Top-Center Amber Caustic Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-amber-500/15 blur-3xl opacity-75 animate-pulse" />
        {/* Bottom-Right Sky Caustic Glow */}
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-sky-500/10 blur-3xl opacity-60" />
      </div>

      {/* Center Container */}
      <div className="relative z-10 flex flex-col items-center gap-5 sm:gap-6 text-center max-w-xs sm:max-w-sm px-4">
        {/* Circular Liquid Glass Orb with Logo */}
        <div className="relative group">
          {/* Subtle Outer Halo */}
          <div className="absolute -inset-1.5 rounded-full bg-linear-to-r from-amber-500/30 via-orange-500/20 to-sky-500/30 blur-md opacity-60 animate-pulse" />

          {/* Round Glass Sphere Container */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-linear-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1.5px_2px_rgba(255,255,255,0.45),0_0_35px_rgba(245,158,11,0.22)] flex items-center justify-center transition-transform duration-300 hover:scale-105">
            {/* Concentric Inner Glass Lip */}
            <div className="absolute inset-1.5 rounded-full border border-white/15 pointer-events-none" />

            {/* Official RemindIQ Mark Icon */}
            <img
              src="/remindiq-logo-icon.png"
              alt="RemindIQ Mark"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform -translate-y-0.5"
              loading="eager"
            />
          </div>
        </div>

        {/* Brand Name & Glass Status Pill */}
        <div className="flex flex-col items-center gap-3">
          {/* RemindIQ Brand Title */}
          <div className="flex items-center gap-1 text-xl sm:text-2xl font-black tracking-tight select-none">
            <span className="text-white drop-shadow-sm">REMIND</span>
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
              IQ
            </span>
          </div>

          {/* Liquid Glass Status Pill with Micro-Spinner */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-xs font-semibold text-slate-200">
            <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin shrink-0" />
            <span className="tracking-wide text-[11px] sm:text-xs text-slate-200 font-medium">
              {message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
