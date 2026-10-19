import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ListTodo,
  Plus,
  Smartphone,
  LogOut,
  BellRing,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePwa } from "../context/PwaContext";
import { useToast } from "../context/ToastContext";

export default function MobileBottomNav() {
  const { user, logout } = useAuth();
  const { isInstalled, promptInstall, permissions, setShowAlarmModal } = usePwa();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info("Signed Out", "You have been logged out.");
    navigate("/login");
  };

  if (!user) return null; // Don't show on login page

  const isAlarmReady = permissions.notification === "granted" && permissions.pushSubscribed;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* 1. All Reminders Tab */}
        <NavLink
          to="/reminders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isActive
                ? "text-indigo-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`
          }
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Reminders</span>
        </NavLink>

        {/* 2. Mobile Alarms & Permissions Hub */}
        <button
          type="button"
          onClick={() => setShowAlarmModal(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
            isAlarmReady
              ? "text-slate-400 hover:text-emerald-400"
              : "text-amber-400 font-bold hover:text-amber-300"
          }`}
          title="Mobile Alarms & Background Notifications"
        >
          <div className="relative">
            {isAlarmReady ? (
              <Bell className="w-5 h-5 text-emerald-400" />
            ) : (
              <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
            )}
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                isAlarmReady
                  ? "bg-emerald-400 ring-2 ring-[#070b14]"
                  : "bg-amber-400 animate-ping ring-2 ring-[#070b14]"
              }`}
            />
          </div>
          <span className="text-[10px] tracking-tight">
            {isAlarmReady ? "Alarms" : "Set Alarms"}
          </span>
        </button>

        {/* 3. Central Elevated Add Reminder Button */}
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 border-2 border-[#070b14] active:scale-95 transition-transform ${
              isActive ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#070b14]" : ""
            }`
          }
          title="Add Customer Reminder"
        >
          <Plus className="w-6 h-6" />
        </NavLink>

        {/* 4. Install App / Mobile Status */}
        <button
          type="button"
          onClick={() => promptInstall()}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-400 hover:text-indigo-300 transition-all cursor-pointer"
          title="Install RemindIQ App"
        >
          <div className="relative">
            <Smartphone className="w-5 h-5" />
            {!isInstalled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">
            {isInstalled ? "App" : "Get App"}
          </span>
        </button>

        {/* 5. Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
          title={`Log out (${user?.email})`}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
