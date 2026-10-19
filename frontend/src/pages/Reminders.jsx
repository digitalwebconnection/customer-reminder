import React, { useState, useEffect, useRef } from "react";
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
  Globe,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  X,
  CalendarClock,
  Users,
  ChevronDown,
  ArrowUpDown,
  BellRing,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { formatInAustralianTime } from "../utils/dateUtils";
import EditReminderModal from "../components/EditReminderModal";
import {
  playChimeSound,
  startCallRingtone,
  stopCallRingtone,
} from "../utils/audioAlert";
import { useToast } from "../context/ToastContext";
import { usePwa } from "../context/PwaContext";
import NumberTicker from "../components/ui/NumberTicker";

import QuickSnoozePortal from "../components/QuickSnoozePortal";

export default function Reminders() {
  const toast = useToast();
  const { permissions, setShowAlarmModal } = usePwa();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState("all"); // all | pending | completed | overdue
  const [sortBy, setSortBy] = useState("latest"); // latest (newest on top) | dueAt_asc | dueAt_desc
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeDueAlert, setActiveDueAlert] = useState(null);
  const [alertSecondsLeft, setAlertSecondsLeft] = useState(60);
  const [isRingtoneMuted, setIsRingtoneMuted] = useState(false);
  const notifiedIdsRef = useRef(new Set());
  const [activeSnooze, setActiveSnooze] = useState(null); // { reminder, anchorRect }
  const [copiedId, setCopiedId] = useState(null);

  // Auto-refresh state (every 2 minutes = 120 seconds)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshSecondsLeft, setRefreshSecondsLeft] = useState(120);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keyboard shortcut: '/' to focus search, 'Escape' to clear/blur
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        if (!["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if (e.key === "Escape") {
        if (activeSnooze) {
          setActiveSnooze(null);
        } else if (search) {
          setSearch("");
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSnooze, search]);

  // Smooth Call Ringtone & 60-Second Countdown Timer for due reminder banner
  useEffect(() => {
    if (!activeDueAlert) {
      stopCallRingtone();
      return;
    }

    setAlertSecondsLeft(60);
    setIsRingtoneMuted(false);
    startCallRingtone();

    const timer = setInterval(() => {
      setAlertSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopCallRingtone();
          setActiveDueAlert(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopCallRingtone();
    };
  }, [activeDueAlert]);

  // Handle URL alert query (when opening notification directly from mobile push)
  useEffect(() => {
    const alertId = searchParams.get("alertId");
    const testAlarm = searchParams.get("testAlarm");

    if (alertId && reminders.length > 0) {
      const target = reminders.find((r) => r._id === alertId);
      if (target) {
        setActiveDueAlert(target);
      }
    } else if (testAlarm && !activeDueAlert) {
      setActiveDueAlert({
        _id: "test-alert",
        name: "Test Customer (John Smith)",
        phone: "+61 400 123 456",
        dueAt: new Date().toISOString(),
        note: "This is a live test of the phone alarm & ringtone system.",
      });
    }
  }, [searchParams, reminders]);

  // Listen for Service Worker postMessage notification clicks
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleSwMessage = (e) => {
        if (e.data && e.data.type === "CALL_REMINDER_NOTIFICATION_CLICK") {
          const { reminderId, name, phone } = e.data.data || {};
          if (reminderId) {
            const target = reminders.find((r) => r._id === reminderId);
            if (target) {
              setActiveDueAlert(target);
            } else {
              setActiveDueAlert({
                _id: reminderId,
                name: name || "Customer Call Due",
                phone: phone || "",
                dueAt: new Date().toISOString(),
              });
            }
          }
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    }
  }, [reminders]);

  const fetchReminders = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      if (search.trim()) params.search = search.trim();
      params.sort = sortBy;

      const res = await api.get("/reminders", { params });
      const list = res.data.data || [];

      // Ensure latest entries are set on top
      const sorted = [...list].sort((a, b) => {
        if (sortBy === "dueAt_asc") {
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        } else if (sortBy === "dueAt_desc") {
          return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
        }
        // "latest": newest created/added entry on top
        const timeA = new Date(a.createdAt || a.dueAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.dueAt || 0).getTime();
        return timeB - timeA;
      });

      setReminders(sorted);
      setLastRefreshedAt(new Date());

      // Check for in-app and desktop notifications
      checkDuePopups(sorted);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      toast.error("Network Error", "Could not synchronize reminders with server.");
    } finally {
      setLoading(false);
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  // Immediate fetch on filter, search, or sort change + reset 2-minute timer
  useEffect(() => {
    fetchReminders();
    setRefreshSecondsLeft(120);
  }, [filter, search, sortBy]);

  // 2-Minute (120 seconds) Auto-Refresh Countdown & Execution
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setRefreshSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchReminders(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, filter, search]);

  // Secondary 15s in-memory check so due alerts fire on the exact minute
  useEffect(() => {
    const localTimer = setInterval(() => {
      checkDuePopups(reminders);
    }, 15000);
    return () => clearInterval(localTimer);
  }, [reminders]);

  const handleManualRefresh = () => {
    fetchReminders(true);
    setRefreshSecondsLeft(120);
    toast.info("Refreshed", "Reminders synced with database.");
  };

  const checkDuePopups = (list) => {
    const now = new Date();
    list.forEach((r) => {
      const isDueNow = r.status === "pending" && new Date(r.dueAt) <= now;
      if (isDueNow && !notifiedIdsRef.current.has(r._id)) {
        notifiedIdsRef.current.add(r._id);

        setActiveDueAlert(r);

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const tz = r.timezone || "Australia/Sydney";
            new Notification(`📞 Call Due: ${r.name}`, {
              body: `Phone: ${r.phone} | Due: ${formatInAustralianTime(r.dueAt, tz)}\nNote: ${r.note || "None"}`,
              icon: "/favicon.svg",
            });
          } catch (e) {}
        }
      }
    });
  };

  const handleToggleCompleted = async (reminder) => {
    const newStatus = reminder.status === "completed" ? "pending" : "completed";
    try {
      await api.patch(`/reminders/${reminder._id}`, { status: newStatus });
      if (newStatus === "completed") {
        toast.success("Completed ✅", `Marked follow-up with ${reminder.name} as finished.`);
      } else {
        toast.info("Marked Pending ⏳", `Call with ${reminder.name} reopened in queue.`);
      }
      fetchReminders();
    } catch (err) {
      toast.error("Update Failed", "Could not change status. Please check connection.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the reminder for ${name}?`)) {
      return;
    }
    try {
      await api.delete(`/reminders/${id}`);
      toast.info("Reminder Deleted", `Removed record for ${name}.`);
      fetchReminders();
    } catch (err) {
      toast.error("Delete Failed", "Could not remove reminder from database.");
    }
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast.call("Copied to Clipboard 📋", `${label}: ${text}`);
  };

  const handleQuickSnooze = async (reminder, hoursToAdd, label) => {
    setActiveSnooze(null);
    try {
      const currentDue = new Date(reminder.dueAt);
      const baseDate = currentDue < new Date() ? new Date() : currentDue;
      const newDue = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);

      await api.patch(`/reminders/${reminder._id}`, {
        dueAt: newDue.toISOString(),
        status: "pending",
      });

      toast.success(
        "Call Rescheduled ⏰",
        `Postponed ${reminder.name} to ${formatInAustralianTime(
          newDue.toISOString(),
          reminder.timezone || "Australia/Sydney"
        )} (${label})`
      );
      fetchReminders();
    } catch (err) {
      toast.error("Reschedule Failed", "Could not update call schedule.");
    }
  };

  const counts = {
    all: reminders.length,
    pending: reminders.filter(
      (r) => r.status === "pending" && !(r.isOverdue || new Date(r.dueAt) < new Date())
    ).length,
    completed: reminders.filter((r) => r.status === "completed").length,
    overdue: reminders.filter(
      (r) => r.status === "pending" && (r.isOverdue || new Date(r.dueAt) < new Date())
    ).length,
  };

  const completionPercentage =
    counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0;

  const getStatusBadge = (r) => {
    if (r.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Completed</span>
        </span>
      );
    }

    const isOverdue =
      r.isOverdue || (r.status === "pending" && new Date(r.dueAt) < new Date());
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span>Overdue</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-3 sm:py-8 space-y-4 sm:space-y-6">

      {activeDueAlert && (
        <div className="p-3.5 sm:p-5 rounded-3xl bg-linear-to-r from-rose-950/90 via-slate-900/95 to-slate-950 border border-rose-500/60 shadow-2xl animate-fade-in flex flex-col gap-3 relative overflow-hidden backdrop-blur-2xl">
      

          {/* 60-Second Animated Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/80">
            <div
              className="h-full bg-linear-to-r from-rose-500 to-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${(alertSecondsLeft / 60) * 100}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-linear-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shrink-0 animate-bounce shadow-lg shadow-rose-600/40">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Call Due Now
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {activeDueAlert.name}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    ⏱️ {alertSecondsLeft}s
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono break-words">
                  Phone:{" "}
                  <span className="font-semibold text-rose-300">
                    {activeDueAlert.phone}
                  </span>{" "}
                  | Scheduled:{" "}
                  {formatInAustralianTime(
                    activeDueAlert.dueAt,
                    activeDueAlert.timezone || "Australia/Sydney"
                  )}
                </p>
                {activeDueAlert.note && (
                  <p className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-2">
                    "{activeDueAlert.note}"
                  </p>
                )}
              </div>
            </div>

            {/* Banner Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <a
                href={`tel:${activeDueAlert.phone}`}
                onClick={() => stopCallRingtone()}
                className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now ({activeDueAlert.phone})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (isRingtoneMuted) {
                    startCallRingtone();
                    setIsRingtoneMuted(false);
                  } else {
                    stopCallRingtone();
                    setIsRingtoneMuted(true);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700 shadow-sm cursor-pointer"
              >
                {isRingtoneMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>Mute Ring</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  stopCallRingtone();
                  handleToggleCompleted(activeDueAlert);
                  setActiveDueAlert(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center transition cursor-pointer"
              >
                Complete
              </button>

              <button
                onClick={() => {
                  stopCallRingtone();
                  setActiveDueAlert(null);
                }}
                className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header, Auto-refresh indicator, and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>All Reminders</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full">
                Live Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Manage client appointments and automated follow-ups across Australia
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Manual Instant Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold transition border border-white/8 shadow-sm cursor-pointer disabled:opacity-60"
            title="Refresh reminders from database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <Link
            to="/add"
            className="btn-shimmer inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs and Quick Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs: Horizontal swipeable on mobile */}
        <div className="overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x">
          <div className="inline-flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-white/8 shadow-inner min-w-max">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "overdue", label: "Overdue" },
              { key: "completed", label: "Completed" },
            ].map((tab) => {
              const count = counts[tab.key] || 0;
              const isActive = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/4"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          {/* Order Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/8 rounded-xl px-3 py-2 shadow-inner w-full sm:w-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1 w-full"
            >
              <option value="latest" className="bg-slate-900 text-slate-200">
                Latest Entry (Newest on Top)
              </option>
              <option value="dueAt_asc" className="bg-slate-900 text-slate-200">
                Call Due (Soonest First)
              </option>
              <option value="dueAt_desc" className="bg-slate-900 text-slate-200">
                Call Due (Latest First)
              </option>
            </select>
          </div>

          {/* Enhanced Search Bar with Clear Button & Shortcut Hint */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or phone... (/)"
              className="w-full pl-10 pr-9 py-2.5 sm:py-2 bg-slate-900/90 border border-white/8 rounded-xl text-sm sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition shadow-inner"
            />
            {search ? (
              <button
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-2.5 sm:top-2 text-slate-400 hover:text-white p-0.5 rounded-md transition"
                title="Clear search (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-3 top-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/6 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Content: Table on Desktop / Cards on Mobile */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
          <p>Loading follow-up reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">No reminders found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `No customers match "${search}". Try checking the spelling or clearing filters.`
                : "Your customer reminder schedule is clear. Add a new reminder to get started."}
            </p>
          </div>
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search Query</span>
            </button>
          ) : (
            <Link
              to="/add"
              className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule First Reminder</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/8 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-collapse min-w-220">
              <thead>
                <tr className="border-b border-white/8 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-6 pr-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Due Date & Time (AU)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {reminders.map((r) => {
                  const tz = r.timezone || "Australia/Sydney";
                  const initials = (r.name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const isSnoozeOpen = activeSnooze?.reminder?._id === r._id;

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-white/3 transition-colors group relative"
                    >
                      {/* Customer Name & Phone */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0 shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 group-hover:text-white transition flex items-center gap-1.5">
                              <span>{r.name}</span>
                              {r.note && (
                                <span
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/6 truncate max-w-40"
                                  title={r.note}
                                >
                                  {r.note}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <a
                                href={`tel:${r.phone}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 font-mono text-[11px] border border-indigo-500/20 transition"
                                title="Click to call customer immediately"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{r.phone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyText(r.phone, "Phone")}
                                className="text-slate-500 hover:text-slate-300 p-1 rounded transition"
                                title="Copy phone number"
                              >
                                {copiedId === r.phone ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact / Email */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {r.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${r.email}`}
                              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 transition"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-37.5">{r.email}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyText(r.email, "Email")}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                              title="Copy email address"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : r.address ? (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-37.5">{r.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Due Date/Time in Australia Timezone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/50 border border-white/6 font-mono text-xs text-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(r)}
                      </td>

                      {/* Actions per row with Quick Snooze */}
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {/* Quick Call Button */}
                          

                          {/* Quick Snooze Popover Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeSnooze?.reminder?._id === r._id) {
                                setActiveSnooze(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveSnooze({ reminder: r, anchorRect: rect });
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                              activeSnooze?.reminder?._id === r._id
                                ? "bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/40"
                                : "text-slate-400 hover:text-indigo-300 hover:bg-white/6 border-white/6"
                            }`}
                            title="Quick Reschedule / Snooze"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>

                          {/* Complete Toggle */}
                          <button
                            onClick={() => handleToggleCompleted(r)}
                            className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                              r.status === "completed"
                                ? "text-amber-400 hover:bg-amber-500/15 border-amber-500/30"
                                : "text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/30"
                            }`}
                            title={
                              r.status === "completed" ? "Mark as Pending" : "Mark Completed"
                            }
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => setEditingReminder(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/6 border border-white/6 transition cursor-pointer"
                            title="Edit Full Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(r._id, r.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-white/6 hover:border-rose-500/30 transition cursor-pointer"
                            title="Delete Reminder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {reminders.map((r) => {
              const tz = r.timezone || "Australia/Sydney";
              const initials = (r.name || "C")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const isSnoozeOpen = activeSnooze?.reminder?._id === r._id;

              return (
                <div
                  key={r._id}
                  className="bg-slate-900/60 backdrop-blur-xl border border-white/8 rounded-3xl p-4 space-y-3 shadow-lg relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{r.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${r.phone}`}
                            className="text-xs text-indigo-300 hover:text-indigo-200 font-mono inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{r.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(r.phone, "Phone")}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                          >
                            {copiedId === r.phone ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>{getStatusBadge(r)}</div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-white/6">
                    <div className="flex items-center justify-between gap-1.5 text-indigo-300 font-mono bg-slate-950/40 px-2.5 py-1 rounded-lg border border-white/4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                      </div>
                    </div>

                    {r.address && (
                      <div className="flex items-center gap-1.5 text-slate-400 px-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{r.address}</span>
                      </div>
                    )}

                    {r.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 px-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <a href={`mailto:${r.email}`} className="hover:text-indigo-300 truncate">
                          {r.email}
                        </a>
                      </div>
                    )}

                    {r.note && (
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-300 text-[11px] italic mt-2">
                        "{r.note}"
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions with Quick Snooze */}
                  <div className="pt-2.5 border-t border-white/6 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${r.phone}`}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center gap-1.5 relative">
                      {/* Quick Snooze Popover Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeSnooze?.reminder?._id === r._id) {
                            setActiveSnooze(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveSnooze({ reminder: r, anchorRect: rect });
                          }
                        }}
                        className={`p-2 rounded-xl text-xs border transition active:scale-95 cursor-pointer ${
                          activeSnooze?.reminder?._id === r._id
                            ? "bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400/40"
                            : "bg-white/6 text-slate-300 border-white/8 hover:text-white"
                        }`}
                        title="Quick Reschedule / Snooze"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleCompleted(r)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition active:scale-95 ${
                          r.status === "completed"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-white/8 hover:bg-white/15 text-slate-200 border-white/8"
                        }`}
                      >
                        {r.status === "completed" ? "Pending" : "Done"}
                      </button>

                      <button
                        onClick={() => setEditingReminder(r)}
                        className="p-2 rounded-xl text-slate-300 hover:text-indigo-300 bg-white/6 border border-white/8 transition active:scale-95"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(r._id, r.name)}
                        className="p-2 rounded-xl text-slate-300 hover:text-rose-400 bg-white/6 hover:bg-rose-500/15 border border-white/8 hover:border-rose-500/30 transition active:scale-95"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Reminder Modal */}
      {editingReminder && (
        <EditReminderModal
          isOpen={!!editingReminder}
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onSaved={() => {
            fetchReminders();
            toast.success("Updated ✨", "Reminder details updated successfully.");
          }}
        />
      )}

      {/* Quick Snooze Portal Popup (renders directly to body to avoid overflow clipping) */}
      <QuickSnoozePortal
        isOpen={!!activeSnooze}
        onClose={() => setActiveSnooze(null)}
        anchorRect={activeSnooze?.anchorRect}
        reminder={activeSnooze?.reminder}
        onSnooze={handleQuickSnooze}
        onOpenCustomEdit={(rem) => setEditingReminder(rem)}
      />
    </div>
  );
}
