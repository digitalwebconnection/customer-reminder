import React, { useState, useEffect } from 'react';
import { BellRing, Plus, Calendar, Clock, Filter, Phone, CheckCircle2, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import ReminderModal from '../components/ReminderModal';
import CompleteCallModal from '../components/CompleteCallModal';
import SnoozeModal from '../components/SnoozeModal';
import { useTimezone } from '../context/TimezoneContext';
import { formatInAustralianTz, formatTimeRelative } from '../utils/timezones';

export default function Reminders() {
  const { timezone } = useTimezone();
  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [activeReminderForCompletion, setActiveReminderForCompletion] = useState(null);
  const [activeReminderForSnooze, setActiveReminderForSnooze] = useState(null);

  const fetchReminders = async (selectedFilter = filter) => {
    try {
      setLoading(true);
      const res = await api.get(`/reminders?due=${selectedFilter}&timezone=${timezone}`);
      setReminders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders(filter);
  }, [filter, timezone]);

  const handleCancelReminder = async (id, title) => {
    if (!window.confirm(`Cancel reminder "${title}"?`)) return;
    try {
      await api.post(`/reminders/${id}/cancel`);
      fetchReminders(filter);
    } catch (err) {
      alert('Failed to cancel reminder');
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
      default:
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Call Reminders</h2>
          <p className="text-sm text-slate-400">
            Calls scheduled in <span className="text-indigo-300 font-medium">{timezone}</span>. Background worker tracks due tasks every minute.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReminderModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Reminder</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Reminders' },
          { key: 'today', label: 'Due Today' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition whitespace-nowrap ${
              filter === tab.key
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminder List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading call reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No {filter !== 'all' ? filter : ''} reminders found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            Schedule a follow-up call with any Australian contact to keep leads warm.
          </p>
          <button
            onClick={() => setReminderModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => {
            const customer = r.customer || {};
            const isCompleted = r.status === 'completed';
            const isOverdue = r.isOverdue;

            return (
              <div
                key={r._id}
                className={`rounded-2xl border p-5 backdrop-blur-sm transition-all ${
                  isOverdue
                    ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                    : isCompleted
                    ? 'border-slate-800 bg-slate-900/30 opacity-75'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityStyle(r.priority)}`}>
                        {r.priority} Priority
                      </span>

                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Overdue</span>
                        </span>
                      )}

                      <span className="text-xs font-semibold text-white">{r.title}</span>
                    </div>

                    {/* Customer link & phone */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      <Link
                        to={`/customers/${customer._id || ''}`}
                        className="font-medium text-slate-200 hover:text-indigo-400 transition flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{customer.name || 'Unknown Contact'}</span>
                      </Link>

                      {customer.phone && (
                        <div className="flex items-center gap-1 font-mono text-indigo-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{customer.phone}</span>
                        </div>
                      )}

                      {customer.company && (
                        <span className="text-slate-500">&bull; {customer.company}</span>
                      )}
                    </div>

                    {r.notes && (
                      <p className="text-xs text-slate-400 pt-1 italic">
                        "{r.notes}"
                      </p>
                    )}

                    {isCompleted && r.completedOutcome && (
                      <div className="pt-1 text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Call Outcome: <strong>{r.completedOutcome}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Right: Date and Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-semibold text-slate-200 flex items-center lg:justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatInAustralianTz(r.dueAt, timezone)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isCompleted
                          ? `Completed on ${formatInAustralianTz(r.completedAt, timezone)}`
                          : formatTimeRelative(r.dueAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isCompleted && (
                      <div className="flex items-center gap-2">
                        {customer.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-medium transition flex items-center gap-1.5"
                            title="Call customer via phone dialer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}

                        <button
                          onClick={() => setActiveReminderForCompletion(r)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>

                        <button
                          onClick={() => setActiveReminderForSnooze(r)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                          title="Snooze or reschedule"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleCancelReminder(r._id, r.title)}
                          className="px-2 py-1.5 rounded-xl text-slate-500 hover:text-rose-400 text-xs transition"
                          title="Cancel reminder"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onSaved={() => fetchReminders(filter)}
      />

      {activeReminderForCompletion && (
        <CompleteCallModal
          isOpen={!!activeReminderForCompletion}
          reminder={activeReminderForCompletion}
          onClose={() => setActiveReminderForCompletion(null)}
          onCompleted={() => fetchReminders(filter)}
        />
      )}

      {activeReminderForSnooze && (
        <SnoozeModal
          isOpen={!!activeReminderForSnooze}
          reminder={activeReminderForSnooze}
          onClose={() => setActiveReminderForSnooze(null)}
          onSnoozed={() => fetchReminders(filter)}
        />
      )}
    </div>
  );
}
