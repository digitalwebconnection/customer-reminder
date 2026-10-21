import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Edit2,
  Plus,
  Save,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [userDetailsData, setUserDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      params.append("limit", "20");

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
  }, [search, statusFilter, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
  const handleDeleteReminder = async (reminderId) => {
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
      }
    } catch (err) {
      toast.error(
        "Delete failed",
        err.response?.data?.message || "Server error",
      );
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
  const handleOpenDelete = (user) => {
    if (user.role === "superadmin") {
      toast.warning("Forbidden", "Cannot delete the Super Admin account.");
      return;
    }
    setSelectedUser(user);
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

  const displayUser = userDetailsData?.user || selectedUser;

  return (
    <div className="space-y-6">
      {/* Page Title & Search/Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse all user accounts ({total} total registered), monitor
            reminders, and update account settings.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"
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
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
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
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table & Mobile Cards */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Mobile View: User Cards (< md) */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {users.length > 0 ? (
            users.map((u) => {
              const initial = (u.name || u.email || "U")
                .charAt(0)
                .toUpperCase();
              const isCurrent = currentAdmin?.id === u._id;

              return (
                <div key={u._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-100 text-sm truncate flex items-center gap-1.5">
                          <span>{u.name || "Unnamed"}</span>
                          {isCurrent && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-400 font-mono truncate">
                          {u.email}
                        </p>
                        {u.phone && (
                          <a
                            href={`tel:${u.phone}`}
                            className="text-[11px] text-zinc-300 font-mono inline-flex items-center gap-1 mt-0.5 hover:text-white"
                          >
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{u.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {u.role === "superadmin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Shield className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          User
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.isActive
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Metadata Row */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60 font-mono">
                    <span className="text-[11px]">
                      Reminders:{" "}
                      <span className="font-bold text-white">
                        {u.remindersCount ?? 0}
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Actions Toolbar with 38px touch targets */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(u)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-9.5 active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      className="w-9 h-9 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center justify-center active:scale-90 cursor-pointer"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenResetPassword(u)}
                      className="w-9 h-9 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 transition flex items-center justify-center active:scale-90 cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {u.role !== "superadmin" && (
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(u)}
                        className={`w-9 h-9 rounded-xl transition flex items-center justify-center active:scale-90 cursor-pointer ${
                          u.isActive
                            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
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
                        className="w-9 h-9 rounded-xl text-zinc-400 hover:text-rose-400 bg-zinc-800/60 hover:bg-rose-950/40 transition flex items-center justify-center active:scale-90 cursor-pointer"
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
            <div className="py-12 text-center text-xs text-zinc-500">
              {loading
                ? "Loading users..."
                : "No users match your search criteria."}
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-170">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Reminders</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.length > 0 ? (
                users.map((u) => {
                  const initial = (u.name || u.email || "U")
                    .charAt(0)
                    .toUpperCase();
                  const isCurrent = currentAdmin?.id === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-zinc-800/40 transition">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                              <span>{u.name || "Unnamed"}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-amber-400 font-mono">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono truncate">
                              {u.email}
                            </p>
                            {u.phone ? (
                              <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-zinc-500" />
                                <span>{u.phone}</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-zinc-600 italic mt-0.5">
                                No phone provided
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {u.role === "superadmin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Shield className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            u.isActive
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-400" : "bg-rose-400"
                            }`}
                          />
                          {u.isActive ? "Active" : "Blocked"}
                        </span>
                      </td>

                      {/* Reminder Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-zinc-200 font-semibold">
                          {u.reminderCount ?? 0}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(u)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                            title="View User Details & Reminders"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit User Profile (Name, Phone) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(u)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Block / Unblock Toggle */}
                          {u.role !== "superadmin" && (
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                u.isActive
                                  ? "text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                                  : "text-rose-400 hover:text-emerald-400 hover:bg-emerald-500/10"
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
                          {u.role !== "superadmin" && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    {loading
                      ? "Loading users..."
                      : "No users match your search criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
            <span>
              Page <span className="font-semibold text-white">{page}</span> of{" "}
              <span className="font-semibold text-white">{pages}</span> ({total}{" "}
              users)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. USER DETAILS & TELEMETRY MODAL */}
      {/* ======================================================== */}
      {viewDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base font-bold text-white shadow-inner">
                  {(displayUser.name || displayUser.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {displayUser.name || "User Details"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(displayUser)}
                      className="p-1 rounded text-zinc-500 hover:text-amber-400 transition"
                      title="Edit User Info"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    {displayUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefreshDetails}
                  disabled={loadingDetails}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Refresh User Telemetry"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingDetails ? "animate-spin text-amber-400" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDetailsModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {loadingDetails && !userDetailsData ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">
                    Fetching real-time user data and reminders...
                  </span>
                </div>
              ) : (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center shadow-inner">
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Total Reminders
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {userDetailsData?.stats?.total ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center shadow-inner">
                      <p className="text-[11px] text-amber-400 font-medium">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-amber-300 mt-1">
                        {userDetailsData?.stats?.pending ?? 0}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center shadow-inner">
                      <p className="text-[11px] text-emerald-400 font-medium">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-emerald-300 mt-1">
                        {userDetailsData?.stats?.completed ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Contact & Status details */}
                  <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone:</span>
                      </span>
                      <span className="text-zinc-200 font-medium">
                        {displayUser.phone ? (
                          displayUser.phone
                        ) : (
                          <span className="text-zinc-500 italic">
                            None provided
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Account Role:</span>
                      </span>
                      <span className="text-zinc-200 capitalize font-medium">
                        {displayUser.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Status:</span>
                      </span>
                      <span
                        className={
                          displayUser.isActive
                            ? "text-emerald-400 font-medium"
                            : "text-rose-400 font-medium"
                        }
                      >
                        {displayUser.isActive
                          ? "Active 🟢"
                          : "Blocked / Suspended 🔴"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Registered:</span>
                      </span>
                      <span className="text-zinc-200 font-mono">
                        {new Date(displayUser.createdAt).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(displayUser)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        <Edit2 className="w-3 h-3 text-amber-400" />
                        <span>Edit Name & Phone</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Reminders List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4 text-amber-400" />
                        <span>
                          Recent Reminders Created by this User (
                          {userDetailsData?.reminders?.length || 0})
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenAddReminder(displayUser)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
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
                            className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-semibold text-zinc-100 truncate">
                                {r.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                <span className="font-mono text-zinc-300">
                                  {r.phone}
                                </span>
                                {r.note && (
                                  <span className="text-zinc-500 truncate max-w-xs">
                                    • {r.note}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    r.status === "completed"
                                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                      : r.isOverdue
                                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                        : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {r.status === "completed"
                                    ? "Completed"
                                    : r.isOverdue
                                      ? "Overdue"
                                      : "Pending"}
                                </span>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">
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
                                    ? "text-emerald-400 hover:bg-emerald-500/10"
                                    : "text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800"
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
                                onClick={() => handleDeleteReminder(r._id)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Delete Reminder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl space-y-2">
                        <p className="text-xs text-zinc-400">
                          No reminders found for this user.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddReminder(displayUser)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition cursor-pointer"
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
            <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-950/60">
              <button
                type="button"
                onClick={() => setViewDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EDIT USER (NAME, PHONE) MODAL */}
      {/* ======================================================== */}
      {editUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <span>Edit User Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditUserModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Update contact info for{" "}
              <span className="text-zinc-200 font-semibold">
                {selectedUser.email}
              </span>
              .
            </p>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  placeholder="e.g. Bhargav Patel"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUserEdit}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingUserEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ADD REMINDER FOR USER MODAL */}
      {/* ======================================================== */}
      {addReminderModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-400" />
                <span>Create Reminder for User</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddReminderModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              This reminder will be owned and visible to{" "}
              <span className="text-zinc-200 font-semibold">
                {selectedUser.name || selectedUser.email}
              </span>
              .
            </p>

            <form
              onSubmit={handleSaveNewReminder}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
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
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
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
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Customer Email (Optional)
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
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
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
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
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
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddReminderModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewReminder}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {savingNewReminder ? "Creating..." : "Create Reminder"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. RESET PASSWORD MODAL */}
      {/* ======================================================== */}
      {resetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Reset User Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setResetPasswordModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Reset credentials for{" "}
              <span className="text-zinc-200 font-semibold">
                {selectedUser.name}
              </span>{" "}
              ({selectedUser.email}).
            </p>

            <form onSubmit={handleExecutePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailLink}
                    onChange={(e) => setSendEmailLink(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-0"
                  />
                  <span>
                    Send reset email link to user instead of manual password
                  </span>
                </label>
              </div>

              {!sendEmailLink && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Direct New Password
                  </label>
                  <input
                    type="text"
                    required={!sendEmailLink}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {resettingPassword
                    ? "Processing..."
                    : sendEmailLink
                      ? "Dispatch Reset Email"
                      : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DELETE USER CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">
                Delete User Account?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-white font-semibold">
                  {selectedUser.name}
                </span>{" "}
                ({selectedUser.email})?
              </p>
              <p className="text-xs text-rose-400/90 font-medium">
                ⚠️ This will permanently remove the user, all their customer
                reminders, and associated audit logs. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {deletingUser ? "Deleting..." : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
