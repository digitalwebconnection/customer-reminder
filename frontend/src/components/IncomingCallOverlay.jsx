import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Phone,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatInAustralianTime } from "../utils/dateUtils";

/**
 * IncomingCallOverlay / Toaster
 * Compact top-right toaster notification card for incoming customer call reminders.
 * Floats on the top-right corner of the screen without covering or blocking the rest of the app.
 * Completely silent (no ringing sound).
 */
export default function IncomingCallOverlay({
  alert,
  secondsLeft = 60,
  isCompleting = false,
  onCall,
  onComplete,
  onSnooze,
  onDismiss,
}) {
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const phone = alert.phone || "";
  const name = alert.name || "Customer Call Due";
  const note = alert.note || "";
  const tz = alert.timezone || "Australia/Sydney";
  const scheduledTimeStr = alert.dueAt
    ? formatInAustralianTime(alert.dueAt, tz)
    : "Scheduled right now";

  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCallClick = (e) => {
    if (e) e.stopPropagation();
    if (onCall) {
      onCall(alert);
    } else if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  const handleCompleteClick = (e) => {
    if (e) e.stopPropagation();
    if (onComplete) onComplete(alert);
  };

  const handleSnoozeClick = (e, hours, label) => {
    if (e) e.stopPropagation();
    if (onSnooze) onSnooze(alert, hours, label);
  };

  const handleDismissClick = (e) => {
    if (e) e.stopPropagation();
    if (onDismiss) onDismiss(alert);
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 60) * 100));

  const content = (
    <aside
      role="alert"
      aria-live="assertive"
      aria-label={`Incoming Call Reminder: ${name}`}
      className="fixed top-4 right-4 z-9999 w-[calc(100vw-2rem)] sm:w-97.5 max-w-105 pointer-events-auto select-none"
      style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
    >
      <div className="relative bg-[#0c0e15]/96 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl shadow-2xl shadow-black/90 ring-1 ring-emerald-500/25 text-white overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
        {/* 60-Second Top Animated Countdown Bar */}
        <div className="h-1.5 w-full bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-rose-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-3.5 sm:p-4">
          {/* Header Row: Alarm Badge, Countdown & Dismiss */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs shadow-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Call Due Now</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{secondsLeft}s</span>
              </span>
            </div>

            {/* Dismiss Toast Button */}
            <button
              type="button"
              onClick={handleDismissClick}
              title="Dismiss Notification"
              className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 hover:text-white transition cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Customer Info Row */}
          <div className="mt-3 flex items-start gap-3">
            {/* Mini Avatar */}
            <div className="relative shrink-0 mt-0.5">
              <div className="relative w-11 h-11 rounded-xl bg-linear-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 border border-emerald-300/40">
                <Phone className="w-5 h-5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate leading-tight">
                {name}
              </h3>

              {phone && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 tracking-wide">
                    {phone}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    title="Copy phone number"
                    className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer border border-zinc-700/50"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}

              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                {scheduledTimeStr}
              </p>
            </div>
          </div>

          {/* Call Agenda / Note (if note is present) */}
          {note && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="italic line-clamp-2 leading-relaxed text-[11px] text-zinc-300">
                "{note}"
              </p>
            </div>
          )}

          {/* Primary Action Buttons (Call Now & Complete) */}
          <div className="mt-3.5 flex items-center gap-2">
            <a
              href={cleanPhone ? `tel:${cleanPhone}` : "#"}
              onClick={handleCallClick}
              className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 flex-1 transition shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Now</span>
            </a>

            <button
              type="button"
              disabled={isCompleting}
              onClick={handleCompleteClick}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 flex-1 transition border border-emerald-400/30 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Snooze & Dismiss Row */}
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleSnoozeClick(e, 5 / 60, "5 minutes")}
              className="h-7 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition border border-zinc-800 active:scale-95 cursor-pointer flex-1"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>+5m Snooze</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleSnoozeClick(e, 10 / 60, "10 minutes")}
              className="h-7 px-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition border border-zinc-800 active:scale-95 cursor-pointer flex-1"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>+10m Snooze</span>
            </button>

            <button
              type="button"
              onClick={handleDismissClick}
              className="h-7 px-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-medium flex items-center justify-center transition border border-zinc-800 active:scale-95 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
