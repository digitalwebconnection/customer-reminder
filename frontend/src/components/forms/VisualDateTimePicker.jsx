import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

/**
 * Format date (YYYY-MM-DD) and time (HH:mm) into "DD/MM/YYYY HH:mm"
 */
function formatDisplay(dateStr, timeStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return "";
  const datePart = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  if (!timeStr) return datePart;
  return `${datePart} ${timeStr}`;
}

export default function VisualDateTimePicker({
  value,
  date: propDate,
  time: propTime,
  onDateChange,
  onTimeChange,
  onChange,
  label = "SELECT DATE & TIME",
  required = true,
  minDate,
  timezone,
  error,
  disabled = false,
  className = "",
}) {
  // Support both (date, time) and (value as object or string)
  const date =
    propDate ?? (typeof value === "object" ? value?.date : value) ?? "";
  const time = propTime ?? (typeof value === "object" ? value?.time : "") ?? "";

  const [isOpen, setIsOpen] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const hoursListRef = useRef(null);
  const minutesListRef = useRef(null);

  // Compute today's date in target timezone or browser timezone as 'YYYY-MM-DD'
  const todayStr = useMemo(() => {
    if (minDate) return minDate;
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone || undefined,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(new Date()); // "YYYY-MM-DD"
    } catch {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }
  }, [minDate, timezone]);

  const [minYear, minMonth] = useMemo(() => {
    return todayStr.split("-").map(Number);
  }, [todayStr]);

  // Calendar navigation state (year & month index 0-11)
  const [viewYear, setViewYear] = useState(() => {
    if (date) {
      const [y] = date.split("-").map(Number);
      if (y) return y;
    }
    return minYear;
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (date) {
      const [, m] = date.split("-").map(Number);
      if (m) return m - 1;
    }
    return minMonth - 1;
  });

  // Current selected hour & minute parsed
  const selectedHour = useMemo(() => {
    if (!time) return "10";
    const [h] = time.split(":");
    return h ? h.padStart(2, "0") : "10";
  }, [time]);

  const selectedMinute = useMemo(() => {
    if (!time) return "00";
    const [, m] = time.split(":");
    return m ? m.padStart(2, "0") : "00";
  }, [time]);

  // Sync calendar view month/year when popover opens
  useEffect(() => {
    if (isOpen) {
      if (date) {
        const [y, m] = date.split("-").map(Number);
        if (y && m) {
          setViewYear(y);
          setViewMonth(m - 1);
        }
      }
      setShowMonthYearPicker(false);
    }
  }, [isOpen, date]);

  // Popover positioning
  const [coords, setCoords] = useState({ top: 0, left: 0, openUpward: false });

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const popoverHeight = 230;
    const popoverWidth = 320;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }

    setCoords({
      top: openUpward ? rect.top - popoverHeight - 6 : rect.bottom + 6,
      left,
      openUpward,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // Auto-scroll selected hour & minute into view when opened or changed
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (hoursListRef.current) {
          const hourIdx = parseInt(selectedHour, 10);
          if (!isNaN(hourIdx)) {
            hoursListRef.current.scrollTop = Math.max(0, hourIdx * 28 - 28);
          }
        }
        if (minutesListRef.current) {
          const minIdx = parseInt(selectedMinute, 10);
          if (!isNaN(minIdx)) {
            minutesListRef.current.scrollTop = Math.max(0, minIdx * 28 - 28);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Month navigation
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Calendar cells generation (6 rows x 7 columns = 42 cells)
  const calendarDays = useMemo(() => {
    const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    const pad = (n) => String(n).padStart(2, "0");

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYearNum = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateString = `${prevYearNum}-${pad(prevMonthIdx + 1)}-${pad(dayNum)}`;
      cells.push({
        day: dayNum,
        dateString,
        isCurrentMonth: false,
        isPrevMonth: true,
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateString = `${viewYear}-${pad(viewMonth + 1)}-${pad(dayNum)}`;
      cells.push({
        day: dayNum,
        dateString,
        isCurrentMonth: true,
      });
    }

    // Only expand to 42 cells (6 rows) if the month actually requires it
    // Otherwise 35 cells (5 rows) or 28 cells (4 rows) eliminates extra trailing week rows
    const targetCount = cells.length > 35 ? 42 : cells.length > 28 ? 35 : 28;
    const remaining = targetCount - cells.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYearNum = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateString = `${nextYearNum}-${pad(nextMonthIdx + 1)}-${pad(dayNum)}`;
      cells.push({
        day: dayNum,
        dateString,
        isCurrentMonth: false,
        isNextMonth: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Handlers for selection
  const handleSelectDate = (dateStr) => {
    if (onDateChange) onDateChange(dateStr);
    if (onChange)
      onChange({
        date: dateStr,
        time: time || `${selectedHour}:${selectedMinute}`,
      });

    // If time wasn't set yet, automatically default it so the user has a full date & time ready
    if (!time && onTimeChange) {
      onTimeChange(`${selectedHour}:${selectedMinute}`);
    }
  };

  const handleSelectHour = (h) => {
    const newTime = `${h}:${selectedMinute}`;
    if (onTimeChange) onTimeChange(newTime);
    if (onChange) onChange({ date: date || todayStr, time: newTime });

    // If date wasn't set, default to today
    if (!date && onDateChange) {
      onDateChange(todayStr);
    }
  };

  const handleSelectMinute = (m) => {
    const newTime = `${selectedHour}:${m}`;
    if (onTimeChange) onTimeChange(newTime);
    if (onChange) onChange({ date: date || todayStr, time: newTime });

    // If date wasn't set, default to today
    if (!date && onDateChange) {
      onDateChange(todayStr);
    }
  };

  const handleClear = () => {
    if (onDateChange) onDateChange("");
    if (onTimeChange) onTimeChange("");
    if (onChange) onChange({ date: "", time: "" });
    setIsOpen(false);
  };

  const handleToday = () => {
    const [y, m] = todayStr.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    if (onDateChange) onDateChange(todayStr);
    if (!time && onTimeChange)
      onTimeChange(`${selectedHour}:${selectedMinute}`);
    if (onChange)
      onChange({
        date: todayStr,
        time: time || `${selectedHour}:${selectedMinute}`,
      });
  };

  const displayValue = formatDisplay(date, time);

  // Popover Component Content (Rendered via Portal)
  const popoverContent = isOpen && (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="bg-zinc-950 border border-zinc-800  shadow-2xl shadow-black/90 text-zinc-100 ring-1 ring-white/10 select-none animate-in fade-in zoom-in-95 duration-150 overflow-hidden w-79 max-w-79"
    >
      <div className="flex flex-row">
        {/* ======================================================== */}
        {/* LEFT PANEL: MONTHLY CALENDAR                            */}
        {/* ======================================================== */}
        <div className="p-2.5 flex-1 min-w-51">
          {/* Calendar Header: Month/Year Dropdown & Nav Arrows */}
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-zinc-800/80">
            <button
              type="button"
              onClick={() => setShowMonthYearPicker((prev) => !prev)}
              className="flex items-center gap-1 text-xs font-bold text-white hover:text-blue-400 transition cursor-pointer px-1 py-0.5 rounded-md hover:bg-zinc-900"
            >
              <span>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Up / Down Navigation Arrows matching the screenshot */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-5.5 h-5.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition flex items-center justify-center cursor-pointer"
                title="Previous Month"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-5.5 h-5.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition flex items-center justify-center cursor-pointer"
                title="Next Month"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Quick Month/Year Selector Overlay */}
          {showMonthYearPicker ? (
            <div className="py-2 grid grid-cols-3 gap-1.5 h-43.75 content-start overflow-y-auto">
              {MONTHS.map((mName, idx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setShowMonthYearPicker(false);
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    viewMonth === idx
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {mName.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Day of Week Labels: Mo Tu We Th Fr Sa Su */}
              <div className="grid grid-cols-7 gap-0.5 text-center py-1 text-[10px] font-semibold text-zinc-400 border-b border-zinc-800/50">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="py-0.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Dynamic Calendar Grid (5 rows or 6 rows only if strictly needed) */}
              <div className="grid grid-cols-7 gap-0.5 pt-1.5">
                {calendarDays.map((c) => {
                  const isSelected = date === c.dateString;
                  const isToday = todayStr === c.dateString;
                  const isPast = c.dateString < todayStr;

                  return (
                    <button
                      key={c.dateString}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleSelectDate(c.dateString)}
                      className={`h-6.5 w-6.5 mx-auto rounded-sm text-[11px] flex items-center justify-center transition cursor-pointer font-medium ${
                        isSelected
                          ? "bg-blue-600 text-white font-bold ring-1 ring-zinc-900 border border-blue-400 shadow-xs"
                          : isToday
                            ? "border border-blue-500/80 text-blue-400 hover:bg-blue-500/10"
                            : !c.isCurrentMonth
                              ? "text-zinc-600 hover:text-zinc-400"
                              : isPast
                                ? "text-zinc-700 cursor-not-allowed opacity-35"
                                : "text-zinc-200 hover:bg-zinc-800/80 hover:text-white"
                      }`}
                    >
                      {c.day}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: DUAL-COLUMN TIME PICKER (Hours & Minutes)  */}
        {/* ======================================================== */}
        <div className="border-l border-zinc-800/80 flex divide-x divide-zinc-800/60 bg-zinc-950/80 shrink-0">
          {/* Hours Column */}
          <div
            ref={hoursListRef}
            className="w-11 h-54 overflow-y-auto select-none py-0.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {HOURS.map((h) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectHour(h)}
                  className={`w-full h-7 flex items-center justify-center text-xs font-mono font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold"
                      : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Minutes Column */}
          <div
            ref={minutesListRef}
            className="w-11 h-54 overflow-y-auto select-none py-0.5 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {MINUTES.map((m) => {
              const isSelected = selectedMinute === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMinute(m)}
                  className={`w-full h-7 flex items-center justify-center text-xs font-mono font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold"
                      : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label matching the screenshot */}
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input box displaying "DD/MM/YYYY HH:mm" with calendar icon */}
      <div
        ref={inputRef}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition cursor-pointer bg-zinc-900/80 hover:border-zinc-700 text-zinc-100 ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
            : error
              ? "border-rose-500"
              : "border-zinc-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`font-mono text-xs sm:text-sm tracking-wide ${
            displayValue ? "text-zinc-100 font-semibold" : "text-zinc-500"
          }`}
        >
          {displayValue || "DD/MM/YYYY HH:mm"}
        </span>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {/* Portal Dropdown */}
      {typeof document !== "undefined" &&
        createPortal(popoverContent, document.body)}
    </div>
  );
}
