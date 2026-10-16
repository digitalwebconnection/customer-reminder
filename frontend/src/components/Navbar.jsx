import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, ListTodo, Bell, BellRing, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestAndSubscribePush } from '../utils/pushManager';
import { promptOneSignalPush } from '../utils/oneSignalManager';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notificationState, setNotificationState] = useState('default');
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setLoadingPush(true);
    try {
      await promptOneSignalPush();
      await requestAndSubscribePush();
    } catch (e) {
      console.warn('Push registration error:', e);
    }
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }
    setLoadingPush(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <NavLink to="/reminders" className="flex items-center gap-2.5 font-bold text-white text-base tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
              <Bell className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-100">RemindIQ</span>
          </NavLink>

          {/* Navigation Items: Exactly 2 Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/add"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Reminder</span>
            </NavLink>

            <NavLink
              to="/reminders"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <ListTodo className="w-4 h-4" />
              <span>All Reminders</span>
            </NavLink>
          </nav>
        </div>

        {/* Right side: Notifications button & Logout */}
        <div className="flex items-center gap-2.5">
          {notificationState === 'granted' ? (
            <span
              title="Browser notifications are enabled (desktop popups active)"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Notifications On</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={loadingPush}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 transition cursor-pointer disabled:opacity-50"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{loadingPush ? 'Enabling...' : 'Enable Notifications'}</span>
              <span className="sm:hidden">Alerts</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            title={`Log out (${user?.email || 'Owner'})`}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
