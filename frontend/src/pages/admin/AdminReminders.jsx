import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListTodo,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Trash2,
  Edit2,
  Calendar,
  RefreshCw,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatInAustralianTime } from '../../utils/dateUtils';

export default function AdminReminders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [reminders, setReminders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', note: '', dueAt: '', status: 'pending' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', '10');

      const res = await api.get(`/admin/reminders?${params.toString()}`);
      if (res.data?.success) {
        setReminders(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error('Failed to load reminders', err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Toggle Complete / Pending
  const handleToggleStatus = async (r) => {
    const nextStatus = r.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.patch(`/admin/reminders/${r._id}`, { status: nextStatus });
      if (res.data?.success) {
        toast.success(
          nextStatus === 'completed' ? 'Marked Completed ✅' : 'Marked Pending ⏳',
          `Reminder for ${r.name} updated.`
        );
        setReminders((prev) =>
          prev.map((item) => (item._id === r._id ? { ...item, status: nextStatus } : item))
        );
      }
    } catch (err) {
      toast.error('Update failed', err.response?.data?.message || 'Server error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (r) => {
    setEditingReminder(r);
    // Format date for datetime-local
    let dt = '';
    if (r.dueAt) {
      const d = new Date(r.dueAt);
      dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    setEditForm({
      name: r.name || '',
      phone: r.phone || '',
      email: r.email || '',
      note: r.note || '',
      dueAt: dt,
      status: r.status || 'pending',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        note: editForm.note.trim(),
        status: editForm.status,
      };
      if (editForm.dueAt) {
        payload.dueAt = new Date(editForm.dueAt).toISOString();
      }

      const res = await api.patch(`/admin/reminders/${editingReminder._id}`, payload);
      if (res.data?.success) {
        toast.success('Reminder Updated', 'Changes saved successfully.');
        setEditModalOpen(false);
        fetchReminders();
      }
    } catch (err) {
      toast.error('Save failed', err.response?.data?.message || 'Server error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (r) => {
    setReminderToDelete(r);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/reminders/${reminderToDelete._id}`);
      toast.success('Reminder Deleted', 'The reminder has been permanently removed.');
      setDeleteModalOpen(false);
      setReminders((prev) => prev.filter((item) => item._id !== reminderToDelete._id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error('Delete failed', err.response?.data?.message || 'Server error');
    } finally {
      setDeleting(false);
    }
  };

  const getPageNumbers = () => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', pages];
    }
    if (page >= pages - 3) {
      return [1, '...', pages - 4, pages - 3, pages - 2, pages - 1, pages];
    }
    return [1, '...', page - 1, page, page + 1, '...', pages];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-amber-400" />
            <span>Global Reminders Monitor</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Real-time feed of all customer calls and follow-ups across all tenant accounts ({total} total).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReminders}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone, or note..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
            <option value="overdue">Overdue Only</option>
          </select>
        </div>
      </div>

      {/* Reminders Table & Mobile Cards */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Mobile View: Cards (< md) */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {reminders.length > 0 ? (
            reminders.map((r) => {
              const now = new Date();
              const isOverdue = r.status === 'pending' && new Date(r.dueAt) < now;
              const ownerName = r.userId?.name || r.userName || r.userId?.email || r.userEmail || 'Unknown';
              const ownerInitial = (ownerName || 'U').charAt(0).toUpperCase();

              return (
                <div key={r._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-zinc-100 truncate">{r.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:${r.phone}`}
                          className="text-xs text-zinc-300 font-mono inline-flex items-center gap-1 hover:text-white"
                        >
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{r.phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        r.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : isOverdue
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.status === 'completed'
                            ? 'bg-emerald-400'
                            : isOverdue
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                      />
                      {r.status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>

                  {r.note && (
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs italic">
                      "{r.note}"
                    </div>
                  )}

                  {/* Owner & Schedule Info */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[9px] text-zinc-300">
                        {ownerInitial}
                      </div>
                      <span className="truncate max-w-30 text-zinc-300 text-[11px]">
                        {ownerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{formatInAustralianTime(r.dueAt, r.timezone || 'Asia/Kolkata')}</span>
                    </div>
                  </div>

                  {/* Mobile Actions Toolbar with min 38px touch targets */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                    <a
                      href={`tel:${r.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-500/20"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(r)}
                        className={`h-9 px-3 rounded-xl text-xs font-semibold border transition active:scale-90 cursor-pointer ${
                          r.status === 'completed'
                            ? 'bg-zinc-800 text-amber-300 border-zinc-700'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {r.status === 'completed' ? 'Pending' : 'Done'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Edit Reminder"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(r)}
                        className="w-9 h-9 rounded-xl text-zinc-400 hover:text-rose-400 bg-zinc-800 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-900/50 transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              {loading ? 'Loading reminders...' : 'No reminders found.'}
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-170">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Client / Reminder</th>
                <th className="py-3.5 px-4">Owner (User)</th>
                <th className="py-3.5 px-4">Due Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {reminders.length > 0 ? (
                reminders.map((r) => {
                  const now = new Date();
                  const isOverdue = r.status === 'pending' && new Date(r.dueAt) < now;

                  return (
                    <tr key={r._id} className="hover:bg-zinc-800/40 transition">
                      {/* Customer / Reminder Details */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100 truncate">{r.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{r.phone}</span>
                          </p>
                          {r.note && (
                            <p className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                              {r.note}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Owner Attribution */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-300 shrink-0">
                            {(r.userId?.name || r.userName || r.userId?.email || r.userEmail || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-300 truncate">
                              {r.userId?.name || r.userName || 'Account'}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">
                              {r.userId?.email || r.userEmail || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Due Date & Time */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {formatInAustralianTime(r.dueAt, r.timezone || 'Asia/Kolkata')}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : isOverdue
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === 'completed'
                                ? 'bg-emerald-400'
                                : isOverdue
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          {r.status === 'completed'
                            ? 'Completed'
                            : isOverdue
                            ? 'Overdue'
                            : 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              r.status === 'completed'
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
                            }`}
                            title={r.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Edit Reminder */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Reminder */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(r)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Reminder"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    {loading ? 'Loading reminders...' : 'No reminders found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
            <div>
              Showing <span className="font-semibold text-white">{total === 0 ? 0 : (page - 1) * 10 + 1}</span> to{' '}
              <span className="font-semibold text-white">{Math.min(page * 10, total)}</span> of{' '}
              <span className="font-semibold text-white">{total}</span> reminders (10 per page)
            </div>

            {pages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800 transition cursor-pointer"
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-zinc-500 select-none">
                          …
                        </span>
                      );
                    }
                    const isCurrent = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`min-w-7 h-7 sm:min-w-8 sm:h-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-400 text-zinc-950 shadow-xs'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage(pages)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800 transition cursor-pointer"
                  title="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* EDIT REMINDER MODAL */}
      {/* ======================================================== */}
      {editModalOpen && editingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Reminder (Admin Override)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Customer Phone</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Customer Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.dueAt}
                  onChange={(e) => setEditForm({ ...editForm, dueAt: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Note / Agenda</label>
                <textarea
                  rows={3}
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE REMINDER CONFIRMATION */}
      {/* ======================================================== */}
      {deleteModalOpen && reminderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Delete Reminder?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Permanently delete reminder for <span className="text-white font-semibold">{reminderToDelete.name}</span> ({reminderToDelete.phone})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
