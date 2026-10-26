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
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="flex items-center gap-3 text-sm font-medium">
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
      color: "from-blue-500/15 to-indigo-500/10 text-blue-600 border-blue-200/80",
      link: "/admin/users",
    },
    {
      label: "Total Reminders (All Users)",
      value: stats?.totalReminders ?? 0,
      sublabel: `${stats?.pendingReminders ?? 0} pending, ${stats?.completedReminders ?? 0} completed`,
      icon: ListTodo,
      color: "from-amber-500/15 to-orange-500/10 text-amber-600 border-amber-200/80",
      link: "/admin/reminders",
    },
    {
      label: "Overdue Reminders",
      value: stats?.overdueReminders ?? 0,
      sublabel: "Require attention across system",
      icon: AlertTriangle,
      color: "from-rose-500/15 to-red-500/10 text-rose-600 border-rose-200/80",
      link: "/admin/reminders?status=overdue",
    },
    {
      label: "Unique Client Records",
      value: stats?.totalCustomers ?? 0,
      sublabel: "Distinct client phone numbers",
      icon: PhoneCall,
      color: "from-emerald-500/15 to-teal-500/10 text-emerald-600 border-emerald-200/80",
      link: "/admin/reminders",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 liquid-glass rounded-3xl p-5 sm:p-7">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight liquid-heading">
              Super Admin Control Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real-time multi-tenant monitoring, user accounts, and system-wide
            reminder operations.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="inline-flex items-center gap-1.5 px-4 py-2 liquid-glass-pill text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 transition-transform duration-500 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25 active:scale-95 border border-amber-300/40"
          >
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards with Smooth Hover Physics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="p-4 sm:p-5 rounded-2xl ios-glass smooth-interactive-card flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl bg-linear-to-br ${card.color} border shadow-2xs transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
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
        <div className="lg:col-span-2 ios-glass rounded-3xl p-6 transition-shadow duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent User Signups (7 Days)
              </h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors duration-200"
            >
              View all users &rarr;
            </Link>
          </div>

          {stats?.recentSignups?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-2.5 font-semibold">User</th>
                    <th className="pb-2.5 font-semibold">Role</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {stats.recentSignups.map((u) => (
                    <tr key={u._id} className="smooth-row">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shadow-2xs">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.role === "superadmin"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs"
                              : "bg-slate-100 text-slate-600 border border-slate-200/80"
                          }`}
                        >
                          {u.role === "superadmin" ? "Super Admin" : "User"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-rose-50 text-rose-700 border border-rose-200/80"
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
                      <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
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
            <p className="text-xs text-slate-400 py-6 text-center font-medium">
              No signups in the last 7 days.
            </p>
          )}
        </div>

        {/* Quick Hub (1 Col) */}
        <div className="space-y-4">
          <div className="ios-glass rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Operations Hub</span>
            </h3>
            <div className="space-y-2">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-slate-200/80 hover:border-amber-400/50 hover:bg-white text-xs font-semibold text-slate-800 shadow-2xs smooth-transition hover:translate-x-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-amber-600 transition-transform duration-200 group-hover:scale-110" />
                  <span>Inspect & Filter All Users</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/admin/reminders"
                className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-slate-200/80 hover:border-blue-400/50 hover:bg-white text-xs font-semibold text-slate-800 shadow-2xs smooth-transition hover:translate-x-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <ListTodo className="w-4 h-4 text-blue-600 transition-transform duration-200 group-hover:scale-110" />
                  <span>Global Reminders Monitor</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/admin/logs"
                className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-slate-200/80 hover:border-purple-400/50 hover:bg-white text-xs font-semibold text-slate-800 shadow-2xs smooth-transition hover:translate-x-1 group"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-600 transition-transform duration-200 group-hover:scale-110" />
                  <span>Security Audit Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-xs text-amber-900 leading-relaxed font-medium">
            <p className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
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
