import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  ListTodo,
  Bell,
  BellRing,
  LogOut,
  AlertCircle,
  Radio,
  User as UserIcon,
  Smartphone,
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePwa } from "../context/PwaContext";
import { requestAndSubscribePush } from "../utils/pushManager";
import { promptOneSignalPush } from "../utils/oneSignalManager";
import { playChimeSound } from "../utils/audioAlert";
import { subscribeKeepAlive, pingBackend } from "../utils/renderKeepAlive";
import api from "../api/axios";

export default function Navbar() {
  const toast = useToast();
  const { logout, user } = useAuth();
  const { promptInstall, isInstalled, setShowAlarmModal, permissions } = usePwa();
  const navigate = useNavigate();
  const [notificationState, setNotificationState] = useState("default");
  const [loadingPush, setLoadingPush] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [keepAlive, setKeepAlive] = useState({
    status: 'online',
    lastPing: null,
    latencyMs: null,
    pingCount: 0,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationState(Notification.permission);
    }

    // Subscribe to 14-minute keep-alive heartbeat updates
    const unsubscribe = subscribeKeepAlive((state) => {
      setKeepAlive(state);
    });

    return () => unsubscribe();
  }, []);

  const handleManualPing = async () => {
    toast.info("Pinging Render...", "Sending 14-minute keep-alive ping to backend.");
    const data = await pingBackend();
    if (data) {
      toast.success("Render Server Active 🟢", `Response in ${keepAlive.latencyMs || 100}ms. Database: ${data.database || 'connected'}`);
    } else {
      toast.warning("Server Cold Start", "Ping queued. Render is waking up.");
    }
  };

  const handleEnableNotifications = async () => {
    setLoadingPush(true);
    try {
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        setNotificationState(perm);
      }

      try {
        await requestAndSubscribePush();
      } catch (e) {
        console.warn("Service worker push registration warning:", e);
      }

      try {
        await promptOneSignalPush();
      } catch (e) {
        console.warn("OneSignal registration warning:", e);
      }
    } catch (err) {
      console.warn("Push registration error:", err);
    } finally {
      if ("Notification" in window) {
        setNotificationState(Notification.permission);
      }
      setLoadingPush(false);
    }
  };

  const handleSendTestAlert = async () => {
    playChimeSound();

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🔔 RemindIQ Test Alert", {
          body: "Desktop notifications are active on this PC!",
          icon: "/favicon.svg",
        });
      } catch (e) {}
    }

    try {
      await api.post("/reminders/test-pc-alert");
    } catch (e) {
      console.warn("Backend Windows toast error:", e);
    }

    setTestSent(true);
    toast.call("Test Alert Sent 🔔", "A 60-second test chime was dispatched to your PC & browser.");
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    toast.info("Signed Out", "You have been logged out.");
    navigate("/login");
  };

  const userInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-white/6 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Segmented Nav */}
        <div className="flex items-center gap-2.5 sm:gap-6 min-w-0">
          <NavLink
            to="/reminders"
            className="flex items-center gap-2 font-bold text-white text-base tracking-tight group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              <Bell className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-100 tracking-tight text-sm sm:text-lg">
              Remind<span className="text-indigo-400">IQ</span>
            </span>
          </NavLink>

          {/* Navigation Items: Segmented Glass Capsule */}
          <nav className="flex items-center p-1 bg-slate-900/80 rounded-2xl border border-white/8 shadow-inner shrink-0">
            <NavLink
              to="/add"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/4"
                }`
              }
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Add Reminder</span>
              <span className="sm:hidden text-xs">Add</span>
            </NavLink>

            <NavLink
              to="/reminders"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/4"
                }`
              }
            >
              <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">All Reminders</span>
              <span className="sm:hidden text-xs">All</span>
            </NavLink>
          </nav>
        </div>

        {/* Right side: 14m Keep-Alive indicator, Download App, User Badge, Notifications & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Download Mobile App Button */}
          <button
            type="button"
            onClick={() => promptInstall()}
            title={isInstalled ? "RemindIQ App is installed on this device" : "Download & Install Mobile Web App"}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">
              {isInstalled ? "App Installed" : "Download App"}
            </span>
            <span className="sm:hidden text-[11px]">
              {isInstalled ? "Installed" : "App"}
            </span>
          </button>

          {/* Mobile & Desktop Push Alarm Controls */}
          {notificationState === "granted" ? (
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              title="Alarms & Notifications are enabled. Click to manage permissions & test closed app alerts."
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition shadow-sm cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Alarms Active</span>
              <span className="sm:hidden text-[11px]">Alarms</span>
            </button>
          ) : notificationState === "denied" ? (
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              title="Notifications are blocked in your browser. Click to view instructions to unblock."
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Alarms Blocked</span>
              <span className="sm:hidden text-[11px]">Blocked</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              disabled={loadingPush}
              title="Click to enable mobile alarms & notifications on this phone"
              className="btn-shimmer inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/30"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Set Alarms</span>
              <span className="sm:hidden text-[11px]">Alarms</span>
            </button>
          )}

        

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={`Log out (${user?.email || "Owner"})`}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
