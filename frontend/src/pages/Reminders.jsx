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
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatKolkataTime } from '../utils/dateUtils';
import EditReminderModal from '../components/EditReminderModal';
import { playChimeSound } from '../utils/audioAlert';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState('all'); // all | pending | completed | overdue
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState(null);
  const notifiedIdsRef = useRef(new Set());

  const fetchReminders = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/reminders', { params });
      const list = res.data.data || [];
      setReminders(list);

      // Check for in-app desktop notifications (while website is open)
      checkDuePopups(list);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 30 seconds as specified in prompt
  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [filter, search]);

  const checkDuePopups = (list) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    list.forEach((r) => {
      const isDueNow = r.status === 'pending' && new Date(r.dueAt) <= now;
      if (isDueNow && !notifiedIdsRef.current.has(r._id)) {
        notifiedIdsRef.current.add(r._id);
        playChimeSound();
        try {
          new Notification(`📞 Call Due: ${r.name}`, {
            body: `Phone: ${r.phone} | Note: ${r.note || 'None'}\nDue: ${formatKolkataTime(r.dueAt)}`,
            icon: '/vite.svg',
          });
        } catch (e) {}
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

  const getStatusBadge = (r) => {
    if (r.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    }

    const isOverdue = r.isOverdue || (r.status === 'pending' && new Date(r.dueAt) < new Date());
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">All Reminders</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Times displayed in <span className="text-indigo-400 font-medium">Asia/Kolkata</span>. Desktop alerts check every 30s.
          </p>
        </div>
        <Link
          to="/add"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </Link>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
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
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4">Due Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {reminders.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/30 transition">
                    {/* Customer Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{r.name}</div>
                      <a
                        href={`tel:${r.phone}`}
                        className="text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{r.phone}</span>
                      </a>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {r.email ? (
                        <a href={`mailto:${r.email}`} className="hover:underline text-slate-400 truncate block max-w-[150px]">
                          {r.email}
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-[140px] truncate">
                      {r.address || <span className="text-slate-600">—</span>}
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-[180px]">
                      {r.note ? (
                        <p className="truncate italic text-slate-400" title={r.note}>{r.note}</p>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Due Date/Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-200">
                      <div className="font-medium">{formatKolkataTime(r.dueAt)}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(r)}
                    </td>

                    {/* Actions per row */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleCompleted(r)}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            r.status === 'completed'
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={r.status === 'completed' ? 'Mark as Pending' : 'Mark Completed'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setEditingReminder(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                          title="Edit Reminder"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(r._id, r.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {reminders.map((r) => (
              <div
                key={r._id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white">{r.name}</h3>
                    <a
                      href={`tel:${r.phone}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{r.phone}</span>
                    </a>
                  </div>
                  <div>{getStatusBadge(r)}</div>
                </div>

                <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatKolkataTime(r.dueAt)}</span>
                  </div>

                  {r.address && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{r.address}</span>
                    </div>
                  )}

                  {r.email && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <a href={`mailto:${r.email}`}>{r.email}</a>
                    </div>
                  )}

                  {r.note && (
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 text-[11px] italic mt-2">
                      "{r.note}"
                    </div>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${r.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleCompleted(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white transition"
                    >
                      {r.status === 'completed' ? 'Mark Pending' : 'Complete'}
                    </button>
                    <button
                      onClick={() => setEditingReminder(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(r._id, r.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
