import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  ListTodo,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  Shield,
  Activity,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/dashboard");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      toast.error(
        "Failed to load stats",
        err.response?.data?.message || "Server error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading admin intelligence...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Registered Users",
      value: stats?.totalUsers ?? 0,
      sublabel: `${stats?.activeUsers ?? 0} active, ${stats?.blockedUsers ?? 0} blocked`,
      icon: Users,
      color:
        "from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/30",
      link: "/admin/users",
    },
    {
      label: "Total Reminders (All Users)",
      value: stats?.totalReminders ?? 0,
      sublabel: `${stats?.pendingReminders ?? 0} pending, ${stats?.completedReminders ?? 0} completed`,
      icon: ListTodo,
      color:
        "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
      link: "/admin/reminders",
    },
    {
      label: "Overdue Reminders",
      value: stats?.overdueReminders ?? 0,
      sublabel: "Require attention across system",
      icon: AlertTriangle,
      color: "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
      link: "/admin/reminders?status=overdue",
    },
    {
      label: "Unique Client Records",
      value: stats?.totalCustomers ?? 0,
      sublabel: "Distinct client phone numbers",
      icon: PhoneCall,
      color:
        "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
      link: "/admin/reminders",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-zinc-900 via-zinc-900 to-amber-950/30 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Super Admin Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time multi-tenant monitoring, user accounts, and system-wide
            reminder operations.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition cursor-pointer active:scale-95 min-h-9.5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow-md shadow-amber-500/20 active:scale-95 min-h-9.5"
          >
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-3.5 sm:p-5 rounded-2xl bg-zinc-900/80 border ${card.color.split(" ").pop()} hover:scale-[1.02] active:scale-95 transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl bg-linear-to-br ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {card.sublabel}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Signups & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups (2 Cols) */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">
                Recent User Signups (7 Days)
              </h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition"
            >
              View all users &rarr;
            </Link>
          </div>

          {stats?.recentSignups?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-medium">
                    <th className="pb-2.5 font-medium">User</th>
                    <th className="pb-2.5 font-medium">Role</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {stats.recentSignups.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.role === "superadmin"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                          }`}
                        >
                          {u.role === "superadmin" ? "Super Admin" : "User"}
                        </span>
                      </td>
                      <td className="py-3">
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
                      </td>
                      <td className="py-3 text-right text-zinc-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No signups in the last 7 days.
            </p>
          )}
        </div>

        {/* Quick Hub (1 Col) */}
        <div className="space-y-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Operations Hub</span>
            </h3>
            <div className="space-y-2">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Inspect & Filter All Users</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/admin/reminders"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ListTodo className="w-4 h-4 text-blue-400" />
                  <span>Global Reminders Monitor</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/admin/logs"
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Security Audit Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-xs text-amber-200/90 leading-relaxed">
            <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Super Admin Policy
            </p>
            You have full system access to view and manage all tenant records,
            unblock or suspend accounts, reset user credentials, and trace
            system-wide activities.
          </div>
        </div>
      </div>
    </div>
  );
}
