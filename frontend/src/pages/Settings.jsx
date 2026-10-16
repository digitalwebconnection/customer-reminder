import React from 'react';
import { Settings as SettingsIcon, Bell, Mail, Shield, Globe } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-400">Configure timezones, push notifications, and email alerts.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Timezone & Regional Settings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Timezone Configuration</h3>
          </div>
          <p className="text-xs text-slate-400">
            Current system timezone is set to <span className="text-indigo-300 font-medium">Asia/Kolkata (IST)</span>. All dates are stored in UTC in MongoDB and converted dynamically.
          </p>
        </div>

        {/* Browser Push & Email Notifications */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Notification Channels</h3>
          </div>
          <p className="text-xs text-slate-400">
            Web Push (VAPID) and Nodemailer transactional alerts will be hooked up in Step 7.
          </p>
        </div>
      </div>
    </div>
  );
}
