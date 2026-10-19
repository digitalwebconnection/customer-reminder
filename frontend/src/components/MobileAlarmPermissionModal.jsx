import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  BellRing,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Sparkles,
  Radio,
  Zap,
  Info,
  ExternalLink,
  Lock,
} from "lucide-react";
import { usePwa } from "../context/PwaContext";
import { useToast } from "../context/ToastContext";
import { playChimeSound } from "../utils/audioAlert";

export default function MobileAlarmPermissionModal() {
  const {
    showAlarmModal,
    setShowAlarmModal,
    permissions,
    loadingPermissions,
    enableAllAlarmPermissions,
    testMobileAlarm,
    isIos,
    isInstalled,
    promptInstall,
  } = usePwa();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState(isIos ? "ios" : "android");
  const [testingAlarm, setTestingAlarm] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  if (!showAlarmModal) return null;

  const isGranted = permissions.notification === "granted";
  const isPushActive = permissions.pushSubscribed;
  const isAllReady = isGranted && isPushActive;

  const handleGrantPermissions = async () => {
    try {
      const res = await enableAllAlarmPermissions();
      playChimeSound();

      if (res?.success) {
        toast.success(
          "Permissions Granted! 🎉",
          "Your phone is now armed to receive call alarms even when the app is closed."
        );
      } else if (res?.permissions?.notification === "denied") {
        toast.error(
          "Notifications Blocked",
          "Please tap the site permissions icon in your browser address bar to allow notifications."
        );
      } else {
        toast.info(
          "Status Updated",
          "Notification preferences have been synchronized."
        );
      }
    } catch (err) {
      toast.error("Setup Error", err.message || "Failed to enable permissions.");
    }
  };

  const handleTestAlarm = async () => {
    setTestingAlarm(true);
    setTestSentSuccess(false);

    try {
      playChimeSound();
      const res = await testMobileAlarm();

      setTestSentSuccess(true);
      toast.call(
        "🚨 Test Alarm Dispatched!",
        "NOW: Press your phone's Home button or lock your screen. Your phone will ring and show the notification!"
      );

      setTimeout(() => setTestSentSuccess(false), 8000);
    } catch (err) {
      toast.error(
        "Test Failed",
        "Could not dispatch test push. Make sure permissions are granted first."
      );
    } finally {
      setTestingAlarm(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10002] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={() => setShowAlarmModal(false)}
    >
      <div
        className="w-full max-w-lg bg-slate-900/98 border border-white/15 rounded-3xl shadow-2xl p-5 sm:p-7 backdrop-blur-2xl text-slate-100 ring-1 ring-black/70 space-y-5 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-amber-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/35 border border-white/20 shrink-0">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Mobile Alarms & Notifications
                </h3>
                {isAllReady ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ARMED 🟢
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    SETUP REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable permissions so customer call reminders ring your phone when the app is closed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAlarmModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Permission Diagnostics List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Device Permissions</span>
          </h4>

          {/* 1. System Notification Permission */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/25">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Phone Notifications</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Lock screen & notification drawer alerts
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {permissions.notification === "granted" ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Granted
                </span>
              ) : permissions.notification === "denied" ? (
                <span className="text-[11px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Blocked
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  Not Enabled
                </span>
              )}
            </div>
          </div>

          {/* 2. Background Push Service */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/25">
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Background Alarm Service</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Wakes phone & rings when app is closed
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {permissions.pushSubscribed ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-400 bg-slate-800 border border-white/10 px-2.5 py-1 rounded-xl">
                  Inactive
                </span>
              )}
            </div>
          </div>

          {/* 3. Persistent Memory Guard */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/25">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200">Background Memory Guard</div>
                <div className="text-[11px] text-slate-400 truncate">
                  Protects worker from Android memory killer
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {permissions.storagePersisted ? (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Protected
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-400 bg-slate-800 border border-white/10 px-2.5 py-1 rounded-xl">
                  Standard
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleGrantPermissions}
            disabled={loadingPermissions}
            className="btn-shimmer w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:brightness-110 text-white text-sm font-bold transition flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/35 cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>
              {loadingPermissions
                ? "Arming Phone Alarms..."
                : isAllReady
                ? "Re-sync & Update Permissions"
                : "Grant All Permissions (1-Click)"}
            </span>
          </button>

          {/* Test Background Alarm Button */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestAlarm}
              disabled={testingAlarm}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>{testingAlarm ? "Sending..." : "Test Phone Alarm"}</span>
            </button>

            <button
              type="button"
              onClick={() => playChimeSound()}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Ringtone</span>
            </button>
          </div>

          {testSentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-fade-in flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong>Test Sent!</strong> Now close this app or lock your phone. The alarm notification will pop up on your screen.
              </div>
            </div>
          )}
        </div>

        {/* Mobile OS Optimization Guide Tabs */}
        <div className="pt-2 border-t border-white/8 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>How to guarantee alarms when app is closed</span>
            </span>

            <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === "android"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🤖 Android
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === "ios"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🍎 iPhone / iOS
              </button>
            </div>
          </div>

          {activeTab === "android" ? (
            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-white/6">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <p>
                  <strong>Disable Battery Optimization:</strong> Long press RemindIQ (or Chrome) icon &gt; tap <strong>(i) App Info</strong> &gt; <strong>Battery</strong> &gt; Select <strong>Unrestricted</strong>. (Prevents Android from putting notifications to sleep).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <p>
                  <strong>Enable Pop on Screen:</strong> In App Info &gt; <strong>Notifications</strong> &gt; Ensure <strong>Allow sound and vibration</strong> and <strong>Pop on screen</strong> are turned ON.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <p>
                  <strong>Allow Background Data:</strong> In App Info &gt; <strong>Mobile data</strong> &gt; toggle ON <strong>Allow background data usage</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-2xl border border-white/6">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <p>
                  <strong>Install to Home Screen First:</strong> Apple iOS (16.4+) requires you to tap <strong>Share ⎋ &gt; Add to Home Screen</strong> to receive background push notifications.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <p>
                  <strong>Open from Home Screen:</strong> Launch RemindIQ from your home screen, then tap the <strong>Grant All Permissions</strong> button above.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <p>
                  <strong>Check iOS Settings:</strong> Go to iPhone <strong>Settings &gt; Notifications &gt; RemindIQ</strong> and ensure <strong>Allow Notifications</strong>, <strong>Sounds</strong>, and <strong>Badges</strong> are enabled.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {isInstalled ? "App Installed on Device" : "Browser Web App Mode"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAlarmModal(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
