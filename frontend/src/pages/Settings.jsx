import React, { useState } from 'react';
import { Globe, Bell, Mail, Shield, Volume2, CheckCircle2, Clock, Check } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';
import { playChimeSound, triggerDesktopNotification } from '../utils/audioAlert';
import api from '../api/axios';

export default function Settings() {
  const { timezone, setTimezone, currentTzTime, supportedTimezones } = useTimezone();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const handleTimezoneChange = async (newTz) => {
    await setTimezone(newTz);
    setSavedMessage(`Default timezone updated to ${newTz}`);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleTestNotification = () => {
    playChimeSound();
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('RemindIQ Notification Test', {
          body: `Browser notifications are active in ${timezone}!`,
          icon: '/vite.svg',
        });
        setSavedMessage('Notification triggered successfully!');
      } else {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('RemindIQ Notification Test', {
              body: `Permissions granted! Reminders will notify you here.`,
              icon: '/vite.svg',
            });
          }
        });
      }
    } else {
      alert('Desktop notifications are not supported in this browser.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System & Timezone Settings</h2>
        <p className="text-sm text-slate-400">
          Tailored for Australian business operations. Adjust your state timezone, notification triggers, and sound preferences.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Australian Timezone Selection */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-semibold text-white">Australian Regional Timezone</h3>
              <p className="text-xs text-slate-400">
                Determines how "Today", "Upcoming", and "Overdue" calendar boundaries are calculated.
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-indigo-400 font-mono font-medium">{currentTzTime}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {supportedTimezones.map((tz) => (
            <label
              key={tz.value}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                timezone === tz.value
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="australian_timezone"
                  value={tz.value}
                  checked={timezone === tz.value}
                  onChange={() => handleTimezoneChange(tz.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold">{tz.label}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{tz.value}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {tz.state}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Notification Channels & Sound */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Reminder Alerts & Notifications</h3>
            <p className="text-xs text-slate-400">
              Configure how you get alerted when a customer call reminder is due.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Browser Desktop Push Notification */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white">Browser Desktop Notifications</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Displays system notification toasts on your desktop even when browsing other tabs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Request / Test Alert</span>
            </button>
          </div>

          {/* Sound Chime Alert */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white">Audible Chime Alert</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Plays a gentle chime synthesizer through your speakers whenever a reminder is due.
              </p>
            </div>
            <button
              type="button"
              onClick={playChimeSound}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Play Sample Chime</span>
            </button>
          </div>
        </div>
      </div>

      {/* How the Scheduler Engine Works */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Backend Worker Architecture (`reminderWorker.js`)</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The background worker runs continuously every minute using <code>node-cron</code>. It finds pending reminders where <code>dueAt &lt;= now</code>, atomically claims them via MongoDB, delivers email through Nodemailer, and posts Web Push events. Missed reminders while the server was offline are automatically caught up on restart.
        </p>
      </div>
    </div>
  );
}
