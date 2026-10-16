import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Plus,
  Globe,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatInAustralianTime } from '../utils/dateUtils';
import EditReminderModal from '../components/EditReminderModal';
import { playChimeSound, startCallRingtone, stopCallRingtone } from '../utils/audioAlert';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState('all'); // all | pending | completed | overdue
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeDueAlert, setActiveDueAlert] = useState(null);
  const [alertSecondsLeft, setAlertSecondsLeft] = useState(60);
  const [isRingtoneMuted, setIsRingtoneMuted] = useState(false);
  const notifiedIdsRef = useRef(new Set());

  // Auto-refresh state (every 2 minutes = 120 seconds)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState(120);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Smooth Call Ringtone & 60-Second Countdown Timer for due reminder banner
  useEffect(() => {
    if (!activeDueAlert) {
      stopCallRingtone();
      return;
    }

    setAlertSecondsLeft(60);
    setIsRingtoneMuted(false);
    startCallRingtone(); // Play smooth, pleasant incoming phone call ring

    const timer = setInterval(() => {
      setAlertSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopCallRingtone();
          setActiveDueAlert(null); // Keep banner open for exactly 1 minute (60 seconds)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopCallRingtone();
    };
  }, [activeDueAlert]);

  const fetchReminders = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/reminders', { params });
      const list = res.data.data || [];
      setReminders(list);
      setLastRefreshedAt(new Date());

      // Check for in-app and desktop notifications
      checkDuePopups(list);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  // Immediate fetch on filter or search change + reset 2-minute timer
  useEffect(() => {
    fetchReminders();
    setRefreshSecondsLeft(120);
  }, [filter, search]);

  // 2-Minute (120 seconds) Auto-Refresh Countdown & Execution
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setRefreshSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchReminders(true);
          return 120; // reset to 2 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, filter, search]);

  // Secondary 15s in-memory check so due alerts fire on the exact minute
  useEffect(() => {
    const localTimer = setInterval(() => {
      checkDuePopups(reminders);
    }, 15000);
    return () => clearInterval(localTimer);
  }, [reminders]);

  const handleManualRefresh = () => {
    fetchReminders(true);
    setRefreshSecondsLeft(120);
  };

  const formatSecondsLeft = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const checkDuePopups = (list) => {
    const now = new Date();
    list.forEach((r) => {
      const isDueNow = r.status === 'pending' && new Date(r.dueAt) <= now;
      if (isDueNow && !notifiedIdsRef.current.has(r._id)) {
        notifiedIdsRef.current.add(r._id);

        // In-App Call Alert Banner (Displays for 1 minute & rings smoothly)
        setActiveDueAlert(r);

        // 3. Desktop OS Notification (if browser permission granted)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const tz = r.timezone || 'Australia/Sydney';
            new Notification(`📞 Call Due: ${r.name}`, {
              body: `Phone: ${r.phone} | Due: ${formatInAustralianTime(r.dueAt, tz)}\nNote: ${r.note || 'None'}`,
              icon: '/favicon.svg',
            });
          } catch (e) { }
        }
      }
    });
  };

  const handleToggleCompleted = async (reminder) => {
    const newStatus = reminder.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/reminders/${reminder._id}`, { status: newStatus });
      fetchReminders();
    } catch (err) {
      alert('Failed to update reminder status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the reminder for ${name}?`)) return;
    try {
      await api.delete(`/reminders/${id}`);
      fetchReminders();
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const counts = {
    all: reminders.length,
    pending: reminders.filter((r) => r.status === 'pending' && !(r.isOverdue || new Date(r.dueAt) < new Date())).length,
    completed: reminders.filter((r) => r.status === 'completed').length,
    overdue: reminders.filter((r) => r.status === 'pending' && (r.isOverdue || new Date(r.dueAt) < new Date())).length,
  };

  const getStatusBadge = (r) => {
    if (r.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Completed</span>
        </span>
      );
    }

    const isOverdue = r.isOverdue || (r.status === 'pending' && new Date(r.dueAt) < new Date());
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Overdue</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Real-time In-App Due Call Notification Banner (Displays for 1 minute) */}
      {activeDueAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-slate-950 border-2 border-rose-500/60 shadow-2xl animate-fade-in flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl">
          {/* 60-Second Animated Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(alertSecondsLeft / 60) * 100}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white flex-shrink-0 animate-bounce shadow-lg shadow-rose-600/30">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    📞 Call Due Now
                  </span>
                  <span className="text-base font-bold text-white">{activeDueAlert.name}</span>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    ⏱️ Showing for 1 min: {alertSecondsLeft}s left
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  Phone: <span className="font-semibold text-rose-300">{activeDueAlert.phone}</span> | Scheduled: {formatInAustralianTime(activeDueAlert.dueAt, activeDueAlert.timezone || 'Australia/Sydney')}
                </p>
                {activeDueAlert.note && (
                  <p className="text-[11px] text-slate-400 italic mt-0.5">"{activeDueAlert.note}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0 flex-wrap">
              {/* Mute/Unmute Smooth Ringtone Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isRingtoneMuted) {
                    startCallRingtone();
                    setIsRingtoneMuted(false);
                  } else {
                    stopCallRingtone();
                    setIsRingtoneMuted(true);
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 shadow-sm cursor-pointer"
                title={isRingtoneMuted ? 'Turn ringtone back on' : 'Silence ringtone'}
              >
                {isRingtoneMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>Mute Ring</span>
                  </>
                )}
              </button>

              <a
                href={`tel:${activeDueAlert.phone}`}
                onClick={() => {
                  stopCallRingtone();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
              <button
                onClick={() => {
                  stopCallRingtone();
                  handleToggleCompleted(activeDueAlert);
                  setActiveDueAlert(null);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Complete
              </button>
              <button
                onClick={() => {
                  stopCallRingtone();
                  setActiveDueAlert(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header, Auto-refresh indicator, and Add button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">All Reminders</h1>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full">
              Live Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Scheduled follow-ups formatted in customer's Australian regional timezone. Auto-refreshes every 2m.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Manual Instant Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold transition border border-white/[0.08] shadow-sm cursor-pointer disabled:opacity-60"
            title="Refresh reminders from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/add"
            className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs with Dynamic Counters */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/[0.08] shadow-inner self-start">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'overdue', label: 'Overdue' },
          ].map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-white/[0.08] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition shadow-inner"
          />
        </div>
      </div>

      {/* Content: Table on Desktop / Cards on Mobile */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No reminders found</p>
          <p className="text-xs text-slate-500">
            {search ? 'No reminders match your search.' : 'Add your first call reminder to get started.'}
          </p>
          <Link
            to="/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[880px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Note</th>
                  <th className="py-3.5 px-4">Due Date & Time (AU)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {reminders.map((r) => {
                  const tz = r.timezone || 'Australia/Sydney';
                  const initials = (r.name || 'C')
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Customer Name & Phone */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-white transition">
                              {r.name}
                            </div>
                            <a
                              href={`tel:${r.phone}`}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 font-mono text-[11px] border border-indigo-500/20 transition mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>{r.phone}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Contact / Email */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {r.email ? (
                          <a
                            href={`mailto:${r.email}`}
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 transition"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{r.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {r.address ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{r.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {r.note ? (
                          <div
                            className="px-2.5 py-1 rounded-lg bg-slate-950/40 border border-white/[0.05] text-slate-300 text-[11px] italic truncate max-w-[180px]"
                            title={r.note}
                          >
                            "{r.note}"
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Due Date/Time in Australia Timezone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/50 border border-white/[0.06] font-mono text-xs text-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(r)}
                      </td>

                      {/* Actions per row */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleCompleted(r)}
                            className={`p-1.5 rounded-lg text-xs transition border border-white/[0.06] ${
                              r.status === 'completed'
                                ? 'text-amber-400 hover:bg-amber-500/15 border-amber-500/30'
                                : 'text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/30'
                            }`}
                            title={r.status === 'completed' ? 'Mark as Pending' : 'Mark Completed'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingReminder(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/[0.06] border border-white/[0.06] transition"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(r._id, r.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-white/[0.06] hover:border-rose-500/30 transition"
                            title="Delete Reminder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {reminders.map((r) => {
              const tz = r.timezone || 'Australia/Sydney';
              const initials = (r.name || 'C')
                .split(' ')
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={r._id}
                  className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{r.name}</h3>
                        <a
                          href={`tel:${r.phone}`}
                          className="text-xs text-indigo-300 hover:text-indigo-200 font-mono inline-flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{r.phone}</span>
                        </a>
                      </div>
                    </div>
                    <div>{getStatusBadge(r)}</div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-mono bg-slate-950/40 px-2.5 py-1 rounded-lg border border-white/[0.04]">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                    </div>

                    {r.address && (
                      <div className="flex items-center gap-1.5 text-slate-400 px-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{r.address}</span>
                      </div>
                    )}

                    {r.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 px-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <a href={`mailto:${r.email}`} className="hover:text-indigo-300 truncate">{r.email}</a>
                      </div>
                    )}

                    {r.note && (
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.05] text-slate-300 text-[11px] italic mt-2">
                        "{r.note}"
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <a
                      href={`tel:${r.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleCompleted(r)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-200 border border-white/[0.06] transition"
                      >
                        {r.status === 'completed' ? 'Mark Pending' : 'Complete'}
                      </button>
                      <button
                        onClick={() => setEditingReminder(r)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-300 bg-white/[0.06] border border-white/[0.06]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r._id, r.name)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 bg-white/[0.06] border border-white/[0.06]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <EditReminderModal
          isOpen={!!editingReminder}
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSaved={fetchReminders}
        />
      )}
    </div>
  );
}
