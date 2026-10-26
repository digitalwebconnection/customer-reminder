import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ListTodo,
  History,
  Shield,
  ArrowLeft,
  LogOut,
  Bell,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

import MobileBottomNav from "./MobileBottomNav";
import RemindIQLogo from "../common/RemindIQLogo";

export default function AdminLayout({ children }) {
  const { user, openLogoutModal } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    openLogoutModal();
  };

  const navLinks = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/reminders", label: "Global Reminders", icon: ListTodo },
    { to: "/admin/logs", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="admin-apple-theme min-h-screen text-slate-800 flex flex-col relative selection:bg-amber-100 selection:text-amber-900">
      {/* Ambient Liquid Glass Background Slabs & Prisms */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Top-Left Ambient Liquid Glass Slab (like reference image) */}
        <div className="absolute -top-14 -left-20 w-[460px] h-32 rounded-full ambient-liquid-slab transform -rotate-12 opacity-85" />
        {/* Top-Right Ambient Liquid Glass Slab */}
        <div className="absolute top-16 -right-28 w-[520px] h-36 rounded-full ambient-liquid-slab transform rotate-6 opacity-80" />
        {/* Mid-screen floating liquid backdrop capsule */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-48 rounded-[50px] ambient-liquid-slab transform -rotate-2 opacity-50 pointer-events-none" />
        {/* Bottom-Left Ambient Liquid Glass Slab */}
        <div className="absolute -bottom-14 -left-16 w-[480px] h-36 rounded-full ambient-liquid-slab transform rotate-8 opacity-80" />
        {/* Bottom-Right Ambient Liquid Glass Slab */}
        <div className="absolute -bottom-16 -right-20 w-[540px] h-40 rounded-full ambient-liquid-slab transform -rotate-6 opacity-85" />
        {/* Prismatic ambient light caustics */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/25 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Top Admin Navbar with Liquid Glass */}
      <header
        className="sticky top-0 z-40 liquid-glass-header"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Super Admin Shield */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-3 group">
              <RemindIQLogo size="md" />
              <span className="liquid-glass-pill px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 bg-amber-500/15 border border-amber-400/40 tracking-wider rounded-full shadow-xs">
                SUPER ADMIN
              </span>
            </Link>
          </div>

          {/* Right Action: Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin"
              className="w-9 h-9 liquid-glass-pill flex items-center justify-center text-xs font-bold text-slate-800 hover:text-amber-600 transition active:scale-95 cursor-pointer"
              title={`Logged in as ${user?.email}`}
            >
              {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 liquid-glass-pill text-slate-600 hover:text-rose-600 transition cursor-pointer active:scale-95"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-nav Bar (iOS Segmented Control with Liquid Glass Pills) */}
        <div className="border-t border-white/60 bg-white/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2 scrollbar-none touch-pan-x">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => {
                    const active =
                      isActive ||
                      (item.to === "/admin" &&
                        location.pathname === "/admin/dashboard") ||
                      (item.to === "/admin/logs" &&
                        location.pathname === "/admin/activity-logs");
                    return `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      active
                        ? "liquid-glass-pill text-amber-950 font-bold ring-1 ring-amber-400/40"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`;
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8 relative z-10">
        {children}
      </main>

      {/* Mobile Navigation for Admin */}
      <MobileBottomNav />
    </div>
  );
}
