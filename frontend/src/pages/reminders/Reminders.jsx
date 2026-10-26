import { useState, useEffect, useRef } from "react";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Circle,
  Loader2,
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
  UserPlus,
  Repeat,
  ChevronDown,
  ArrowUpDown,
  BellRing,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { formatInAustralianTime } from "../../utils/dateUtils";
import EditReminderModal from "../../components/modals/EditReminderModal";
import DeleteReminderModal from "../../components/modals/DeleteReminderModal";
import { useToast } from "../../context/ToastContext";
import { usePwa } from "../../context/PwaContext";
import { useAuth } from "../../context/AuthContext";
import QuickSnoozePortal from "../../components/modals/QuickSnoozePortal";

// Smooth rolling number counter with cubic easing
function AnimatedNumber({ value, duration = 450 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startVal = Number(prevValueRef.current) || 0;
    const endVal = Number(value) || 0;
    prevValueRef.current = endVal;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let startTime = null;
    let animFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic: 1 - (1 - progress)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      }
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

export default function Reminders() {
  const toast = useToast();
  const { user } = useAuth();
  const { permissions, setShowAlarmModal, enableRingPermission } = usePwa();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  // Clear any legacy blacklisted alert IDs from previous sessions so alarms ring freely
  useEffect(() => {
    try {
      sessionStorage.removeItem("remindiq_handled_alert_ids");
    } catch (e) {}
  }, []);

  // Track dismissed reminder IDs strictly in memory for the active view session
  // (Prevents repetitive alerts only after user explicitly clicks Dismiss or completes call)
  const dismissedIdsRef = useRef(new Set());

  // Active desktop Notification instances: reminderId -> Notification
  const activeDesktopNotifsRef = useRef(new Map());

  const markAlertDismissed = (id) => {
    if (!id) return;
    dismissedIdsRef.current.add(id);
  };

  /**
   * Safely closes any desktop and Service Worker notification for a reminder
   */
  const closeNotificationForReminder = (reminderId) => {
    if (!reminderId) return;

    // 1. Close active window Notification object immediately
    const notif = activeDesktopNotifsRef.current.get(reminderId);
    if (notif) {
      try {
        notif.close();
      } catch (e) {}
      activeDesktopNotifsRef.current.delete(reminderId);
    }

    // 2. Close any Service Worker notifications matching this reminder
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && reg.getNotifications) {
            return reg.getNotifications();
          }
          return [];
        })
        .then((notifs) => {
          notifs.forEach((n) => {
            const tag = n.tag || "";
            const nReminderId = n.data?.reminderId || "";
            if (
              tag === `remindiq-alarm-${reminderId}` ||
              tag === `remindiq-alert-${reminderId}` ||
              tag.includes(reminderId) ||
              nReminderId === reminderId
            ) {
              try {
                n.close();
              } catch (e) {}
            }
          });
        })
        .catch(() => {});
    }
  };

  const clearUrlAlertParams = () => {
    // Defer to next tick to avoid "Cannot update a component while rendering a different component"
    setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          let changed = false;
          if (next.has("alertId")) {
            next.delete("alertId");
            changed = true;
          }
          if (next.has("testAlarm")) {
            next.delete("testAlarm");
            changed = true;
          }
          return changed ? next : prev;
        },
        { replace: true },
      );
    }, 0);
  };

  const [reminders, setReminders] = useState([]);
  const [allUserReminders, setAllUserReminders] = useState([]);
  const [filter, setFilter] = useState("all"); // all | pending | completed | overdue
  const [isFilterChanging, setIsFilterChanging] = useState(false);
  const [filterPendingTarget, setFilterPendingTarget] = useState(null);
  const filterTimeoutRef = useRef(null);

  // Intentional smooth transition when clicking metric cards instead of instant snap
  const handleFilterClick = (targetFilter) => {
    if (filter === targetFilter && !isFilterChanging) return;

    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    setIsFilterChanging(true);
    setFilterPendingTarget(targetFilter);
    setCurrentPage(1);

    // Intentional 550ms transition so the user clearly sees loading feedback and data change
    filterTimeoutRef.current = setTimeout(() => {
      setFilter(targetFilter);
      setIsFilterChanging(false);
      setFilterPendingTarget(null);
    }, 550);
  };

  // Cleanup pending filter transition timer on unmount
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  const [sortBy, setSortBy] = useState("latest"); // latest (newest on top) | dueAt_asc | dueAt_desc
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [isDeletingReminder, setIsDeletingReminder] = useState(false);
  const [activeDueAlert, setActiveDueAlert] = useState(null);
  const [alertSecondsLeft, setAlertSecondsLeft] = useState(60);
  const [isCompletingAlert, setIsCompletingAlert] = useState(false);
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

  // Smooth 60-Second Countdown Timer for due reminder toaster
  useEffect(() => {
    if (!activeDueAlert) {
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
      return;
    }

    document.title = `🔔 CALL DUE: ${activeDueAlert.name} (${activeDueAlert.phone || ""}) — RemindIQ`;
    setAlertSecondsLeft(60);

    const timer = setInterval(() => {
      setAlertSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (activeDueAlert?._id) {
            markAlertDismissed(activeDueAlert._id);
          }
          clearUrlAlertParams();
          setActiveDueAlert(null);
          document.title =
            "RemindIQ — Customer Follow-up & Call Reminder System";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
    };
  }, [activeDueAlert]);

  // Handle URL alert query (when opening notification directly from mobile push or deep link)
  useEffect(() => {
    const alertId = searchParams.get("alertId");
    const testAlarm = searchParams.get("testAlarm");

    if (alertId) {
      // Ensure alert is not marked as dismissed when explicitly opening URL or notification
      dismissedIdsRef.current.delete(alertId);

      // If test alert ID (e.g. test-alarm-..., test-alert), clear immediately and NEVER call backend API
      if (alertId === "test-alert" || String(alertId).startsWith("test-")) {
        clearUrlAlertParams();
        return;
      }

      if (reminders.length > 0) {
        const target = reminders.find((r) => r._id === alertId);
        if (target) {
          if (target.status === "pending") {
            setActiveDueAlert(target);
          } else {
            clearUrlAlertParams();
          }
          return;
        }
      }

      // If reminder was not found in the currently loaded list (cold start or filtered list), fetch directly
      // ONLY fetch if alertId is a valid 24-character hexadecimal MongoDB ObjectId
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(alertId);
      if (!loading && isValidMongoId) {
        api
          .get(`/reminders/${alertId}`)
          .then((res) => {
            const r = res.data?.data;
            if (r && r.status === "pending") {
              setActiveDueAlert(r);
            } else {
              clearUrlAlertParams();
            }
          })
          .catch(() => {
            clearUrlAlertParams();
          });
      } else if (!isValidMongoId) {
        clearUrlAlertParams();
      }
    } else if (testAlarm) {
      clearUrlAlertParams();
    }
  }, [searchParams, reminders, loading]);

  // Mobile background-to-foreground instant wakeup handler:
  // When mobile user wakes screen, unlocks phone, or switches back to RemindIQ from background, immediately check!
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible") {
        fetchReminders(false);
      }
    };
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, []);

  // Listen for Service Worker postMessage notification clicks (strictly for current user)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handleSwMessage = (e) => {
        if (!e.data) return;

        // Background completion from SW notification action
        if (e.data.type === "REMINDER_COMPLETED_BACKGROUND") {
          const { reminderId } = e.data.data || {};
          if (reminderId) {
            markAlertDismissed(reminderId);
            closeNotificationForReminder(reminderId);
            clearUrlAlertParams();
            document.title =
              "RemindIQ — Customer Follow-up & Call Reminder System";
            setActiveDueAlert((curr) =>
              curr?._id === reminderId ? null : curr,
            );
            setReminders((prev) =>
              prev.map((r) =>
                r._id === reminderId ? { ...r, status: "completed" } : r,
              ),
            );
            fetchReminders();
          }
          return;
        }

        // Test alarm completion from SW notification action
        if (e.data.type === "TEST_ALARM_COMPLETED") {
          markAlertDismissed("test-alert");
          closeNotificationForReminder("test-alert");
          clearUrlAlertParams();
          document.title =
            "RemindIQ — Customer Follow-up & Call Reminder System";
          setActiveDueAlert((curr) =>
            curr?._id?.startsWith("test-") ? null : curr,
          );
          return;
        }

        if (
          e.data.type === "CALL_REMINDER_NOTIFICATION_CLICK" ||
          e.data.type === "PUSH_ALARM_RECEIVED"
        ) {
          const {
            reminderId,
            name,
            phone,
            userId: msgUserId,
          } = e.data.data || {};

          // User isolation guard: if alert is for another user, never display it here
          if (
            msgUserId &&
            user?._id &&
            String(msgUserId) !== String(user._id)
          ) {
            return;
          }

          if (reminderId) {
            dismissedIdsRef.current.delete(reminderId);

            const target = reminders.find((r) => r._id === reminderId);
            if (target) {
              if (target.status === "pending") {
                setActiveDueAlert(target);
              }
            } else if (
              !msgUserId ||
              (user?._id && String(msgUserId) === String(user._id))
            ) {
              setActiveDueAlert({
                _id: reminderId,
                name: name || "Customer Call Due",
                phone: phone || "",
                dueAt: new Date().toISOString(),
                status: "pending",
              });
            }
          }
        }
      };
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () =>
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    }
  }, [reminders, user]);

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

      // Keep full list for card metrics accurate
      if (filter === "all" && !search.trim()) {
        setAllUserReminders(sorted);
      }

      // Check for in-app and desktop notifications
      checkDuePopups(sorted);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
      toast.error(
        "Network Error",
        "Could not synchronize reminders with server.",
      );
    } finally {
      setLoading(false);
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  const fetchAllUserReminders = async () => {
    try {
      const res = await api.get("/reminders");
      const list = res.data?.data || [];
      setAllUserReminders(list);
    } catch (e) {}
  };

  useEffect(() => {
    fetchAllUserReminders();
  }, []);

  // Immediate fetch on filter, search, or sort change + reset 2-minute timer and page
  useEffect(() => {
    fetchReminders();
    setRefreshSecondsLeft(120);
    setCurrentPage(1);
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
      if (
        isDueNow &&
        !dismissedIdsRef.current.has(r._id) &&
        activeDueAlert?._id !== r._id
      ) {
        setActiveDueAlert(r);

        if ("Notification" in window && Notification.permission === "granted") {
          try {
            // Close any existing notification for this reminder
            closeNotificationForReminder(r._id);

            const tz = r.timezone || "Australia/Sydney";
            const notif = new Notification(`📞 Call Due: ${r.name}`, {
              body: `Phone: ${r.phone} | Due: ${formatInAustralianTime(r.dueAt, tz)}\nNote: ${r.note || "None"}`,
              icon: "/icon-192.png",
              badge: "/badge.png",
              tag: `remindiq-alert-${r._id}`,
              renotify: true,
            });

            notif.onclick = () => {
              window.focus();
              try {
                notif.close();
              } catch (e) {}
              activeDesktopNotifsRef.current.delete(r._id);
            };

            // Hold reference so it can be closed immediately when completed/dismissed
            activeDesktopNotifsRef.current.set(r._id, notif);

            // Auto-close after 25s so it does not linger indefinitely on desktop
            setTimeout(() => {
              try {
                notif.close();
              } catch (e) {}
              activeDesktopNotifsRef.current.delete(r._id);
            }, 25000);
          } catch (e) {}
        }
      }
    });
  };

  const handleCompleteAlert = async (alertItem) => {
    if (!alertItem || isCompletingAlert) return;
    setIsCompletingAlert(true);

    const alertId = alertItem._id;
    const alertName = alertItem.name || "Customer Call";

    // 1. Immediately close active desktop & Service Worker notifications
    closeNotificationForReminder(alertId);

    // 2. Hide alarm banner immediately
    setActiveDueAlert(null);

    // 3. Clear URL query params (alertId, testAlarm)
    clearUrlAlertParams();

    // 4. Reset tab title
    document.title = "RemindIQ — Customer Follow-up & Call Reminder System";

    // 5. Mark dismissed in memory so it does not alert again
    markAlertDismissed(alertId);

    // 6. Test alert handler: acknowledge without invalid database request
    if (
      !alertId ||
      alertId === "test-alert" ||
      String(alertId).startsWith("test-")
    ) {
      toast.success(
        "Test Alarm Completed ✅",
        "Alarm stopped and test notification cleared.",
      );
      setIsCompletingAlert(false);
      return;
    }

    // 7. Optimistic update: mark status 'completed' in local state immediately
    setReminders((prev) =>
      prev.map((r) =>
        r._id === alertId ? { ...r, status: "completed", isOverdue: false } : r,
      ),
    );

    // 8. Explicitly set status: 'completed' in backend database
    try {
      await api.patch(`/reminders/${alertId}`, { status: "completed" });
      toast.success(
        "Completed ✅",
        `Marked follow-up with ${alertName} as finished.`,
      );
      fetchReminders();
      fetchAllUserReminders();
    } catch (err) {
      console.error("[Reminders] Failed to mark completed:", err);
      toast.error(
        "Update Failed",
        "Could not save completion status to server. Please check your connection.",
      );
      fetchReminders();
      fetchAllUserReminders();
    } finally {
      setIsCompletingAlert(false);
    }
  };

  const handleDismissAlert = (alertItem) => {
    if (!alertItem) return;
    closeNotificationForReminder(alertItem._id);
    setActiveDueAlert(null);
    clearUrlAlertParams();
    document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
    markAlertDismissed(alertItem._id);
    toast.info(
      "Alert Dismissed",
      `Silenced alarm for ${alertItem.name || "call"}.`,
    );
  };

  const handleToggleCompleted = async (reminder) => {
    if (!reminder) return;
    if (activeSnooze) setActiveSnooze(null);
    const reminderId = reminder._id;

    // 1. Immediately close any open desktop or SW notification for this reminder
    closeNotificationForReminder(reminderId);

    // Handle test reminders gracefully
    if (
      !reminderId ||
      reminderId === "test-alert" ||
      String(reminderId).startsWith("test-")
    ) {
      if (activeDueAlert?._id === reminderId) setActiveDueAlert(null);
      clearUrlAlertParams();
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
      markAlertDismissed(reminderId);
      toast.info("Test Cleared", "Test reminder removed from view.");
      return;
    }

    const newStatus = reminder.status === "completed" ? "pending" : "completed";

    // If active alert is currently showing or URL parameter is present for this reminder, clear them
    if (
      activeDueAlert?._id === reminderId ||
      searchParams.get("alertId") === reminderId
    ) {
      setActiveDueAlert(null);
      clearUrlAlertParams();
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
    }

    if (newStatus === "completed") {
      markAlertDismissed(reminderId);
    } else {
      // Reopened as pending - allow it to notify if re-scheduled
      dismissedIdsRef.current.delete(reminderId);
    }

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) =>
        r._id === reminderId
          ? {
              ...r,
              status: newStatus,
              isOverdue: newStatus === "completed" ? false : r.isOverdue,
            }
          : r,
      ),
    );

    try {
      await api.patch(`/reminders/${reminderId}`, { status: newStatus });
      if (newStatus === "completed") {
        toast.success(
          "Completed ✅",
          `Marked follow-up with ${reminder.name} as finished.`,
        );
      } else {
        toast.info(
          "Marked Pending ⏳",
          `Call with ${reminder.name} reopened in queue.`,
        );
      }
      fetchReminders();
      fetchAllUserReminders();
    } catch (err) {
      console.error("[Reminders] Toggle status error:", err);
      toast.error(
        "Update Failed",
        "Could not change status. Please check connection.",
      );
      fetchReminders();
      fetchAllUserReminders();
    }
  };

  const handleOpenDelete = (reminder) => {
    setReminderToDelete(reminder);
  };

  const handleDelete = (id, name) => {
    const target = reminders.find((r) => r._id === id) || { _id: id, name };
    setReminderToDelete(target);
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;
    const { _id: id, name } = reminderToDelete;
    setIsDeletingReminder(true);
    closeNotificationForReminder(id);
    if (activeDueAlert?._id === id || searchParams.get("alertId") === id) {
      setActiveDueAlert(null);
      clearUrlAlertParams();
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
    }
    try {
      await api.delete(`/reminders/${id}`);
      toast.info(
        "Reminder Deleted",
        `Removed record for ${name || "customer"}.`,
      );
      setReminderToDelete(null);
      fetchReminders();
      fetchAllUserReminders();
    } catch (err) {
      toast.error(
        "Delete Failed",
        err.response?.data?.message ||
          "Could not remove reminder from database.",
      );
      fetchReminders();
      fetchAllUserReminders();
    } finally {
      setIsDeletingReminder(false);
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
    closeNotificationForReminder(reminder._id);
    if (
      activeDueAlert?._id === reminder._id ||
      searchParams.get("alertId") === reminder._id
    ) {
      setActiveDueAlert(null);
      clearUrlAlertParams();
      document.title = "RemindIQ — Customer Follow-up & Call Reminder System";
    }
    // Remove from dismissed so it alerts again at new due time
    dismissedIdsRef.current.delete(reminder._id);

    try {
      const currentDue = new Date(reminder.dueAt);
      const baseDate = currentDue < new Date() ? new Date() : currentDue;
      const newDue = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);

      // Optimistic update
      setReminders((prev) =>
        prev.map((r) =>
          r._id === reminder._id
            ? {
                ...r,
                dueAt: newDue.toISOString(),
                status: "pending",
                isOverdue: false,
              }
            : r,
        ),
      );

      await api.patch(`/reminders/${reminder._id}`, {
        dueAt: newDue.toISOString(),
        status: "pending",
      });

      toast.success(
        "Call Rescheduled ⏰",
        `Postponed ${reminder.name} to ${formatInAustralianTime(
          newDue.toISOString(),
          reminder.timezone || "Australia/Sydney",
        )} (${label})`,
      );
      fetchReminders();
      fetchAllUserReminders();
    } catch (err) {
      toast.error("Reschedule Failed", "Could not update call schedule.");
      fetchReminders();
      fetchAllUserReminders();
    }
  };

  const countsSource =
    allUserReminders.length > 0 ? allUserReminders : reminders;
  const counts = {
    all: countsSource.length,
    pending: countsSource.filter(
      (r) =>
        r.status === "pending" &&
        !(r.isOverdue || new Date(r.dueAt) < new Date()),
    ).length,
    completed: countsSource.filter((r) => r.status === "completed").length,
    overdue: countsSource.filter(
      (r) =>
        r.status === "pending" &&
        (r.isOverdue || new Date(r.dueAt) < new Date()),
    ).length,
  };

  const completionPercentage =
    counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0;

  // Pagination (10 items per page by default)
  const totalItems = reminders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedReminders = reminders.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const getStatusBadge = (r) => {
    if (r.status === "completed") {
      return (
        <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </span>
      );
    }

    const isOverdue =
      r.isOverdue || (r.status === "pending" && new Date(r.dueAt) < new Date());
    if (isOverdue) {
      return (
        <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-800 bg-rose-500/10 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Overdue</span>
        </span>
      );
    }

    return (
      <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-500/10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pt-2 pb-28 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 w-full">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight liquid-heading">
            All Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 truncate sm:whitespace-normal">
            Manage client appointments and automated follow-ups across
            Australia.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            to="/add"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-500/25 border border-amber-300/40 active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards with REAL WEBSITE DATA - Interactive Filtering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Reminders */}
        <button
          type="button"
          onClick={() => handleFilterClick("all")}
          disabled={isFilterChanging && filterPendingTarget === "all"}
          className={`text-left rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-95 liquid-glass ${
            (filterPendingTarget || filter) === "all"
              ? "ring-2 ring-sky-400/80 shadow-md bg-white/95"
              : "hover:bg-white/85"
          }`}
          title="Click to view all reminders"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Total Reminders</span>
            </div>
            {isFilterChanging && filterPendingTarget === "all" && (
              <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
            )}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                <AnimatedNumber value={counts.all} />
              </span>
              <span className="liquid-glass-pill text-[10px] font-bold text-slate-600 px-2 py-0.5">
                All
              </span>
            </div>
            <svg
              className="w-16 sm:w-20 h-7 shrink-0 text-sky-500"
              viewBox="0 0 80 28"
              fill="none"
            >
              <path
                d="M2 22 C 20 22, 30 14, 45 16 C 60 18, 68 6, 78 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* Card 2: Pending Calls */}
        <button
          type="button"
          onClick={() => handleFilterClick("pending")}
          disabled={isFilterChanging && filterPendingTarget === "pending"}
          className={`text-left rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-95 liquid-glass ${
            (filterPendingTarget || filter) === "pending"
              ? "ring-2 ring-amber-400/80 shadow-md bg-white/95"
              : "hover:bg-white/85"
          }`}
          title="Click to filter pending calls"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Calls</span>
            </div>
            {isFilterChanging && filterPendingTarget === "pending" && (
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            )}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                <AnimatedNumber value={counts.pending} />
              </span>
              <span className="liquid-glass-pill text-[10px] font-bold text-amber-800 bg-amber-500/10 px-2 py-0.5">
                Queue
              </span>
            </div>
            <svg
              className="w-16 sm:w-20 h-7 shrink-0 text-amber-500"
              viewBox="0 0 80 28"
              fill="none"
            >
              <path
                d="M2 24 C 18 24, 28 16, 42 14 C 56 12, 66 18, 78 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* Card 3: Overdue Calls */}
        <button
          type="button"
          onClick={() => handleFilterClick("overdue")}
          disabled={isFilterChanging && filterPendingTarget === "overdue"}
          className={`text-left rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-95 liquid-glass ${
            (filterPendingTarget || filter) === "overdue"
              ? "ring-2 ring-rose-400/80 shadow-md bg-white/95"
              : "hover:bg-white/85"
          }`}
          title="Click to filter overdue calls"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Overdue Calls</span>
            </div>
            {isFilterChanging && filterPendingTarget === "overdue" && (
              <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
            )}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                <AnimatedNumber value={counts.overdue} />
              </span>
              <span
                className={`liquid-glass-pill text-[10px] font-bold px-2 py-0.5 ${
                  counts.overdue > 0
                    ? "text-rose-700 bg-rose-500/10"
                    : "text-slate-500"
                }`}
              >
                {counts.overdue > 0 ? "Urgent" : "0"}
              </span>
            </div>
            <svg
              className={`w-16 sm:w-20 h-7 shrink-0 ${
                counts.overdue > 0 ? "text-rose-500" : "text-slate-300"
              }`}
              viewBox="0 0 80 28"
              fill="none"
            >
              <path
                d="M2 24 C 22 24, 35 10, 50 14 C 65 18, 70 6, 78 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* Card 4: Completed Calls */}
        <button
          type="button"
          onClick={() => handleFilterClick("completed")}
          disabled={isFilterChanging && filterPendingTarget === "completed"}
          className={`text-left rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer active:scale-95 liquid-glass ${
            (filterPendingTarget || filter) === "completed"
              ? "ring-2 ring-emerald-400/80 shadow-md bg-white/95"
              : "hover:bg-white/85"
          }`}
          title="Click to filter completed calls"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Completed Calls</span>
            </div>
            {isFilterChanging && filterPendingTarget === "completed" && (
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            )}
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                <AnimatedNumber value={counts.completed} />
              </span>
              <span className="liquid-glass-pill text-[10px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5">
                {completionPercentage}%
              </span>
            </div>
            <svg
              className="w-16 sm:w-20 h-7 shrink-0 text-emerald-500"
              viewBox="0 0 80 28"
              fill="none"
            >
              <path
                d="M2 22 C 20 22, 32 12, 48 16 C 62 20, 68 6, 78 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Controls Row: Search, Date Filter / Sort, and Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 w-full">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or phone... (/)"
              className="w-full pl-9 pr-8 py-2.5 sm:py-2 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none transition"
            />
            {search ? (
              <button
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-800 p-1 rounded-full transition cursor-pointer"
                title="Clear search (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 top-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Mobile Sort & Refresh row side-by-side */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort selector */}
            <div className="flex-1 sm:flex-none flex items-center gap-1.5 liquid-glass-input rounded-2xl px-3 py-2 text-xs text-slate-700 min-h-10">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer pr-1 w-full"
              >
                <option value="latest">
                  Latest Entry (Newest)
                </option>
                <option value="dueAt_asc">
                  Call Due (Soonest)
                </option>
                <option value="dueAt_desc">
                  Call Due (Latest)
                </option>
              </select>
            </div>

            {/* Refresh action */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full liquid-glass-pill text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer disabled:opacity-50 min-h-10 shrink-0 active:scale-95"
              title="Refresh reminders"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content: Table on Desktop / Cards on Mobile */}
      {loading || isFilterChanging ? (
        <div className="p-12 sm:p-16 text-center text-xs text-slate-500 space-y-4 liquid-glass rounded-3xl animate-pulse">
          <div className="w-12 h-12 rounded-2xl liquid-glass-pill flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm sm:text-base text-slate-800">
              {isFilterChanging
                ? `Updating ${
                    filterPendingTarget === "all"
                      ? "All Reminders"
                      : filterPendingTarget === "pending"
                        ? "Pending Calls"
                        : filterPendingTarget === "overdue"
                          ? "Overdue Calls"
                          : "Completed Calls"
                  }...`
                : "Loading follow-up reminders..."}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Synchronizing customer schedules & due timestamps
            </p>
          </div>
          {/* Skeleton placeholder rows */}
          <div className="max-w-md mx-auto space-y-2 pt-2">
            <div className="h-3.5 bg-slate-200/60 rounded-full w-full mx-auto" />
            <div className="h-3 bg-slate-200/40 rounded-full w-4/5 mx-auto" />
          </div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="p-12 text-center liquid-glass rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl liquid-glass-pill flex items-center justify-center mx-auto text-slate-500">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-slate-900">
              No reminders found
            </p>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
              {search
                ? `No customers match "${search}". Try clearing search or filters.`
                : filter !== "all"
                  ? `No ${filter} reminders right now. All caught up!`
                  : "Your customer reminder schedule is clear. Add a reminder to get started."}
            </p>
          </div>
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="liquid-glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search Query</span>
            </button>
          ) : filter !== "all" ? (
            <button
              onClick={() => handleFilterClick("all")}
              className="liquid-glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View All Reminders</span>
            </button>
          ) : (
            <Link
              to="/add"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/25 border border-amber-300/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reminder</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto liquid-glass rounded-3xl smooth-page-enter">
            <table className="w-full text-left border-collapse min-w-155 xl:min-w-220">
              <thead>
                <tr className="border-b border-slate-200/80 bg-white/40 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 pl-5 sm:pl-6 pr-3">Customer</th>
                  <th className="hidden xl:table-cell py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-3 sm:px-4">Due Date & Time (AU)</th>
                  <th className="py-3.5 px-3 sm:px-4">Status</th>
                  <th className="py-3.5 pl-2 pr-4 sm:pl-4 sm:pr-6 text-right">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs">
                {paginatedReminders.map((r) => {
                  const tz = r.timezone || "Australia/Sydney";
                  const initials = (r.name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-white/60 transition-colors group"
                    >
                      {/* Customer: Name, Notes, Phone, and (on tablet) inline Email */}
                      <td className="py-3.5 pl-5 sm:pl-6 pr-3">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-9 h-9 rounded-2xl liquid-glass-pill flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-600 transition flex items-center gap-1.5">
                              <span className="truncate max-w-32.5 sm:max-w-none">
                                {r.name}
                              </span>
                              {r.note && (
                                <span
                                  className="hidden xl:inline text-[10px] px-2 py-0.5 rounded-full liquid-glass-pill text-slate-600 truncate max-w-48 font-medium"
                                  title={r.note}
                                >
                                  {r.note}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <a
                                href={`tel:${r.phone}`}
                                className="inline-flex items-center gap-1 font-mono text-[11px] sm:text-xs text-slate-600 hover:text-slate-900 transition font-medium"
                                title="Click to call customer"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{r.phone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyText(r.phone, "Phone")}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                                title="Copy phone"
                              >
                                {copiedId === r.phone ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              {/* On tablet (< xl screens), show email right here so Contact column isn't required */}
                              {r.email && (
                                <span className="xl:hidden inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 truncate max-w-37.5 font-medium">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{r.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact: Email & Address (Visible on large screens >= xl) */}
                      <td className="hidden xl:table-cell py-3.5 px-4 text-slate-700">
                        {r.email ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <a
                              href={`mailto:${r.email}`}
                              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-44">
                                {r.email}
                              </span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyText(r.email, "Email")}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                              title="Copy email address"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : r.address ? (
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-44">
                              {r.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Due Date & Time in AU timezone */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full liquid-glass-pill font-mono text-[11px] sm:text-xs text-slate-700 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        {getStatusBadge(r)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 pl-2 pr-4 sm:pl-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Phone Call Button */}
                          <a
                            href={`tel:${r.phone}`}
                            className="p-2 rounded-xl liquid-glass-pill text-slate-600 hover:text-emerald-600 transition"
                            title={`Call ${r.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>

                          {/* Quick Snooze Popover Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeSnooze?.reminder?._id === r._id) {
                                setActiveSnooze(null);
                              } else {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setActiveSnooze({
                                  reminder: r,
                                  anchorRect: rect,
                                });
                              }
                            }}
                            className={`p-2 rounded-xl liquid-glass-pill text-xs transition cursor-pointer ${
                              activeSnooze?.reminder?._id === r._id
                                ? "ring-2 ring-amber-400 text-amber-600 font-bold bg-amber-500/10"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                            title="Quick Reschedule / Snooze"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>

                          {/* Complete Toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompleted(r);
                            }}
                            className={`p-2 rounded-xl liquid-glass-pill text-xs transition cursor-pointer flex items-center justify-center ${
                              r.status === "completed"
                                ? "text-emerald-700 bg-emerald-500/15"
                                : "text-slate-500 hover:text-emerald-600"
                            }`}
                            title={
                              r.status === "completed"
                                ? "Completed (Click to mark as pending)"
                                : "Click to mark as completed"
                            }
                          >
                            {r.status === "completed" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => setEditingReminder(r)}
                            className="p-2 rounded-xl liquid-glass-pill text-slate-600 hover:text-slate-900 transition cursor-pointer"
                            title="Edit Full Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDelete(r)}
                            className="p-2 rounded-xl liquid-glass-pill text-slate-500 hover:text-rose-600 transition cursor-pointer"
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
          <div className="md:hidden space-y-3.5 smooth-page-enter">
            {paginatedReminders.map((r) => {
              const tz = r.timezone || "Australia/Sydney";
              const initials = (r.name || "C")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={r._id}
                  className="liquid-glass rounded-2xl p-4.5 space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl liquid-glass-pill flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {r.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${r.phone}`}
                            className="text-xs text-slate-600 hover:text-slate-900 font-mono inline-flex items-center gap-1 font-medium"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{r.phone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(r.phone, "Phone")}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {copiedId === r.phone ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>{getStatusBadge(r)}</div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5 pt-2.5 border-t border-slate-200/60">
                    <div className="flex items-center justify-between gap-1.5 font-mono text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formatInAustralianTime(r.dueAt, tz)}</span>
                      </div>
                    </div>

                    {r.email && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`mailto:${r.email}`}
                          className="hover:text-slate-900 truncate"
                        >
                          {r.email}
                        </a>
                      </div>
                    )}

                    {r.note && (
                      <div className="p-2.5 rounded-xl liquid-glass-pill text-slate-600 text-[11px] italic mt-1 font-medium">
                        "{r.note}"
                      </div>
                    )}
                  </div>

                  {/* Mobile Actions with Quick Snooze */}
                  <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${r.phone}`}
                      className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-500/20"
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
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setActiveSnooze({ reminder: r, anchorRect: rect });
                          }
                        }}
                        className={`w-9 h-9 rounded-xl text-xs liquid-glass-pill transition flex items-center justify-center active:scale-90 cursor-pointer ${
                          activeSnooze?.reminder?._id === r._id
                            ? "ring-2 ring-amber-400 text-amber-600 font-bold bg-amber-500/10"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Quick Reschedule / Snooze"
                      >
                        <CalendarClock className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCompleted(r);
                        }}
                        className={`h-9 px-3 rounded-xl text-xs font-bold liquid-glass-pill transition active:scale-90 cursor-pointer flex items-center gap-1.5 ${
                          r.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "text-slate-600 hover:text-emerald-600"
                        }`}
                        title={
                          r.status === "completed"
                            ? "Completed (Click to mark as pending)"
                            : "Click to mark as completed"
                        }
                      >
                        {r.status === "completed" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mark Done</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setEditingReminder(r)}
                        className="w-9 h-9 rounded-xl liquid-glass-pill text-slate-600 hover:text-slate-900 transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenDelete(r)}
                        className="w-9 h-9 rounded-xl liquid-glass-pill text-slate-500 hover:text-rose-600 transition flex items-center justify-center active:scale-90 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl liquid-glass text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span>
                  Showing{" "}
                  <span className="font-bold text-slate-900">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-900">{endIndex}</span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-900">{totalItems}</span>{" "}
                  leads
                </span>

                <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-300/40">
                  <span className="text-slate-500 hidden sm:inline">
                    Per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="liquid-glass-input text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer font-semibold bg-white/70 shadow-2xs border border-white/60"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Complete Pagination Controls (Always visible for perfect UI balance) */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:text-slate-700 transition cursor-pointer active:scale-95"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:text-slate-700 transition flex items-center gap-1 cursor-pointer active:scale-95 text-xs font-semibold"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                </div>

                {/* Compact Mobile Page Indicator */}
                <span className="sm:hidden text-xs font-bold text-slate-800 px-2 font-mono">
                  {currentPage} / {totalPages}
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
                    const isCurrent = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                          isCurrent
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40"
                            : "liquid-glass-pill text-slate-700 hover:text-slate-900"
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
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:text-slate-700 transition flex items-center gap-1 cursor-pointer active:scale-95 text-xs font-semibold"
                    title="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(totalPages);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl liquid-glass-pill text-slate-700 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:text-slate-700 transition cursor-pointer active:scale-95"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
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
            fetchAllUserReminders();
            toast.success(
              "Updated ✨",
              "Reminder details updated successfully.",
            );
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

      {/* Delete Reminder Confirmation Modal */}
      <DeleteReminderModal
        isOpen={!!reminderToDelete}
        reminder={reminderToDelete}
        onClose={() => {
          if (!isDeletingReminder) setReminderToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingReminder}
      />
    </div>
  );
}
