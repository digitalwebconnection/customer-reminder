import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, ListTodo, Bell, BellRing, LogOut, Check, Volume2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestAndSubscribePush } from '../utils/pushManager';
import { promptOneSignalPush } from '../utils/oneSignalManager';
import { playChimeSound } from '../utils/audioAlert';

import api from '../api/axios';

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notificationState, setNotificationState] = useState('default');
  const [loadingPush, setLoadingPush] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setLoadingPush(true);
    try {
      // 1. Direct native browser permission prompt (GUARANTEED to trigger the browser prompt)
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setNotificationState(perm);
      }

      // 2. Service worker push subscription
      try {
        await requestAndSubscribePush();
      } catch (e) {
        console.warn('Service worker push registration warning:', e);
      }

      // 3. OneSignal registration (with safeguard)
      try {
        await promptOneSignalPush();
      } catch (e) {
        console.warn('OneSignal registration warning:', e);
      }
    } catch (err) {
      console.warn('Push registration error:', err);
    } finally {
      if ('Notification' in window) {
        setNotificationState(Notification.permission);
      }
      setLoadingPush(false);
    }
  };

  const handleSendTestAlert = async () => {
    playChimeSound();

    // 1. Browser Desktop Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 RemindIQ Test Alert', {
          body: 'Desktop notifications are active on this PC!',
          icon: '/favicon.svg',
        });
      } catch (e) {}
    }

    // 2. Native Windows PC Action Center Toast Notification
    try {
      await api.post('/reminders/test-pc-alert');
    } catch (e) {
      console.warn('Backend Windows toast error:', e);
    }

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
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

        {/* Right side: Notifications controls & Logout */}
        <div className="flex items-center gap-2">
          {notificationState === 'granted' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSendTestAlert}
                title="Click to trigger a test desktop alert & sound"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{testSent ? 'Alert Sent!' : 'Alerts Active (Test)'}</span>
              </button>
            </div>
          ) : notificationState === 'denied' ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              title="Notifications are blocked in your browser settings. Click to re-check."
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Alerts Blocked (Unblock)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={loadingPush}
              title="Click to allow desktop notifications on this device"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/25 animate-pulse"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{loadingPush ? 'Prompting...' : 'Enable Notifications'}</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            title={`Log out (${user?.email || 'Owner'})`}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
