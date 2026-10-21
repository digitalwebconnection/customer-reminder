import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  PlusCircle,
  ListTodo,
  Bell,
  BellRing,
  LogOut,
  AlertCircle,
  Radio,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Volume2,
  VolumeX,
  Activity,
  Shield,
  User as UserIcon,
  LayoutDashboard,
  Users,
  History,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePwa } from "../context/PwaContext";
import { requestAndSubscribePush } from "../utils/pushManager";
import { promptOneSignalPush } from "../utils/oneSignalManager";
import { playChimeSound } from "../utils/audioAlert";
import { subscribeKeepAlive, pingBackend } from "../utils/renderKeepAlive";
import api from "../api/axios";

export default function Navbar({ isCollapsed = false, onToggleCollapse }) {
  const toast = useToast();
  const { logout, user } = useAuth();
  const {
    promptInstall,
    isInstalled,
    setShowAlarmModal,
    permissions,
    enableRingPermission,
    toggleRingPermission,
  } = usePwa();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationState, setNotificationState] = useState("default");
  const [loadingPush, setLoadingPush] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [keepAlive, setKeepAlive] = useState({
    status: "online",
    lastPing: null,
    latencyMs: null,
    pingCount: 0,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationState(Notification.permission);
    }

    const unsubscribe = subscribeKeepAlive((state) => {
      setKeepAlive(state);
    });

    return () => unsubscribe();
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleManualPing = async () => {
    toast.info("Pinging Render...", "Sending 14-minute keep-alive ping to backend.");
    const data = await pingBackend();
    if (data) {
      toast.success(
        "Render Server Active 🟢",
        `Response in ${keepAlive.latencyMs || 100}ms. Database: ${data.database || "connected"}`
      );
    } else {
      toast.warning("Server Cold Start", "Ping queued. Render is waking up.");
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
    toast.call(
      "Test Alert Sent 🔔",
      "A 60-second test chime was dispatched to your PC & browser."
    );
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    toast.info("Signed Out", "You have been logged out.");
    navigate("/login");
  };

  const userInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  const isSuperAdmin = user?.role === "superadmin";

  // Navigation Links definition - Super Admin only gets admin control items, regular user gets reminders
  const navItems = isSuperAdmin
    ? [
        {
          to: "/admin",
          label: "Dashboard",
          icon: LayoutDashboard,
          end: true,
        },
        {
          to: "/admin/users",
          label: "User Management",
          icon: Users,
        },
        {
          to: "/admin/reminders",
          label: "Global Reminders",
          icon: ListTodo,
        },
        {
          to: "/admin/logs",
          label: "Audit Logs",
          icon: History,
        },
        {
          to: "/profile",
          label: "My Profile",
          icon: UserIcon,
        },
      ]
    : [
        {
          to: "/reminders",
          label: "All Reminders",
          icon: ListTodo,
        },
        {
          to: "/add",
          label: "Add Reminder",
          icon: PlusCircle,
        },
        {
          to: "/profile",
          label: "My Profile",
          icon: UserIcon,
        },
      ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MOBILE TOP BAR (< md): With hamburger left-slider toggle */}
      {/* ======================================================== */}
      <header
        className="md:hidden sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800 px-4 flex items-center justify-between shadow-xs transition-all"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Left Navigation Slider"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-95"
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink
            to={isSuperAdmin ? "/admin" : "/reminders"}
            className="flex items-center gap-2 font-bold text-white text-base"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white">
              <Bell className="w-3.5 h-3.5 text-zinc-100" />
            </div>
            <span className="font-bold text-zinc-100 tracking-tight text-sm">
              Remind<span className="text-zinc-400">IQ</span>
            </span>
          </NavLink>
        </div>

        {/* Quick Alarm Status Pill on Mobile */}
        <div className="flex items-center gap-2">
          {notificationState === "granted" ? (
            permissions?.ringSound === "granted" ? (
              <button
                type="button"
                onClick={() => setShowAlarmModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 active:scale-95"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Alarms & Ring Ready</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAlarmModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 active:scale-95"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Set Ring</span>
              </button>
            )
          ) : notificationState === "denied" ? (
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 active:scale-95"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Blocked</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-100 border border-zinc-700 active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Set Alarms</span>
            </button>
          )}
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE SLIDE-OVER DRAWER (< md): Smooth left-side slider */}
      {/* ======================================================== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* Left Slide Drawer */}
          <div
            className="relative w-72 max-w-[82vw] bg-[#09090b] border-r border-zinc-800 px-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250 overflow-y-auto"
            style={{
              paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                <NavLink
                  to={isSuperAdmin ? "/admin" : "/reminders"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white">
                    <Bell className="w-4 h-4 text-zinc-100" />
                  </div>
                  <span className="font-bold text-zinc-100 tracking-tight text-base">
                    Remind<span className="text-zinc-400">IQ</span>
                  </span>
                </NavLink>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  aria-label="Close Slider Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1.5">
                  Navigation
                </p>
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60"
                              : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0 text-zinc-400" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* System & Tools */}
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1.5">
                  App & Alarms
                </p>
                <div className="flex flex-col gap-1.5">
                  {/* Download App */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      promptInstall();
                    }}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{isInstalled ? "App Installed" : "Download Mobile App"}</span>
                  </button>

                  {/* Alarm Permissions */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setShowAlarmModal(true);
                    }}
                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      notificationState === "granted"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : notificationState === "denied"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : "bg-zinc-900 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {notificationState === "granted" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>Alarms Active</span>
                      </>
                    ) : notificationState === "denied" ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Alarms Blocked</span>
                      </>
                    ) : (
                      <>
                        <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Set Alarms</span>
                      </>
                    )}
                  </button>

                  {/* Reminder Ringtone Permission Item */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (permissions?.ringSound === 'granted') {
                        const res = await toggleRingPermission();
                        if (res?.success) {
                          toast.success("Ringtone Enabled 🔔", "Reminders will ring out loud.");
                        } else {
                          toast.info("Ringtone Muted 🔕", "Reminder ringtone silenced.");
                        }
                      } else {
                        const res = await enableRingPermission();
                        if (res?.success) {
                          toast.success("Ringtone Permission Set! 🔊", "Phone ringtone is now active.");
                        }
                      }
                    }}
                    className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer active:scale-95 ${
                      permissions?.ringSound === 'granted'
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>Reminder Ringtone</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-950/80">
                      {permissions?.ringSound === 'granted' ? "Ring Ready 🔊" : "Set Ring 🔔"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Drawer Footer: User & Logout */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition cursor-pointer"
                title="View Profile"
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                    user?.role === "superadmin"
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-zinc-800 border-zinc-700"
                  }`}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate max-w-32.5">
                    {user?.name || user?.email || "User"}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {user?.role === "superadmin" ? (
                      <span className="text-amber-400 font-semibold">Super Admin</span>
                    ) : (
                      "User"
                    )}
                  </p>
                </div>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESKTOP LEFT-SIDE SLIDER (>= md): Sleek vertical sidebar */}
      {/* ======================================================== */}
      <aside
        className={`hidden md:flex fixed top-0 bottom-0 left-0 bg-[#09090b] border-r border-zinc-800 z-40 flex-col justify-between transition-all duration-300 ease-in-out shadow-lg ${
          isCollapsed ? "w-20 p-3" : "w-64 p-4"
        }`}
      >
        {/* Top: Brand Header + Slider Collapse Toggle */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
            <NavLink
              to={isSuperAdmin ? "/admin" : "/reminders"}
              className={`flex items-center gap-3 font-bold text-white tracking-tight group overflow-hidden ${
                isCollapsed ? "justify-center w-full" : ""
              }`}
              title={isSuperAdmin ? "Super Admin Control Center" : "RemindIQ Dashboard"}
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-xs group-hover:border-zinc-500 transition shrink-0">
                <Bell className="w-4 h-4 text-zinc-100" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-100 tracking-tight text-base leading-tight">
                    Remind<span className="text-zinc-400">IQ</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {isSuperAdmin ? "Super Admin" : "Customer Calls"}
                  </span>
                </div>
              )}
            </NavLink>

            {/* Slider Collapse / Expand Button */}
            {!isCollapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Slide sidebar closed"
                aria-label="Slide sidebar closed"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* If collapsed, show the expand button directly below brand */}
          {isCollapsed && onToggleCollapse && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Slide sidebar open"
                aria-label="Slide sidebar open"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links Group */}
          <div className="mt-5">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-2">
                Navigation
              </p>
            )}
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={item.label}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-zinc-800 text-white shadow-xs border border-zinc-700/60 font-semibold"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                      } ${isCollapsed ? "justify-center px-0 py-2.5" : ""}`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* System & Actions Group */}
          <div className="mt-6 pt-5 border-t border-zinc-800/60">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-2">
                System & Alarms
              </p>
            )}

            <div className="flex flex-col gap-2">
              {/* Download App */}
              <button
                type="button"
                onClick={() => promptInstall()}
                title={isInstalled ? "App Installed on PC/Device" : "Download & Install Mobile Web App"}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 transition cursor-pointer shadow-xs ${
                  isCollapsed ? "justify-center px-0" : ""
                }`}
              >
                <Smartphone className="w-4 h-4 text-zinc-400 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">
                    {isInstalled ? "App Installed" : "Download App"}
                  </span>
                )}
              </button>

              {/* Alarm Status Button */}
              {notificationState === "granted" ? (
                <button
                  type="button"
                  onClick={() => setShowAlarmModal(true)}
                  title="Alarms active. Click to manage permissions or test."
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer shadow-xs ${
                    isCollapsed ? "justify-center px-0" : ""
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  {!isCollapsed && <span className="truncate">Alarms Active</span>}
                </button>
              ) : notificationState ===    "denied" ? (
                <button
                  type="button"
                  onClick={() => setShowAlarmModal(true)}
                  title="Notifications are blocked in browser. Click to unblock."
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer ${
                    isCollapsed ? "justify-center px-0" : ""
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {!isCollapsed && <span className="truncate">Alarms Blocked</span>}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAlarmModal(true)}
                  disabled={loadingPush}
                  title="Click to enable customer call alarms"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition cursor-pointer disabled:opacity-50 shadow-xs ${
                    isCollapsed ? "justify-center px-0" : ""
                  }`}
                >
                  <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                  {!isCollapsed && <span className="truncate">Set Alarms</span>}
                </button>
              )}

            
            </div>
          </div>
        </div>

        {/* Bottom: User Info & Logout */}
        <div className="pt-4 border-t border-zinc-800/80">
          <div
            className={`flex items-center ${
              isCollapsed ? "flex-col gap-2 justify-center" : "justify-between"
            }`}
          >
            <NavLink
              to="/profile"
              title={`View Profile (${user?.email})`}
              className={`flex items-center gap-2.5 min-w-0 hover:opacity-85 transition cursor-pointer ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                  user?.role === "superadmin"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-zinc-800 border-zinc-700"
                }`}
              >
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                    {user?.name || user?.email || "User"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {user?.role === "superadmin" ? (
                      <span className="text-amber-400 font-semibold">Super Admin</span>
                    ) : (
                      "User"
                    )}
                  </p>
                </div>
              )}
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              title={`Log out (${user?.email || "User"})`}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/60 transition cursor-pointer"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
