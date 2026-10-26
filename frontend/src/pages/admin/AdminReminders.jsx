import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { formatInAustralianTime } from "../../utils/dateUtils";

export default function AdminReminders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [reminders, setReminders] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
    dueAt: "",
    status: "pending",
  });
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
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", String(page));
      params.append("limit", "10");

      const res = await api.get(`/admin/reminders?${params.toString()}`);
      if (res.data?.success) {
        setReminders(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(
        "Failed to load reminders",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Toggle Complete / Pending
  const handleToggleStatus = async (r) => {
    const nextStatus = r.status === "completed" ? "pending" : "completed";
    try {
      const res = await api.patch(`/admin/reminders/${r._id}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        toast.success(
          nextStatus === "completed"
            ? "Marked Completed ✅"
            : "Marked Pending ⏳",
          `Reminder for ${r.name} updated.`,
        );
        setReminders((prev) =>
          prev.map((item) =>
            item._id === r._id ? { ...item, status: nextStatus } : item,
          ),
        );
      }
    } catch (err) {
      toast.error(
        "Update failed",
        err.response?.data?.message || "Server error",
      );
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (r) => {
    setEditingReminder(r);
    // Format date for datetime-local
    let dt = "";
    if (r.dueAt) {
      const d = new Date(r.dueAt);
      dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }
    setEditForm({
      name: r.name || "",
      phone: r.phone || "",
      email: r.email || "",
      note: r.note || "",
      dueAt: dt,
      status: r.status || "pending",
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

      const res = await api.patch(
        `/admin/reminders/${editingReminder._id}`,
        payload,
      );
      if (res.data?.success) {
        toast.success("Reminder Updated", "Changes saved successfully.");
        setEditModalOpen(false);
        fetchReminders();
      }
    } catch (err) {
      toast.error("Save failed", err.response?.data?.message || "Server error");
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
      toast.success(
        "Reminder Deleted",
        "The reminder has been permanently removed.",
      );
      setDeleteModalOpen(false);
      setReminders((prev) =>
        prev.filter((item) => item._id !== reminderToDelete._id),
      );
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      toast.error(
        "Delete failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const getPageNumbers = () => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", pages];
    }
    if (page >= pages - 3) {
      return [1, "...", pages - 4, pages - 3, pages - 2, pages - 1, pages];
    }
    return [1, "...", page - 1, page, page + 1, "...", pages];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 liquid-heading">
            <ListTodo className="w-6 h-6 text-amber-600" />
            <span>Global Reminders Monitor</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Real-time feed of all customer calls and follow-ups across all
            tenant accounts ({total} total).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReminders}
          className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-pill text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ios-glass p-4 rounded-2xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, phone, or note..."
            className="w-full pl-10 pr-4 py-2 ios-glass-input rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="completed">Completed Only</option>
            <option value="overdue">Overdue Only</option>
          </select>
        </div>
      </div>

      {/* Reminders Table & Mobile Cards */}
      <div className="ios-glass rounded-3xl overflow-hidden">
        {/* Mobile View: Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100/80">
          {reminders.length > 0 ? (
            reminders.map((r) => {
              const now = new Date();
              const isOverdue =
                r.status === "pending" && new Date(r.dueAt) < now;
              const ownerName =
                r.userId?.name ||
                r.userName ||
                r.userId?.email ||
                r.userEmail ||
                "Unknown";
              const ownerInitial = (ownerName || "U").charAt(0).toUpperCase();

              return (
                <div key={r._id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {r.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:${r.phone}`}
                          className="text-xs text-slate-600 font-mono inline-flex items-center gap-1 hover:text-slate-900"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{r.phone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        r.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                          : isOverdue
                            ? "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                            : "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          r.status === "completed"
                            ? "bg-emerald-500"
                            : isOverdue
                              ? "bg-rose-500"
                              : "bg-amber-500"
                        }`}
                      />
                      {r.status === "completed"
                        ? "Completed"
                        : isOverdue
                          ? "Overdue"
                          : "Pending"}
                    </span>
                  </div>

                  {r.note && (
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-slate-600 text-xs italic">
                      "{r.note}"
                    </div>
                  )}

                  {/* Owner & Schedule Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700 shadow-2xs">
                        {ownerInitial}
                      </div>
                      <span className="truncate max-w-30 text-slate-700 font-medium text-[11px]">
                        {ownerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {formatInAustralianTime(
                          r.dueAt,
                          r.timezone || "Asia/Kolkata",
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions Toolbar with min 38px touch targets */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <a
                      href={`tel:${r.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-600/20"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(r)}
                        className={`h-9 px-3 rounded-xl text-xs font-semibold border transition active:scale-90 cursor-pointer shadow-2xs ${
                          r.status === "completed"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {r.status === "completed" ? "Pending" : "Done"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="w-9 h-9 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-2xs transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Edit Reminder"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(r)}
                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 shadow-2xs transition flex items-center justify-center active:scale-90 cursor-pointer"
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
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              {loading ? "Loading reminders..." : "No reminders found."}
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-170">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Client / Reminder</th>
                <th className="py-3.5 px-4">Owner (User)</th>
                <th className="py-3.5 px-4">Due Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {reminders.length > 0 ? (
                reminders.map((r) => {
                  const now = new Date();
                  const isOverdue =
                    r.status === "pending" && new Date(r.dueAt) < now;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition">
                      {/* Customer / Reminder Details */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{r.phone}</span>
                          </p>
                          {r.note && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {r.note}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Owner Attribution */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 shadow-2xs shrink-0">
                            {(
                              r.userId?.name ||
                              r.userName ||
                              r.userId?.email ||
                              r.userEmail ||
                              "U"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {r.userId?.name || r.userName || "Account"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {r.userId?.email || r.userEmail || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Due Date & Time */}
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatInAustralianTime(
                              r.dueAt,
                              r.timezone || "Asia/Kolkata",
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                              : isOverdue
                                ? "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                                : "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === "completed"
                                ? "bg-emerald-500"
                                : isOverdue
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          {r.status === "completed"
                            ? "Completed"
                            : isOverdue
                              ? "Overdue"
                              : "Pending"}
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
                              r.status === "completed"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                            }`}
                            title={
                              r.status === "completed"
                                ? "Mark as Pending"
                                : "Mark as Completed"
                            }
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Edit Reminder */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Reminder */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    {loading ? "Loading reminders..." : "No reminders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-white/60 text-xs text-slate-500 font-medium">
            <div>
              Showing{" "}
              <span className="font-bold text-slate-900">
                {total === 0 ? 0 : (page - 1) * 10 + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-900">
                {Math.min(page * 10, total)}
              </span>{" "}
              of <span className="font-bold text-slate-900">{total}</span>{" "}
              reminders (10 per page)
            </div>

            {pages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-30 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1.5 py-1 text-slate-400 select-none"
                        >
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
                        className={`min-w-7 h-7 sm:min-w-8 sm:h-8 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20"
                            : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
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
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-30 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage(pages)}
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
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
      {/* EDIT REMINDER MODAL (iPhone Glass Sheet) */}
      {/* ======================================================== */}
      {editModalOpen && editingReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in">
          <div className="ios-glass-modal rounded-3xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>Edit Reminder (Admin Override)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editForm.dueAt}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dueAt: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Note / Agenda
                </label>
                <textarea
                  rows={3}
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm({ ...editForm, note: e.target.value })
                  }
                  className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE REMINDER CONFIRMATION (iPhone Glass Alert) */}
      {/* ======================================================== */}
      {deleteModalOpen && reminderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md animate-in fade-in">
          <div className="ios-glass-modal rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Delete Reminder?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Permanently delete reminder for{" "}
                <span className="text-slate-900 font-bold">
                  {reminderToDelete.name}
                </span>{" "}
                ({reminderToDelete.phone})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
