import React, { useState, useEffect } from 'react';
import {
  Users,
  PhoneCall,
  BellRing,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Globe,
  ArrowRight,
  Volume2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useTimezone } from '../context/TimezoneContext';
import { formatInAustralianTz, formatTimeRelative } from '../utils/timezones';
import { playChimeSound, triggerDesktopNotification } from '../utils/audioAlert';
import CustomerModal from '../components/CustomerModal';
import ReminderModal from '../components/ReminderModal';
import CompleteCallModal from '../components/CompleteCallModal';

export default function Dashboard() {
  const { timezone, currentTzTime } = useTimezone();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeReminderForCompletion, setActiveReminderForCompletion] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/summary?timezone=${timezone}`);
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 20000); // 20s auto refresh
    return () => clearInterval(interval);
  }, [timezone]);

  const testChime = () => {
    playChimeSound();
    triggerDesktopNotification('Test Reminder Alert', 'The reminder chime and notification are working!');
  };

  const dueTodayList = summary?.dueToday || [];
  const overdueList = summary?.overdue || [];

  return (
    <div className="space-y-6">
      {/* Australian Timezone & Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/25 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Australia Region Active</span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-mono text-emerald-300">{timezone}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer Follow-up & Call Reminder System
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Track customer conversations, schedule telephone follow-ups in Australian local time, and never miss a quotation or callback.
            </p>
          </div>

          {/* Live Clock Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 min-w-[240px] flex items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                <Globe className="w-3.5 h-3.5" />
                <span>Local Time</span>
              </div>
              <p className="text-lg font-bold font-mono text-white mt-1">
                {currentTzTime || 'Loading...'}
              </p>
              <p className="text-[11px] text-slate-400">Day boundaries calculated in {timezone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Customers',
            count: summary?.totalCustomers ?? 0,
            icon: Users,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/25',
            link: '/customers',
          },
          {
            label: 'Calls Due Today',
            count: summary?.dueTodayCount ?? 0,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/25',
            link: '/reminders',
          },
          {
            label: 'Overdue Calls',
            count: summary?.overdueCount ?? 0,
            icon: AlertTriangle,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/25',
            link: '/reminders',
          },
          {
            label: 'Completed Calls',
            count: summary?.completedCount ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/25',
            link: '/reminders',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.link}
              className={`rounded-2xl border ${stat.border} ${stat.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{stat.count}</span>
                <span className="text-[11px] text-slate-500">records</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setReminderModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
        >
          <BellRing className="w-4 h-4" />
          <span>Schedule New Call Reminder</span>
        </button>

        <button
          onClick={() => setCustomerModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>

        <button
          onClick={testChime}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2 border border-slate-800 transition cursor-pointer"
          title="Test reminder audio sound and desktop alert"
        >
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span>Test Reminder Alert Sound</span>
        </button>
      </div>

      {/* Two Column Layout: Due Today & Overdue Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Due Today */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-semibold text-white">Calls Due Today</h3>
            </div>
            <span className="text-xs text-slate-400">{dueTodayList.length} scheduled</span>
          </div>

          {dueTodayList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No more calls due today in {timezone}. Great job!
            </div>
          ) : (
            <div className="space-y-3">
              {dueTodayList.map((r) => {
                const customer = r.customer || {};
                return (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-slate-300 font-medium">{customer.name}</span>
                        {customer.phone && (
                          <span className="font-mono text-indigo-300">&bull; {customer.phone}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-400 mt-1 font-mono">
                        Due: {formatInAustralianTz(r.dueAt, timezone, { year: undefined })} ({formatTimeRelative(r.dueAt)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-medium transition flex items-center gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setActiveReminderForCompletion(r);
                          setCompleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue Calls Alert Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-base font-semibold text-white">Overdue Calls</h3>
            </div>
            <span className="text-xs text-rose-400 font-semibold">{overdueList.length} action required</span>
          </div>

          {overdueList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Zero overdue calls! All customer follow-ups are up to date.
            </div>
          ) : (
            <div className="space-y-3">
              {overdueList.map((r) => {
                const customer = r.customer || {};
                return (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-500/40 transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{r.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                        <span className="font-medium">{customer.name}</span>
                        {customer.phone && (
                          <span className="font-mono text-rose-300">&bull; {customer.phone}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-rose-400 mt-1 font-semibold">
                        {formatTimeRelative(r.dueAt)} ({formatInAustralianTz(r.dueAt, timezone)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {customer.phone && (
                        <a
                          href={`tel:${customer.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setActiveReminderForCompletion(r);
                          setCompleteModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* How The Reminder System Works (Explainer Card) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BellRing className="w-4 h-4 text-indigo-400" />
          <span>How the Reminder System Works (Step-by-Step)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center mb-2">1</span>
            <p className="font-semibold text-slate-200">Schedule in Australian Time</p>
            <p className="text-slate-400">
              Pick your date and time in Sydney, Melbourne, Brisbane, Adelaide, or Perth. The system stores UTC in the database and computes local calendar days automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center mb-2">2</span>
            <p className="font-semibold text-slate-200">Dual Alerts (Audio & Worker)</p>
            <p className="text-slate-400">
              When due, the browser plays an audible chime and shows a sticky top banner. Meanwhile, the backend scheduler checks pending tasks every minute even if your browser is closed.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center mb-2">3</span>
            <p className="font-semibold text-slate-200">1-Click Calling & History</p>
            <p className="text-slate-400">
              Click the phone number to dial via <code>tel:</code> link. After the call, select the outcome (Answered, Busy, Callback Requested), add notes, and optionally auto-schedule the next follow-up.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSaved={fetchSummary}
      />

      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSaved={fetchSummary}
      />

      {completeModalOpen && activeReminderForCompletion && (
        <CompleteCallModal
          isOpen={completeModalOpen}
          reminder={activeReminderForCompletion}
          onClose={() => setActiveReminderForCompletion(null)}
          onCompleted={fetchSummary}
        />
      )}
    </div>
  );
}
