import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

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
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-white/90 px-3 py-1.5 shadow-[0_-10px_35px_rgba(100,116,139,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] safe-area-bottom select-none"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Dashboard */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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
              `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`
            }
          >
            <ListTodo className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Global</span>
          </NavLink>

          {/* Audit Logs */}
          <NavLink
            to="/admin/logs"
            className={({ isActive }) => {
              const active =
                isActive || location.pathname === "/admin/activity-logs";
              return `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                active
                  ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`;
            }}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Logs</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  // 2. Standard User Mobile Navigation (Personal Reminders & Add)
  return (
    <nav
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-white/90 px-3 py-1.5 shadow-[0_-10px_35px_rgba(100,116,139,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] safe-area-bottom select-none"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* All Reminders Tab */}
        <NavLink
          to="/reminders"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
              isActive
                ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <ListTodo className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Reminders</span>
        </NavLink>

        {/* Elevated Add Reminder Button */}
        <NavLink
          to="/add"
          className={({ isActive }) => {
            const active =
              isActive ||
              location.pathname === "/reminders/add" ||
              location.pathname === "/add-reminder";
            return `flex flex-col items-center justify-center -mt-5 w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border-2 border-white active:scale-90 transition-all cursor-pointer ${
              active
                ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white"
                : ""
            }`;
          }}
          title="Add Customer Reminder"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => {
            const active =
              isActive ||
              location.pathname === "/settings" ||
              location.pathname === "/account";
            return `flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl transition-all active:scale-95 cursor-pointer ${
              active
                ? "liquid-glass-pill text-amber-950 font-extrabold shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`;
          }}
          title="My Profile"
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Profile</span>
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center min-h-11.5 min-w-13 py-1 px-2.5 rounded-2xl text-slate-500 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
          title={`Log out (${user?.email})`}
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Log Out</span>
        </button>
      </div>
    </nav>
  );
}
