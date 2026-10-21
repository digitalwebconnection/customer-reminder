import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import MobileBottomNav from './MobileBottomNav';

export default function AdminLayout({ children }) {
  const { user, openLogoutModal } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    openLogoutModal();
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/reminders', label: 'Global Reminders', icon: ListTodo },
    { to: '/admin/logs', label: 'Audit Logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative">
      {/* Top Admin Navbar */}
      <header
        className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-800"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Super Admin Shield */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-amber-500/20">
                <Shield className="w-4 h-4 text-zinc-950" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-base">
                  Remind<span className="text-zinc-400">IQ</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action: Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white hover:border-amber-500/50 transition"
              title={`Logged in as ${user?.email}`}
            >
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-nav Bar */}
        <div className="border-t border-zinc-800/80 bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none touch-pan-x">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`
                  }
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation for Admin */}
      <MobileBottomNav />
    </div>
  );
}

