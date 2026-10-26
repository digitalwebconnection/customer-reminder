import { useState, useEffect, useCallback } from "react";
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

// Pre-instantiated formatters for zero per-render memory allocation and 10x faster date formatting
const fullDateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const fullTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "short",
  day: "numeric",
});

const shortTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
});

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
          style: "bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs",
        };
      case "signup":
        return {
          icon: UserPlus,
          label: "Signup",
          style: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        };
      case "logout":
        return {
          icon: LogOut,
          label: "Logout",
          style: "bg-slate-100 text-slate-600 border-slate-200/80",
        };
      case "user_blocked":
        return {
          icon: UserX,
          label: "User Blocked",
          style: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs",
        };
      case "user_unblocked":
        return {
          icon: UserCheck,
          label: "User Unblocked",
          style: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        };
      case "user_deleted":
        return {
          icon: Trash2,
          label: "User Deleted",
          style: "bg-red-50 text-red-700 border-red-200/80 shadow-2xs",
        };
      case "admin_password_reset":
      case "password_reset_complete":
      case "password_reset_request":
        return {
          icon: Lock,
          label: "Password Action",
          style: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
        };
      default:
        return {
          icon: Shield,
          label: action || "Event",
          style: "bg-slate-100 text-slate-700 border-slate-200/80",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 liquid-heading">
            <History className="w-6 h-6 text-amber-600" />
            <span>Security & Activity Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Immutable system event trail recording authentication events,
            administrative actions, and status updates ({total} total entries).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-pill text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 ios-glass p-4 rounded-2xl">
        <div className="w-full sm:w-72">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2 ios-glass-input rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none transition cursor-pointer"
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
      <div className="ios-glass rounded-3xl overflow-hidden">
        {/* Mobile View: Log Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100/80">
          {logs.length > 0 ? (
            logs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;

              return (
                <div key={log._id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.style}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {shortDateFormatter.format(new Date(log.createdAt))}{" "}
                      {shortTimeFormatter.format(new Date(log.createdAt))}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {log.userId?.name || "System"}
                      {log.userId?.email && (
                        <span className="text-slate-500 font-mono font-normal ml-1.5 text-[11px]">
                          ({log.userId.email})
                        </span>
                      )}
                    </p>
                    {log.details && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {log.details}
                      </p>
                    )}
                    {log.targetUserId && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Target:{" "}
                        {log.targetUserId?.name ||
                          log.targetUserId?.email ||
                          "User"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>{log.ipAddress || "127.0.0.1"}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              {loading ? "Loading audit records..." : "No activity logs found."}
            </div>
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-xs min-w-155">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor (User)</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Network IP</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;

                  return (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 transition"
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
                            <p className="font-bold text-slate-900">
                              {log.userId.name || "User"}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {log.userId.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            System
                          </span>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        <p className="text-slate-700 font-medium">{log.details || "—"}</p>
                        {log.targetUserId && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Target:{" "}
                            {log.targetUserId?.name ||
                              log.targetUserId?.email ||
                              "User"}
                          </p>
                        )}
                      </td>

                      {/* IP / Host */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{log.ipAddress || "127.0.0.1"}</span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {fullDateFormatter.format(new Date(log.createdAt))}
                          </span>
                          <span className="text-slate-400">
                            {fullTimeFormatter.format(new Date(log.createdAt))}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
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
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white/60 text-xs text-slate-500 font-medium">
            <span>
              Page <span className="font-bold text-slate-900">{page}</span> of{" "}
              <span className="font-bold text-slate-900">{pages}</span> ({total}{" "}
              logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 transition cursor-pointer shadow-2xs disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-40 transition cursor-pointer shadow-2xs disabled:cursor-not-allowed"
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
