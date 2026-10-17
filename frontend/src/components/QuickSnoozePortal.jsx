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

  useEffect(() => {
    if (!isOpen || !anchorRect) return;

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
  }, [isOpen, anchorRect]);

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
      // Don't close if scrolling inside the menu itself
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !reminder) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
      className="w-58 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl p-2 backdrop-blur-2xl text-left text-xs text-slate-100 ring-1 ring-black/60 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/8 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          Quick Snooze
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onSnooze(reminder, 1, "+1 Hour")}
          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/8 hover:text-white text-slate-200 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>+1 Hour</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">+1h</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder, 3, "+3 Hours")}
          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/8 hover:text-white text-slate-200 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <Clock3 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>+3 Hours</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">+3h</span>
        </button>

        <button
          type="button"
          onClick={() => onSnooze(reminder, 24, "Tomorrow")}
          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/8 hover:text-white text-slate-200 transition flex items-center justify-between cursor-pointer group"
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
          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/8 hover:text-white text-slate-200 transition flex items-center justify-between cursor-pointer group"
        >
          <span className="flex items-center gap-2 font-medium">
            <CalendarClock className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Next Week (7 days)</span>
          </span>
          <span className="text-[10px] text-purple-400/80 font-mono">+7d</span>
        </button>

        {onOpenCustomEdit && (
          <div className="pt-1 mt-1 border-t border-white/8">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomEdit(reminder);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/20 hover:text-indigo-200 text-slate-400 transition flex items-center justify-between cursor-pointer group text-[11px]"
            >
              <span className="flex items-center gap-2 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-45 transition-transform" />
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
