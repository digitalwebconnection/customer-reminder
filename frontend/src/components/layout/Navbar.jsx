import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  PlusCircle,
  ListTodo,
  LogOut,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  User as UserIcon,
  BellRing,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { usePwa } from "../../context/PwaContext";
import api from "../../api/axios";
import RemindIQLogo from "../common/RemindIQLogo";

export default function Navbar({ isCollapsed = false, onToggleCollapse }) {
  const toast = useToast();
  const { openLogoutModal, user } = useAuth();
  const { promptInstall, isInstalled, setShowAlarmModal } = usePwa();
  const location = useLocation();

  const [notificationState, setNotificationState] = useState("default");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prefetch workspace routes during idle for instantaneous tab switching
  useEffect(() => {
    const timer = setTimeout(() => {
      import("../../pages/reminders/AddReminder");
      import("../../pages/profile/Profile");
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleSendTestAlert = async () => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🔔 RemindIQ Test Alert", {
          body: "Desktop notifications are active on this PC!",
          icon: "/icon-192.png",
          badge: "/badge.png",
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
      "A 60-second test chime was dispatched to your PC & browser.",
    );
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    openLogoutModal();
  };

  const userInitial = (user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const navItems = [
    {
      to: "/reminders",
      label: "All Reminders",
      icon: ListTodo,
      end: true,
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

  const isNavActive = (itemTo, defaultActive) => {
    if (defaultActive) return true;
    if (
      itemTo === "/add" &&
      (location.pathname === "/reminders/add" ||
        location.pathname === "/add-reminder")
    ) {
      return true;
    }
    if (
      itemTo === "/profile" &&
      (location.pathname === "/settings" || location.pathname === "/account")
    ) {
      return true;
    }
    return false;
  };

  return (
    <>
      <header
        className="md:hidden sticky top-0 z-40 liquid-glass-header px-4 flex items-center justify-between select-none"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          minHeight: "calc(3.5rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation sidebar"
            className="p-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink
            to="/reminders"
            className="flex items-center"
            title="RemindIQ Workspace"
          >
            <RemindIQLogo size="sm" />
          </NavLink>
        </div>

        {/* Mobile Right: Alarm Pill & Profile */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (notificationState !== "granted") {
                if ("Notification" in window) {
                  const perm = await Notification.requestPermission();
                  setNotificationState(perm);
                }
              } else {
                handleSendTestAlert();
              }
            }}
            className="p-2 rounded-xl liquid-glass-pill text-emerald-600 active:scale-95"
            title={
              notificationState === "granted"
                ? "Alarms Active"
                : "Enable Alarms"
            }
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </button>

          <NavLink
            to="/profile"
            className="w-8 h-8 rounded-xl liquid-glass-pill flex items-center justify-center font-bold text-xs text-slate-800"
          >
            {userInitial}
          </NavLink>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MOBILE SLIDE-OVER DRAWER (< md): Smooth left slider   */}
      {/* ======================================================== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />

          {/* Left Slide Drawer */}
          <aside
            className="relative w-72 max-w-[82vw] liquid-glass-sidebar p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-300 overflow-y-auto"
            style={{
              paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div>
              {/* Header with Brand & Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                <div className="flex items-center">
                  <RemindIQLogo size="md" />
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Slide sidebar closed"
                  className="p-1.5 rounded-xl liquid-glass-pill text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links Group */}
              <div className="mt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-2 select-none">
                  Navigation
                </p>
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => {
                          const active = isNavActive(item.to, isActive);
                          return `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                            active
                              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40"
                              : "liquid-glass-pill text-slate-600 hover:text-slate-900 hover:bg-white/90"
                          }`;
                        }}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* System & Alarms Group */}
              <div className="mt-6 pt-5 border-t border-slate-200/60">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2.5 mb-2 select-none">
                  System & Alarms
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      promptInstall();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold liquid-glass-pill text-slate-700 hover:text-slate-900 transition shadow-xs"
                  >
                    <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{isInstalled ? "App Installed" : "Download App"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (notificationState !== "granted") {
                        setShowAlarmModal(true);
                      } else {
                        handleSendTestAlert();
                      }
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs ${
                      notificationState === "granted"
                        ? "liquid-glass-pill text-emerald-800 bg-emerald-500/10"
                        : "liquid-glass-pill text-amber-800 bg-amber-500/10"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        notificationState === "granted"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {notificationState === "granted"
                        ? testSent
                          ? "Test Alert Sent!"
                          : "Alarms Active"
                        : "Enable Alarms"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom User Profile & Logout */}
            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="w-9 h-9 rounded-2xl liquid-glass-pill flex items-center justify-center font-bold text-xs text-slate-800 shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || user?.email || "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Account Owner
                  </p>
                </div>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-2xl liquid-glass-pill text-slate-600 hover:text-rose-600 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DESKTOP LEFT SIDEBAR (>= md): Sliding Open / Close     */}
      {/* ======================================================== */}
      <aside
        className={`hidden md:flex fixed top-0 bottom-0 left-0 z-40 flex-col justify-between liquid-glass-sidebar transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? "w-20 px-3 py-4" : "w-64 px-4 py-4"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div
            className={`flex items-center pb-3.5 border-b border-slate-200/60 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            {isCollapsed ? (
              /* ONLY Logo: positioned cleanly at the top, clicking opens sidebar, hovering reveals Open icon */
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Click to open sidebar & full logo"
                aria-label="Click to open sidebar & full logo"
                className="group relative w-11 h-11 rounded-2xl liquid-glass-pill flex items-center justify-center shadow-xs transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:bg-white/95 focus:outline-none"
              >
                {/* Default State: Official RemindIQ Logo Icon */}
                <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
                  <RemindIQLogo iconOnly size="sm" />
                </div>

                {/* On Hover State: Open Icon appears smoothly */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 text-amber-600">
                  <PanelLeftOpen className="w-5 h-5 drop-shadow-xs" />
                </div>
              </button>
            ) : (
              <>
                <NavLink
                  to="/reminders"
                  className="flex items-center group cursor-pointer"
                  title="RemindIQ Workspace"
                >
                  <RemindIQLogo size="md" />
                </NavLink>

                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    title="Slide sidebar closed"
                    aria-label="Slide sidebar closed"
                    className="p-1.5 rounded-xl liquid-glass-pill text-slate-500 hover:text-slate-900 hover:bg-white/90 transition-all cursor-pointer active:scale-95 shadow-xs"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Navigation Links Group */}
          <div className="mt-5">
            {!isCollapsed && (
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2 select-none">
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
                    className={({ isActive }) => {
                      const active = isNavActive(item.to, isActive);
                      return `flex items-center gap-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        active
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40"
                          : "liquid-glass-pill text-slate-600 hover:text-slate-900 hover:bg-white/90"
                      } ${
                        isCollapsed
                          ? "justify-center p-3"
                          : "px-3.5 py-2.5"
                      }`;
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* System & Alarms Group */}
          <div className="mt-6 pt-5 border-t border-slate-200/60">
            {!isCollapsed && (
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2 select-none">
                System & Alarms
              </p>
            )}

            <div className="flex flex-col gap-2">
              {/* Download App */}
              <button
                type="button"
                onClick={promptInstall}
                title={
                  isInstalled
                    ? "App Installed on Device"
                    : "Download & Install Web App"
                }
                className={`flex items-center gap-2.5 rounded-2xl text-xs font-bold liquid-glass-pill text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5"
                }`}
              >
                <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">
                    {isInstalled ? "App Installed" : "Download App"}
                  </span>
                )}
              </button>

              {/* Alarms Status Pill */}
              <button
                type="button"
                onClick={async () => {
                  if (notificationState !== "granted") {
                    setShowAlarmModal(true);
                  } else {
                    handleSendTestAlert();
                  }
                }}
                title={
                  notificationState === "granted"
                    ? "Alarms Active! Click to test alert chime"
                    : "Notifications blocked or disabled. Click to configure."
                }
                className={`flex items-center gap-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                  notificationState === "granted"
                    ? "liquid-glass-pill text-emerald-800 bg-emerald-500/10 border border-emerald-400/40"
                    : "liquid-glass-pill text-amber-800 bg-amber-500/10 border border-amber-400/40"
                } ${isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5"}`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    notificationState === "granted"
                      ? "bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50"
                      : "bg-amber-500"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">
                    {notificationState === "granted"
                      ? testSent
                        ? "Test Sent!"
                        : "Alarms Active"
                      : "Enable Alarms"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: User Info & Logout */}
        <div className="pt-4 border-t border-slate-200/60">
          <div
            className={`flex items-center ${
              isCollapsed ? "flex-col gap-2.5 justify-center" : "justify-between"
            }`}
          >
            <NavLink
              to="/profile"
              title={`Profile (${user?.name || user?.email || "User"})`}
              className={`flex items-center gap-2.5 min-w-0 transition hover:opacity-85 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-2xl liquid-glass-pill flex items-center justify-center font-bold text-xs text-slate-800 shrink-0 shadow-xs">
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-28">
                    {user?.name || user?.email || "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Account Owner
                  </p>
                </div>
              )}
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              className="p-2 rounded-2xl liquid-glass-pill text-slate-500 hover:text-rose-600 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
