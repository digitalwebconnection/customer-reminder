import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  Clock3,
  Calendar,
  CalendarClock,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function QuickSnoozePortal({
  isOpen,
  onClose,
  anchorRect,
  reminder,
  onSnooze,
  onOpenCustomEdit,
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: "bottom" });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile || !anchorRect) return;

    const menuWidth = 230;
    const menuHeight = 240;
    const padding = 12;

    // Check space below and above anchor element
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;

    let top = 0;
    let placement = "bottom";

    // If less than 240px below, and more space above, open upwards
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = Math.max(padding, anchorRect.top - menuHeight - 8);
      placement = "top";
    } else {
      top = Math.min(window.innerHeight - menuHeight - padding, anchorRect.bottom + 8);
      placement = "bottom";
    }

    // Align right edge of menu with right edge of anchor button
    let left = anchorRect.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setPosition({ top, left, placement });
  }, [isOpen, anchorRect, isMobile]);

  // Outside click, escape, and scroll listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScrollOrResize = (e) => {
      if (isMobile) return; // Keep sheet open when user scrolls background on mobile
      // Don't close if scrolling inside the menu itself
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    if (!isMobile) {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScrollOrResize, true);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, onClose, isMobile]);

  if (!isOpen || !reminder) return null;

  // 1. MOBILE BOTTOM ACTION SHEET VIEW (< 640px)
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-9999 flex flex-col justify-end">
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
          onClick={onClose}
        />

        {/* Slide-Up Bottom Action Sheet */}
        <div
          ref={menuRef}
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}
          className="relative w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl p-4 sm:p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 select-none text-zinc-100"
        >
          {/* Drag Handle Bar */}
          <div className="w-10 h-1 bg-zinc-700/80 rounded-full mx-auto mb-3" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                Quick Reschedule
              </span>
              <p className="text-sm font-semibold text-white truncate max-w-65 mt-0.5">
                {reminder.name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Snooze Action Buttons */}
          <div className="space-y-1.5 py-1">
            <button
              type="button"
              onClick={() => onSnooze(reminder, 1, "+1 Hour")}
              className="w-full text-left px-3.5 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 border border-zinc-800/80 text-zinc-200 transition flex items-center justify-between active:scale-98 cursor-pointer group"
            >
              <span className="flex items-center gap-3 font-medium text-sm">
                <Clock className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>+1 Hour</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">
                +1h
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSnooze(reminder, 3, "+3 Hours")}
              className="w-full text-left px-3.5 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 border border-zinc-800/80 text-zinc-200 transition flex items-center justify-between active:scale-98 cursor-pointer group"
            >
              <span className="flex items-center gap-3 font-medium text-sm">
                <Clock3 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>+3 Hours</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">
                +3h
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSnooze(reminder, 24, "Tomorrow")}
              className="w-full text-left px-3.5 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 border border-zinc-800/80 text-zinc-200 transition flex items-center justify-between active:scale-98 cursor-pointer group"
            >
              <span className="flex items-center gap-3 font-medium text-sm">
                <Calendar className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Tomorrow (Same Time)</span>
              </span>
              <span className="text-xs text-emerald-400/90 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                +24h
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSnooze(reminder, 24 * 7, "Next Week")}
              className="w-full text-left px-3.5 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 border border-zinc-800/80 text-zinc-200 transition flex items-center justify-between active:scale-98 cursor-pointer group"
            >
              <span className="flex items-center gap-3 font-medium text-sm">
                <CalendarClock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Next Week (7 days)</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/50">
                +7d
              </span>
            </button>

            {onOpenCustomEdit && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomEdit(reminder);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-700 text-zinc-200 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-xs font-semibold"
                >
                  <SlidersHorizontal className="w-4 h-4 text-zinc-300" />
                  <span>Choose Custom Date & Time</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 2. DESKTOP FLOATING POPOVER VIEW (>= 640px)
  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
      className="w-58 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 backdrop-blur-2xl text-left text-xs text-zinc-100 ring-1 ring-black/60 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-800 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-zinc-400" />
          Quick Snooze
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onSnooze(reminder, 1, "+1 Hour")}
          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white text-zinc-300 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:scale-110 transition-transform" />
            <span>+1 Hour</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">+1h</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder, 3, "+3 Hours")}
          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white text-zinc-300 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Clock3 className="w-3.5 h-3.5 text-zinc-400 group-hover:scale-110 transition-transform" />
            <span>+3 Hours</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">+3h</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder, 24, "Tomorrow")}
          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white text-zinc-300 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Tomorrow (Same Time)</span>
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono">+24h</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder, 24 * 7, "Next Week")}
          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white text-zinc-300 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <CalendarClock className="w-3.5 h-3.5 text-zinc-400 group-hover:scale-110 transition-transform" />
            <span>Next Week (7 days)</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">+7d</span>
        </button>

        {onOpenCustomEdit && (
          <div className="pt-1 mt-1 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomEdit(reminder);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 hover:text-white text-zinc-400 transition flex items-center justify-between cursor-pointer group text-[11px]"
            >
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 group-hover:rotate-45 transition-transform" />
                <span>Custom Date & Time...</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
