import { NavLink, useNavigate } from "react-router-dom";
import {
  ListTodo,
  Plus,
  LogOut,
  BellRing,
  Bell,
  User as UserIcon,
  LayoutDashboard,
  Users,
  History,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePwa } from "../../context/PwaContext";
import { useToast } from "../../context/ToastContext";

export default function MobileBottomNav() {
  const { user, openLogoutModal, isSuperAdmin } = useAuth();
  const { permissions, setShowAlarmModal } = usePwa();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    openLogoutModal();
  };

  if (!user) return null; // Don't show on login page

  const isAlarmReady =
    permissions.notification === "granted" &&
    permissions.pushSubscribed &&
    permissions.ringSound === "granted";

  // 1. Super Admin Mobile Navigation (Strictly admin items, NO personal reminders)
  if (isSuperAdmin) {
    return (
      <nav
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-zinc-800/90 px-3 py-1.5 shadow-2xl safe-area-bottom select-none"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Dashboard */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Dashboard</span>
          </NavLink>

          {/* Users */}
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Users</span>
          </NavLink>

          {/* Global Reminders */}
          <NavLink
            to="/admin/reminders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            <ListTodo className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Global</span>
          </NavLink>

          {/* Audit Logs */}
          <NavLink
            to="/admin/logs"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Logs</span>
          </NavLink>

          {/* Profile */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isActive ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            <UserIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Profile</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  // 2. Standard User Mobile Navigation (Personal Reminders & Add)
  return (
    <nav
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-zinc-800/90 px-3 py-1.5 shadow-2xl safe-area-bottom select-none"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* All Reminders Tab */}
        <NavLink
          to="/reminders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isActive
                ? "text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`
          }
        >
          <ListTodo className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Reminders</span>
        </NavLink>

        {/* Mobile Alarms & Ringtone Hub */}
        <button
          type="button"
          onClick={() => setShowAlarmModal(true)}
          className={`flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
            isAlarmReady
              ? "text-zinc-400 hover:text-emerald-400"
              : "text-amber-400 font-bold hover:text-amber-300"
          }`}
          title="Mobile Alarms & Ringtone Permission"
        >
          <div className="relative mb-0.5">
            {isAlarmReady ? (
              <Bell className="w-5 h-5 text-emerald-400" />
            ) : (
              <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
            )}
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                isAlarmReady
                  ? "bg-emerald-400 ring-2 ring-[#09090b]"
                  : "bg-amber-400 animate-ping ring-2 ring-[#09090b]"
              }`}
            />
          </div>
          <span className="text-[10px] tracking-tight">
            {isAlarmReady
              ? "Ring/Alarm"
              : permissions.ringSound !== "granted"
              ? "Set Ring"
              : "Set Alarm"}
          </span>
        </button>

        {/* Elevated Add Reminder Button */}
        <NavLink
          to="/add"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-white text-zinc-950 shadow-xl shadow-black/50 border-2 border-[#09090b] active:scale-90 transition-all cursor-pointer ${
              isActive ? "ring-2 ring-white ring-offset-2 ring-offset-[#09090b]" : ""
            }`
          }
          title="Add Customer Reminder"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isActive ? "text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
            }`
          }
          title="My Profile"
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Profile</span>
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2 rounded-xl text-zinc-400 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
          title={`Log out (${user?.email})`}
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
