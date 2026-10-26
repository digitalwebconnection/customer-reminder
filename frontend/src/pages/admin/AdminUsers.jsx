import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  Phone,
  ListTodo,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Edit2,
  Plus,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import DeleteReminderModal from "../../components/modals/DeleteReminderModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [isDeletingReminder, setIsDeletingReminder] = useState(false);

  // Edit User (Name, Phone)
  const [editUserModal, setEditUserModal] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [savingUserEdit, setSavingUserEdit] = useState(false);

  // Add Reminder for User
  const [addReminderModal, setAddReminderModal] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    dueAt: "",
  });
  const [savingNewReminder, setSavingNewReminder] = useState(false);

  // Password Reset
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [sendEmailLink, setSendEmailLink] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Delete User
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const toast = useToast();
  const { user: currentAdmin } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (roleFilter) params.append("role", roleFilter);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(
        "Failed to load users",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getPageNumbers = () => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }
    if (page <= 4) {
      return [1, 2, 3, 4, 5, "...", pages];
    }
    if (page >= pages - 3) {
      return [
        1,
        "...",
        pages - 4,
        pages - 3,
        pages - 2,
        pages - 1,
        pages,
      ];
    }
    return [
      1,
      "...",
      page - 1,
      page,
      page + 1,
      "...",
      pages,
    ];
  };

  // Toggle user active / blocked
  const handleToggleBlock = async (user) => {
    if (user.role === "superadmin") {
      toast.warning(
        "Protected Account",
        "The Super Admin account cannot be blocked.",
      );
      return;
    }

    try {
      const res = await api.patch(`/admin/users/${user._id}/block`);
      if (res.data?.success) {
        toast.success(
          res.data.data.isActive ? "User Unblocked 🟢" : "User Blocked 🔴",
          `${user.name || user.email} is now ${res.data.data.isActive ? "active" : "suspended"}.`,
        );
        // Optimistic local update
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isActive: res.data.data.isActive } : u,
          ),
        );
        if (selectedUser?._id === user._id) {
          setSelectedUser((prev) => ({
            ...prev,
            isActive: res.data.data.isActive,
          }));
        }
      }
    } catch (err) {
      toast.error(
        "Action failed",
        err.response?.data?.message || "Server error",
      );
    }
  };

  // Open Details Modal with fresh data fetch
  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setUserDetailsData(null);
    setViewDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      if (res.data?.success) {
        setUserDetailsData(res.data.data);
      }
    } catch (err) {
      toast.error(
        "Failed to load details",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // Refresh user details inside modal
  const handleRefreshDetails = async () => {
    if (!selectedUser) return;
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${selectedUser._id}`);
      if (res.data?.success) {
        setUserDetailsData(res.data.data);
        toast.success(
          "Telemetry Refreshed",
          "User data and reminders updated.",
        );
      }
    } catch (err) {
      toast.error(
        "Refresh failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user) => {
    setSelectedUser(user);
    setEditUserName(user.name || "");
    setEditUserPhone(user.phone || "");
    setEditUserModal(true);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editUserName.trim()) {
      toast.error("Name required", "Please provide a valid name.");
      return;
    }

    setSavingUserEdit(true);
    try {
      const res = await api.patch(`/admin/users/${selectedUser._id}`, {
        name: editUserName.trim(),
        phone: editUserPhone.trim(),
      });
      if (res.data?.success) {
        toast.success(
          "Profile Saved",
          "User information updated successfully.",
        );
        const updated = res.data.data;
        setUsers((prev) =>
          prev.map((u) =>
            u._id === selectedUser._id
              ? { ...u, name: updated.name, phone: updated.phone }
              : u,
          ),
        );
        setSelectedUser((prev) => ({
          ...prev,
          name: updated.name,
          phone: updated.phone,
        }));
        if (userDetailsData?.user) {
          setUserDetailsData((prev) => ({
            ...prev,
            user: { ...prev.user, name: updated.name, phone: updated.phone },
          }));
        }
        setEditUserModal(false);
      }
    } catch (err) {
      toast.error(
        "Update failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setSavingUserEdit(false);
    }
  };

  // Open Add Reminder for User
  const handleOpenAddReminder = (user) => {
    setSelectedUser(user);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const dt = new Date(
      tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    setNewReminderForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      note: "",
      dueAt: dt,
    });
    setAddReminderModal(true);
  };

  const handleSaveNewReminder = async (e) => {
    e.preventDefault();
    if (
      !newReminderForm.name.trim() ||
      !newReminderForm.phone.trim() ||
      !newReminderForm.dueAt
    ) {
      toast.error(
        "Validation Error",
        "Customer Name, Phone, and Due Date are required.",
      );
      return;
    }

    setSavingNewReminder(true);
    try {
      const res = await api.post(
        `/admin/users/${selectedUser._id}/reminders`,
        newReminderForm,
      );
      if (res.data?.success) {
        toast.success(
          "Reminder Created",
          `Added follow-up for ${selectedUser.name || selectedUser.email}`,
        );
        setAddReminderModal(false);
        fetchUsers();
        if (viewDetailsModal) {
          handleRefreshDetails();
        }
      }
    } catch (err) {
      toast.error(
        "Creation failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setSavingNewReminder(false);
    }
  };

  // Toggle Reminder Status from User Modal
  const handleToggleReminderStatus = async (reminder) => {
    const nextStatus =
      reminder.status === "completed" ? "pending" : "completed";
    try {
      const res = await api.patch(`/admin/reminders/${reminder._id}`, {
        status: nextStatus,
      });
      if (res.data?.success) {
        toast.success(
          nextStatus === "completed"
            ? "Marked Completed ✅"
            : "Marked Pending ⏳",
          `Reminder for ${reminder.name} updated.`,
        );
        setUserDetailsData((prev) => {
          if (!prev) return prev;
          const updatedReminders = prev.reminders.map((r) =>
            r._id === reminder._id
              ? { ...r, status: nextStatus, isOverdue: false }
              : r,
          );
          const pendingCount = updatedReminders.filter(
            (r) => r.status === "pending",
          ).length;
          const completedCount = updatedReminders.filter(
            (r) => r.status === "completed",
          ).length;
          return {
            ...prev,
            reminders: updatedReminders,
            stats: {
              ...prev.stats,
              pending: pendingCount,
              completed: completedCount,
            },
          };
        });
      }
    } catch (err) {
      toast.error(
        "Update failed",
        err.response?.data?.message || "Server error",
      );
    }
  };

  // Delete Reminder from User Modal
  const handleConfirmDeleteReminder = async () => {
    if (!reminderToDelete) return;
    const reminderId = reminderToDelete._id;
    setIsDeletingReminder(true);
    try {
      const res = await api.delete(`/admin/reminders/${reminderId}`);
      if (res.data?.success) {
        toast.success("Reminder Removed", "Record deleted permanently.");
        setUserDetailsData((prev) => {
          if (!prev) return prev;
          const updatedReminders = prev.reminders.filter(
            (r) => r._id !== reminderId,
          );
          const pendingCount = updatedReminders.filter(
            (r) => r.status === "pending",
          ).length;
          const completedCount = updatedReminders.filter(
            (r) => r.status === "completed",
          ).length;
          return {
            ...prev,
            reminders: updatedReminders,
            stats: {
              ...prev.stats,
              total: Math.max(0, (prev.stats?.total || 1) - 1),
              pending: pendingCount,
              completed: completedCount,
            },
          };
        });
        fetchUsers();
        setReminderToDelete(null);
      }
    } catch (err) {
      toast.error(
        "Delete Failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setIsDeletingReminder(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setSendEmailLink(false);
    setResetPasswordModal(true);
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    if (!sendEmailLink && newPassword.length < 6) {
      toast.error(
        "Invalid Password",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    setResettingPassword(true);
    try {
      const payload = sendEmailLink ? {} : { newPassword };
      const res = await api.post(
        `/admin/users/${selectedUser._id}/reset-password`,
        payload,
      );
      toast.success(
        "Password Updated",
        res.data?.message || "Operation succeeded.",
      );
      setResetPasswordModal(false);
    } catch (err) {
      toast.error(
        "Reset failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setResettingPassword(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (targetUser) => {
    if (
      targetUser._id === currentAdmin?.id ||
      targetUser.email === "vaibhavdigitalwebconnection@gmail.com"
    ) {
      toast.warning("Forbidden", "Cannot delete the primary Super Admin account.");
      return;
    }
    setSelectedUser(targetUser);
    setDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    setDeletingUser(true);
    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      toast.success(
        "User Deleted",
        `Account and all associated records deleted.`,
      );
      setDeleteModal(false);
      if (viewDetailsModal && selectedUser?._id === selectedUser._id) {
        setViewDetailsModal(false);
      }
      fetchUsers();
    } catch (err) {
      toast.error(
        "Delete failed",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setDeletingUser(false);
    }
  };

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (deleteModal && !deletingUser) setDeleteModal(false);
        if (editUserModal && !savingUserEdit) setEditUserModal(false);
        if (resetPasswordModal && !resettingPassword) setResetPasswordModal(false);
        if (addReminderModal && !savingNewReminder) setAddReminderModal(false);
        if (viewDetailsModal) setViewDetailsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    deleteModal,
    deletingUser,
    editUserModal,
    savingUserEdit,
    resetPasswordModal,
    resettingPassword,
    addReminderModal,
    savingNewReminder,
    viewDetailsModal,
  ]);

  const displayUser = userDetailsData?.user || selectedUser;

  return (
    <div className="space-y-6">
      {/* Page Title & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 liquid-heading">
            <Users className="w-6 h-6 text-amber-500" />
            <span>User Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Browse all user accounts ({total} total registered), monitor
            reminders, and update account settings.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-pill text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 ios-glass p-3.5 sm:p-4 rounded-2xl">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 ios-glass-input rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none transition"
          />
        </div>

        {/* Status Filter */}
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
            <option value="active">Active Only</option>
            <option value="blocked">Blocked / Suspended Only</option>
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none transition cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table & Mobile Cards */}
      <div className="ios-glass rounded-3xl overflow-hidden">
        {/* Mobile View: User Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100/80">
          {users.length > 0 ? (
            users.map((u) => {
              const initial = (u.name || u.email || "U")
                .charAt(0)
                .toUpperCase();
              const isCurrent = currentAdmin?.id === u._id;

              return (
                <div key={u._id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700 shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <span>{u.name || "Unnamed"}</span>
                          {isCurrent && (
                            <span className="text-[10px] text-amber-600 font-mono font-bold">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {u.email}
                        </p>
                        {u.phone && (
                          <a
                            href={`tel:${u.phone}`}
                            className="text-[11px] text-slate-600 font-mono inline-flex items-center gap-1 mt-0.5 hover:text-slate-900"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {u.role === "superadmin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                          <Shield className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                          User
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                            : "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Metadata Row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono">
                    <span className="text-[11px]">
                      Reminders:{" "}
                      <span className="font-bold text-slate-900">
                        {u.remindersCount ?? 0}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Actions Toolbar with 38px touch targets */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(u)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-9.5 active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition flex items-center justify-center active:scale-90 cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenResetPassword(u)}
                      className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-amber-600 border border-slate-200 shadow-2xs transition flex items-center justify-center active:scale-90 cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {u.role !== "superadmin" && (
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(u)}
                        className={`w-9 h-9 rounded-xl transition flex items-center justify-center active:scale-90 cursor-pointer shadow-2xs border ${
                          u.isActive
                            ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title={u.isActive ? "Block User" : "Unblock User"}
                      >
                        {u.isActive ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {u.role !== "superadmin" && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(u)}
                        className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 shadow-2xs transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              {loading
                ? "Loading users..."
                : "No users match your search criteria."}
            </div>
          )}
        </div>

        {/* Desktop & Tablet View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x scrollbar-thin">
          <table className="w-full text-left text-xs min-w-175">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 whitespace-nowrap">User</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Reminders</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Joined Date</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {users.length > 0 ? (
                users.map((u) => {
                  const initial = (u.name || u.email || "U")
                    .charAt(0)
                    .toUpperCase();
                  const isCurrent = currentAdmin?.id === u._id;

                  return (
                    <tr key={u._id} className="smooth-row">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs shrink-0 transition-transform duration-200 group-hover:scale-105">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{u.name || "Unnamed"}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-amber-600 font-mono font-bold">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              {u.email}
                            </p>
                            {u.phone ? (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{u.phone}</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">
                                No phone provided
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {u.role === "superadmin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                            <Shield className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                              : "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {u.isActive ? "Active" : "Blocked"}
                        </span>
                      </td>

                      {/* Reminder Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-800 font-bold shadow-2xs">
                          {u.reminderCount ?? 0}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end min-w-40">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
                            title="View User Details & Reminders"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit User Profile (Name, Phone) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Block / Unblock Toggle */}
                          {!isCurrent && u.email !== "vaibhavdigitalwebconnection@gmail.com" && (
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs ${
                                u.isActive
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-rose-600 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.isActive ? "Block User" : "Unblock User"}
                            >
                              {u.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete Account */}
                          {!isCurrent && u.email !== "vaibhavdigitalwebconnection@gmail.com" && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xs"
                              title="Delete User and Associated Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {loading
                      ? "Loading users..."
                      : "No users match your search criteria."}
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
                users
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
      {/* 1. USER DETAILS & TELEMETRY MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {viewDetailsModal && selectedUser && typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-9999 flex items-center justify-center p-3 sm:p-4 select-none"
          >
            {/* Translucent backdrop with click-to-dismiss */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => setViewDetailsModal(false)}
            />

            <div
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-3xl liquid-glass-modal max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden z-10"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-base font-bold text-slate-800 shadow-2xs">
                  {(displayUser.name || displayUser.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {displayUser.name || "User Details"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(displayUser)}
                      className="p-1 rounded text-slate-400 hover:text-amber-600 transition"
                      title="Edit User Info"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    {displayUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefreshDetails}
                  disabled={loadingDetails}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  title="Refresh User Telemetry"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingDetails ? "animate-spin text-amber-600" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDetailsModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {loadingDetails && !userDetailsData ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">
                    Fetching real-time user data and reminders...
                  </span>
                </div>
              ) : (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-center shadow-2xs">
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Total Reminders
                      </p>
                      <p className="text-2xl font-extrabold text-slate-900 mt-1">
                        {userDetailsData?.stats?.total ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-center shadow-2xs">
                      <p className="text-[11px] text-amber-700 font-semibold">
                        Pending
                      </p>
                      <p className="text-2xl font-extrabold text-amber-600 mt-1">
                        {userDetailsData?.stats?.pending ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-center shadow-2xs">
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        Completed
                      </p>
                      <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                        {userDetailsData?.stats?.completed ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Contact & Status details */}
                  <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone:</span>
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {displayUser.phone ? (
                          displayUser.phone
                        ) : (
                          <span className="text-slate-400 italic">
                            None provided
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account Role:</span>
                      </span>
                      <span className="text-slate-800 capitalize font-semibold">
                        {displayUser.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Status:</span>
                      </span>
                      <span
                        className={
                          displayUser.isActive
                            ? "text-emerald-600 font-bold"
                            : "text-rose-600 font-bold"
                        }
                      >
                        {displayUser.isActive
                          ? "Active 🟢"
                          : "Blocked / Suspended 🔴"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Registered:</span>
                      </span>
                      <span className="text-slate-700 font-mono">
                        {new Date(displayUser.createdAt).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(displayUser)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
                      >
                        <Edit2 className="w-3 h-3 text-amber-600" />
                        <span>Edit Name & Phone</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Reminders List */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 min-w-0">
                        <ListTodo className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">
                          Recent Reminders Created by this User (
                          {userDetailsData?.reminders?.length || 0})
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenAddReminder(displayUser)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100 shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Reminder for User</span>
                      </button>
                    </div>

                    {userDetailsData?.reminders &&
                    userDetailsData.reminders.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {userDetailsData.reminders.map((r) => (
                          <div
                            key={r._id}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 shadow-2xs transition"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-bold text-slate-900 truncate">
                                {r.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono text-slate-700 font-medium">
                                  {r.phone}
                                </span>
                                {r.note && (
                                  <span className="text-slate-400 truncate max-w-xs">
                                    • {r.note}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    r.status === "completed"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
                                      : r.isOverdue
                                        ? "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                                        : "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs"
                                  }`}
                                >
                                  {r.status === "completed"
                                    ? "Completed"
                                    : r.isOverdue
                                      ? "Overdue"
                                      : "Pending"}
                                </span>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">
                                  {new Date(r.dueAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </p>
                              </div>

                              {/* Toggle Completed */}
                              <button
                                type="button"
                                onClick={() => handleToggleReminderStatus(r)}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  r.status === "completed"
                                    ? "text-emerald-600 hover:bg-emerald-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                                }`}
                                title={
                                  r.status === "completed"
                                    ? "Mark Pending"
                                    : "Mark Completed"
                                }
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              {/* Delete Reminder */}
                              <button
                                type="button"
                                onClick={() => setReminderToDelete(r)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Delete Reminder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                        <p className="text-xs text-slate-500 font-medium">
                          No reminders found for this user.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddReminder(displayUser)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Reminder</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-white/60">
              <button
                type="button"
                onClick={() => setViewDetailsModal(false)}
                className="px-5 py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ======================================================== */}
      {/* 2. EDIT USER (NAME, PHONE) MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {editUserModal && selectedUser && typeof document !== "undefined" &&
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
                if (!savingUserEdit) setEditUserModal(false);
              }}
            />

            {/* Liquid Glass Modal Card - Centered Dialog */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl liquid-glass-modal shadow-2xl p-6 sm:p-7 text-slate-800 z-10 space-y-4"
            >
              {/* Close button in top-right corner */}
              <button
                type="button"
                onClick={() => {
                  if (!savingUserEdit) setEditUserModal(false);
                }}
                disabled={savingUserEdit}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Centered Indigo Edit Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-300/60 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <Edit2 className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Centered Title & Description */}
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Edit User Information
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Update contact info for{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedUser.email}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-3.5 pt-1">
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                  />
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                  />
                </div>

                {/* Centered Action Buttons (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditUserModal(false)}
                    disabled={savingUserEdit}
                    className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUserEdit}
                    className="w-full py-2.5 rounded-full bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savingUserEdit ? (
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
      {/* 3. ADD REMINDER FOR USER MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {addReminderModal && selectedUser && typeof document !== "undefined" &&
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
                if (!savingNewReminder) setAddReminderModal(false);
              }}
            />

            {/* Liquid Glass Modal Card - Centered Dialog */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl liquid-glass-modal shadow-2xl p-6 sm:p-7 text-slate-800 z-10 space-y-4"
            >
              {/* Close button in top-right corner */}
              <button
                type="button"
                onClick={() => {
                  if (!savingNewReminder) setAddReminderModal(false);
                }}
                disabled={savingNewReminder}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Centered Amber List Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <ListTodo className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Centered Title & Description */}
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Create Reminder for User
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Visible to{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedUser.name || selectedUser.email}
                  </span>
                </p>
              </div>

              <form onSubmit={handleSaveNewReminder} className="space-y-3.5 pt-1 text-left text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReminderForm.name}
                      onChange={(e) =>
                        setNewReminderForm({
                          ...newReminderForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Customer Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newReminderForm.phone}
                      onChange={(e) =>
                        setNewReminderForm({
                          ...newReminderForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={newReminderForm.email}
                      onChange={(e) =>
                        setNewReminderForm({
                          ...newReminderForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="customer@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Due Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={newReminderForm.dueAt}
                      onChange={(e) =>
                        setNewReminderForm({
                          ...newReminderForm,
                          dueAt: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Follow-up Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newReminderForm.note}
                    onChange={(e) =>
                      setNewReminderForm({
                        ...newReminderForm,
                        note: e.target.value,
                      })
                    }
                    placeholder="Details about customer requirements, discussion points..."
                    className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium resize-none"
                  />
                </div>

                {/* Centered Action Buttons (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddReminderModal(false)}
                    disabled={savingNewReminder}
                    className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNewReminder}
                    className="w-full py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savingNewReminder ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Reminder</span>
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
      {/* 4. RESET PASSWORD MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {resetPasswordModal && selectedUser && typeof document !== "undefined" &&
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
                if (!resettingPassword) setResetPasswordModal(false);
              }}
            />

            {/* Liquid Glass Modal Card - Centered Dialog */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl liquid-glass-modal shadow-2xl p-6 sm:p-7 text-slate-800 z-10 space-y-4 text-center"
            >
              {/* Close button in top-right corner */}
              <button
                type="button"
                onClick={() => {
                  if (!resettingPassword) setResetPasswordModal(false);
                }}
                disabled={resettingPassword}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full liquid-glass-pill transition cursor-pointer active:scale-95 disabled:opacity-40"
                title="Cancel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Centered Amber Key Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-300/60 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <KeyRound className="w-7 h-7 stroke-[2.2]" />
              </div>

              {/* Centered Title & Description */}
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Reset User Password
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Reset credentials for{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedUser.name || selectedUser.email}
                  </span>
                </p>
              </div>

              <form onSubmit={handleExecutePasswordReset} className="space-y-3.5 pt-1 text-left">
                <div className="p-3 rounded-2xl liquid-glass-pill">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmailLink}
                      onChange={(e) => setSendEmailLink(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400/20 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      Send reset email link to user instead of manual password
                    </span>
                  </label>
                </div>

                {!sendEmailLink && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Direct New Password *
                    </label>
                    <input
                      type="text"
                      required={!sendEmailLink}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-3.5 py-2.5 rounded-xl liquid-glass-input text-xs font-medium"
                    />
                  </div>
                )}

                {/* Centered Action Buttons (Balanced 2-Column Grid) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal(false)}
                    disabled={resettingPassword}
                    className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="w-full py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {resettingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : sendEmailLink ? (
                      <span>Dispatch Email</span>
                    ) : (
                      <span>Set Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ======================================================== */}
      {/* 5. DELETE USER CONFIRMATION MODAL (Centered with Portal) */}
      {/* ======================================================== */}
      {deleteModal && selectedUser && typeof document !== "undefined" &&
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
                if (!deletingUser) setDeleteModal(false);
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
                  if (!deletingUser) setDeleteModal(false);
                }}
                disabled={deletingUser}
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
                  Delete User Account?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium px-2">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-slate-900">
                    {selectedUser.name || "this user"}
                  </span>{" "}
                  ({selectedUser.email})?
                </p>
              </div>

              {/* Centered Warning Box */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-300/60 text-xs text-rose-800 leading-relaxed font-medium text-center space-y-1">
                <p className="font-bold text-rose-900 flex items-center justify-center gap-1.5">
                  <span>⚠️ Permanent Action</span>
                </p>
                <p className="text-[11.5px] text-rose-700">
                  This will permanently remove the user, all their customer reminders, and associated audit logs. This cannot be undone.
                </p>
              </div>

              {/* Centered Action Buttons (Balanced 2-Column Grid) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal(false)}
                  disabled={deletingUser}
                  className="w-full py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/95 transition active:scale-95 cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingUser}
                  onClick={handleExecuteDelete}
                  className="w-full py-2.5 rounded-full bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deletingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Permanently</span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Reminder Confirmation Modal */}
      <DeleteReminderModal
        isOpen={!!reminderToDelete}
        reminder={reminderToDelete}
        onClose={() => {
          if (!isDeletingReminder) setReminderToDelete(null);
        }}
        onConfirm={handleConfirmDeleteReminder}
        isDeleting={isDeletingReminder}
      />
    </div>
  );
}
