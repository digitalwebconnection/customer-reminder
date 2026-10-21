import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Phone,
  CheckCircle2,
  Volume2,
  VolumeX,
  Clock,
  Copy,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { formatInAustralianTime } from "../utils/dateUtils";
import { unlockRingAudio, startCallRingtone } from "../utils/audioAlert";

/**
 * IncomingCallOverlay
 * Immersive, full-screen mobile incoming call ringing screen.
 * Triggers on mobile and desktop when a customer reminder alarm is due.
 */
export default function IncomingCallOverlay({
  alert,
  secondsLeft = 60,
  isMuted = false,
  isCompleting = false,
  onCall,
  onComplete,
  onSnooze,
  onToggleMute,
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

  const handleCallClick = () => {
    if (onCall) {
      onCall(alert);
    } else if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  const handleTouchUnlock = () => {
    unlockRingAudio()
      .then(() => {
        if (!isMuted) {
          startCallRingtone();
        }
      })
      .catch(() => {});
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 60) * 100));

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Incoming Call Reminder: ${name}`}
      onClick={handleTouchUnlock}
      onTouchStart={handleTouchUnlock}
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-[#080a0f]/96 sm:bg-[#080a0f]/85 backdrop-blur-2xl text-white select-none overflow-y-auto animate-in fade-in duration-200"
    >
      {/* 60-Second Top Animated Ringing Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800/80 z-20 overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-rose-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Top Bar: Alarm Badge, Countdown & Controls */}
      <div className="w-full max-w-xl mx-auto pt-6 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Call Due Now</span>
          </span>
          <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{secondsLeft}s ringing</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? "Unmute Ringtone" : "Mute Ringtone"}
            className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => onDismiss && onDismiss(alert)}
            title="Dismiss Alarm"
            className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Caller Display: Pulsing Radar Avatar & Customer Details */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center text-center my-auto">
        {/* Animated Acoustic Radar Ripple Effect */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-36 h-36 rounded-full bg-emerald-500/15 animate-ping opacity-60" />
          <div className="absolute w-48 h-48 rounded-full bg-emerald-500/10 animate-pulse opacity-40" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-linear-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 border-2 border-emerald-300/40">
            <Phone className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
          </div>
        </div>

        {/* Customer Name */}
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight wrap-break-word max-w-full">
          {name}
        </h2>

        {/* Customer Phone & Copy Button */}
        {phone && (
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="font-mono text-lg sm:text-2xl font-bold text-emerald-400 tracking-wider">
              {phone}
            </span>
            <button
              type="button"
              onClick={handleCopyPhone}
              title="Copy phone number"
              className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Scheduled Time & Timezone Badge */}
        <p className="mt-3 text-xs sm:text-sm text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
          <span>Scheduled:</span>
          <span className="text-zinc-200 font-semibold">{scheduledTimeStr}</span>
        </p>

        {/* Call Agenda / Note Card */}
        {note && (
          <div className="mt-5 w-full max-w-md p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-lg text-left backdrop-blur-md">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Agenda / Note</span>
            </div>
            <p className="text-sm text-zinc-200 italic line-clamp-3 leading-relaxed">
              "{note}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Interactive Controls: Big Mobile-Friendly Buttons */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 flex flex-col gap-3 shrink-0">
        {/* 1. Large Primary "CALL NOW" Button */}
        <a
          href={cleanPhone ? `tel:${cleanPhone}` : "#"}
          onClick={handleCallClick}
          className="w-full h-14 sm:h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-zinc-950 font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl shadow-emerald-500/30"
        >
          <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          <span>Call Now ({phone || "Customer"})</span>
        </a>

        {/* 2. Primary "COMPLETE CALL" Button */}
        <button
          type="button"
          disabled={isCompleting}
          onClick={() => onComplete && onComplete(alert)}
          className="w-full h-12 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 border border-emerald-400/30 disabled:opacity-50"
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Marking Completed...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Mark Call as Completed</span>
            </>
          )}
        </button>

        {/* 3. Quick Snooze & Utility Actions Row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSnooze && onSnooze(alert, 5 / 60, "5 minutes")}
            className="h-10 sm:h-11 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-zinc-800 active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>+5m Snooze</span>
          </button>

          <button
            type="button"
            onClick={() => onSnooze && onSnooze(alert, 10 / 60, "10 minutes")}
            className="h-10 sm:h-11 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-zinc-800 active:scale-95 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>+10m Snooze</span>
          </button>

          <button
            type="button"
            onClick={() => onDismiss && onDismiss(alert)}
            className="h-10 sm:h-11 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center justify-center transition border border-zinc-800 active:scale-95 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
}
