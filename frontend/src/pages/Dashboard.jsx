import React, { useState, useEffect } from 'react';
import { Users, PhoneCall, BellRing, CheckCircle2, Clock, ArrowUpRight, Activity } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setHealthData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / System Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Step 1 Setup Active
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Customer Follow-up & Call Reminder System
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Monorepo architecture with Express backend and Vite React frontend initialized. Ready for Step 2: Database & Mongoose models.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[220px]">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Health Endpoint</p>
              <p className="text-sm font-semibold text-slate-200">
                {loading ? 'Checking...' : healthData?.status === 'ok' ? 'Online (/api/v1/health)' : 'Backend Standby'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Skeleton Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', count: '0', icon: Users, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
          { label: 'Due Today', count: '0', icon: Clock, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
          { label: 'Overdue Calls', count: '0', icon: BellRing, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' },
          { label: 'Completed Calls', count: '0', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border ${stat.border} ${stat.bg} p-5 backdrop-blur-sm transition-all hover:border-slate-700`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{stat.count}</span>
                <span className="text-[11px] text-slate-500">records</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Checklist Preview */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-base font-semibold text-slate-200 mb-4">Milestone Progress</h3>
        <div className="space-y-3">
          {[
            { step: 'Step 1: Setup', desc: 'Monorepo (Express backend + Vite React Tailwind frontend), Health route /api/v1/health', done: true },
            { step: 'Step 2: Database + models', desc: 'Mongoose models (User, Customer, Reminder, CallLog, NotificationLog)', done: false },
            { step: 'Step 3: Single-user Auth', desc: 'Argon2id, HTTP-only JWT cookie, rate-limiting, owner seed script', done: false },
            { step: 'Step 4: Customer Management', desc: 'CRUD, archival, search, phone tel: links, add/edit form with Zod', done: false },
            { step: 'Step 5: Reminders & Call Logs', desc: 'Outcome tracking, next-reminder chaining, timeline', done: false },
            { step: 'Step 6: Dashboard Summary', desc: 'Asia/Kolkata boundary statistics, upcoming/overdue tabs', done: false },
            { step: 'Step 7: Notification Engine', desc: 'node-cron worker, Nodemailer, web-push with VAPID keys, retry queue', done: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                item.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {item.done ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.done ? 'text-emerald-300' : 'text-slate-300'}`}>{item.step}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
