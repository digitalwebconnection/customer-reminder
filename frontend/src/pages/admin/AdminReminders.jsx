import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  Loader2,
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
  const [limit, setLimit] = useState(10);
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
      params.append("limit", String(limit));

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
  }, [search, statusFilter, page, limit]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deleteModalOpen && !deleting) setDeleteModalOpen(false);
        if (editModalOpen && !savingEdit) setEditModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteModalOpen, deleting, editModalOpen, savingEdit]);

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

        {/* Desktop & Tablet View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x scrollbar-thin">
          <table className="w-full text-left text-xs min-w-175">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 whitespace-nowrap">Client / Reminder</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Owner (User)</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Due Date & Time</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {reminders.length > 0 ? (
                reminders.map((r) => {
                  const now = new Date();
                  const isOverdue =
                    r.status === "pending" && new Date(r.dueAt) < now;

                  return (
                    <tr key={r._id} className="smooth-row">
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
                            className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs ${
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
                            title="Edit Reminder"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Reminder */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
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

        {/* Complete Pagination Controls (Always visible for perfect UI balance) */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-white/60 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {total === 0 ? 0 : (page - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(page * limit, total)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{total}</span>{" "}
                reminders
              </span>

              <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-300/40">
                <span className="text-slate-500 hidden sm:inline">
                  Per page:
                </span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white/90 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer font-semibold shadow-2xs border border-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer active:scale-95"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer active:scale-95 text-xs font-semibold"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
              </div>

              {/* Compact Mobile Page Indicator */}
              <span className="sm:hidden text-xs font-bold text-slate-800 px-2 font-mono">
                {page} / {pages}
              </span>

              {/* Desktop Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-slate-400 select-none font-bold"
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
                      className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        isCurrent
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40"
                          : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer active:scale-95 text-xs font-semibold"
                  title="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage(pages)}
                  className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer active:scale-95"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* EDIT REMINDER MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {editModalOpen && editingReminder && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 select-none"
          >
            {/* Translucent backdrop with click-to-dismiss */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => {
                if (!savingEdit) setEditModalOpen(false);
              }}
            />

            {/* Liquid Glass Modal Card - Centered Dialog */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl liquid-glass-modal max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-4 shadow-2xl z-10"
            >
              {/* Close button in top-right corner */}
              <button
                type="button"
                onClick={() => {
                  if (!savingEdit) setEditModalOpen(false);
                }}
                disabled={savingEdit}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Centered Amber Edit Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Edit2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Centered Title & Description */}
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Edit Reminder
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Super Admin override for{" "}
                  <span className="font-semibold text-slate-800">
                    {editingReminder.name}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-1 text-xs text-left">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Customer Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Due Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editForm.dueAt}
                      onChange={(e) =>
                        setEditForm({ ...editForm, dueAt: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900 cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Follow-up Notes / Agenda
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.note}
                    onChange={(e) =>
                      setEditForm({ ...editForm, note: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-900 resize-none"
                  />
                </div>

                {/* Centered Action Buttons (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    disabled={savingEdit}
                    className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="w-full py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ======================================================== */}
      {/* DELETE REMINDER CONFIRMATION (Centered with Portal) */}
      {/* ======================================================== */}
      {deleteModalOpen && reminderToDelete && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 select-none"
          >
            {/* Translucent backdrop with click-to-dismiss */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => {
                if (!deleting) setDeleteModalOpen(false);
              }}
            />

            {/* Liquid Glass Modal Card - Centered Dialog */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl liquid-glass-modal shadow-2xl p-6 sm:p-7 text-slate-800 z-10 text-center space-y-4"
            >
              {/* Close button in top-right corner */}
              <button
                type="button"
                onClick={() => {
                  if (!deleting) setDeleteModalOpen(false);
                }}
                disabled={deleting}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Centered Crimson Warning Icon */}
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-300/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Centered Title & Description */}
              <div className="space-y-1.5 text-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Delete Customer Reminder?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium px-2">
                  Permanently delete reminder for{" "}
                  <span className="font-bold text-slate-900">
                    {reminderToDelete.name}
                  </span>{" "}
                  ({reminderToDelete.phone || reminderToDelete.email || "No contact info"})?
                </p>
              </div>

              {/* Centered Warning Box */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300/60 text-xs text-rose-800 leading-relaxed font-medium text-center space-y-1">
                <p className="font-bold text-rose-900 flex items-center justify-center gap-1.5">
                  <span>⚠️ Permanent Action</span>
                </p>
                <p className="text-[11.5px] text-rose-700">
                  This will permanently delete this customer reminder and cancel any scheduled SMS/WhatsApp dispatches. This cannot be undone.
                </p>
              </div>

              {/* Centered Action Buttons (Balanced 2-Column Grid) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleting}
                  className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleExecuteDelete}
                  className="w-full py-2.5 rounded-full bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Reminder</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
