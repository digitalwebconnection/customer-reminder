import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  RefreshCw,
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  Lock,
  UserX,
  UserCheck,
  Trash2,
  Calendar,
  Globe,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append("action", actionFilter);
      params.append("page", String(page));
      params.append("limit", "50");

      const res = await api.get(`/admin/activity?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      toast.error(
        "Failed to load audit logs",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Action Badge styling helper
  const getActionBadge = (action) => {
    switch (action) {
      case "login":
        return {
          icon: LogIn,
          label: "Login",
          style: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        };
      case "signup":
        return {
          icon: UserPlus,
          label: "Signup",
          style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
      case "logout":
        return {
          icon: LogOut,
          label: "Logout",
          style: "bg-zinc-800 text-zinc-400 border-zinc-700",
        };
      case "user_blocked":
        return {
          icon: UserX,
          label: "User Blocked",
          style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        };
      case "user_unblocked":
        return {
          icon: UserCheck,
          label: "User Unblocked",
          style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
      case "user_deleted":
        return {
          icon: Trash2,
          label: "User Deleted",
          style: "bg-red-500/20 text-red-300 border-red-500/40",
        };
      case "admin_password_reset":
      case "password_reset_complete":
      case "password_reset_request":
        return {
          icon: Lock,
          label: "Password Action",
          style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        };
      default:
        return {
          icon: Shield,
          label: action || "Event",
          style: "bg-zinc-800 text-zinc-300 border-zinc-700",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Security & Activity Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Immutable system event trail recording authentication events,
            administrative actions, and status updates ({total} total entries).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div className="w-full sm:w-72">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
          >
            <option value="">All Action Types</option>
            <option value="login">Logins</option>
            <option value="signup">Signups / Registrations</option>
            <option value="logout">Logouts</option>
            <option value="user_blocked">User Blocked</option>
            <option value="user_unblocked">User Unblocked</option>
            <option value="admin_password_reset">Admin Password Resets</option>
            <option value="user_deleted">User Deletions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table & Mobile Cards */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Mobile View: Log Cards (< md) */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {logs.length > 0 ? (
            logs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;

              return (
                <div key={log._id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.style}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      {log.userId?.name || "System"}
                      {log.userId?.email && (
                        <span className="text-zinc-500 font-mono font-normal ml-1.5 text-[11px]">
                          ({log.userId.email})
                        </span>
                      )}
                    </p>
                    {log.details && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {log.details}
                      </p>
                    )}
                    {log.targetUserId && (
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        Target:{" "}
                        {log.targetUserId.name || log.targetUserId.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/60">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-zinc-600" />
                      <span>{log.ipAddress || "127.0.0.1"}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              {loading ? "Loading audit records..." : "No activity logs found."}
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-155">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor (User)</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Network IP</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-zinc-800/40 transition"
                    >
                      {/* Action Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.style}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Actor User */}
                      <td className="py-3 px-4">
                        {log.userId ? (
                          <div>
                            <p className="font-semibold text-zinc-200">
                              {log.userId.name || "User"}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {log.userId.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono text-[11px]">
                            System
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        <p className="text-zinc-300">{log.details || "—"}</p>
                        {log.targetUserId && (
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Target:{" "}
                            {log.targetUserId.name || log.targetUserId.email}
                          </p>
                        )}
                      </td>

                      {/* IP / Host */}
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-zinc-600" />
                          <span>{log.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                timeZone: "Asia/Kolkata",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="text-zinc-500">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                timeZone: "Asia/Kolkata",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    {loading
                      ? "Loading audit records..."
                      : "No activity logs found."}
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
              logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
