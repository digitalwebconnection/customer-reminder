import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function VisualDatePicker({
  value,
  onChange,
  label = 'Call Date',
  required = true,
  minDate, // Optional ISO date 'YYYY-MM-DD', defaults to today
  timezone, // Optional timezone (e.g. 'Australia/Sydney', 'Asia/Kolkata')
}) {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Calculate today's date in target timezone or browser timezone as 'YYYY-MM-DD'
  const todayStr = useMemo(() => {
    if (minDate) return minDate;
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone || undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date()); // Outputs "YYYY-MM-DD"
    } catch (e) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }
  }, [minDate, timezone]);

  const [minYear, minMonth, minDay] = useMemo(() => {
    return todayStr.split('-').map(Number);
  }, [todayStr]);

  // Parse initial selected date or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDate) {
      const pad = (n) => String(n).padStart(2, '0');
      const selStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      if (selStr >= todayStr) {
        return selectedDate.getFullYear();
      }
    }
    return minYear;
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const pad = (n) => String(n).padStart(2, '0');
      const selStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      if (selStr >= todayStr) {
        return selectedDate.getMonth();
      }
    }
    return minMonth - 1;
  });

  // When calendar opens, make sure view is at selected date or current month
  useEffect(() => {
    if (isOpen) {
      if (value && value >= todayStr) {
        const [y, m] = value.split('-').map(Number);
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      } else {
        setCurrentYear(minYear);
        setCurrentMonth(minMonth - 1);
      }
    }
  }, [isOpen, value, todayStr, minYear, minMonth]);

  // Close calendar popup on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Check if navigating to previous month is disabled (cannot navigate to past months)
  const isPrevMonthDisabled =
    currentYear < minYear || (currentYear === minYear && currentMonth <= minMonth - 1);

  const prevMonth = (e) => {
    e.stopPropagation();
    if (isPrevMonthDisabled) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return new Intl.DateTimeFormat('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch (e) {
      return dateStr;
    }
  };

  const pad = (n) => String(n).padStart(2, '0');

  // Check if a specific day is in the past
  const isPastDay = (day) => {
    if (!day) return false;
    const dateFormatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return dateFormatted < todayStr;
  };

  const isToday = (day) => {
    if (!day) return false;
    const dateFormatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return dateFormatted === todayStr;
  };

  const isSelected = (day) => {
    if (!day || !value) return false;
    const dateFormatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    return dateFormatted === value;
  };

  const handleSelectDay = (day) => {
    if (!day || isPastDay(day)) return; // Strictly prevent selecting past dates
    const dateFormatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    onChange(dateFormatted);
    setIsOpen(false);
  };

  const setQuickDate = (offsetDays) => {
    if (offsetDays < 0) return; // Only allow today or future presets
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    onChange(dateFormatted);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setIsOpen(false);
  };

  // Build calendar matrix (Monday = 0)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm text-left transition cursor-pointer ${
          isOpen
            ? 'border-zinc-500 ring-1 ring-zinc-500/30 bg-zinc-900 text-white shadow-inner'
            : 'border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 shadow-inner'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className={value ? 'font-medium text-white' : 'text-zinc-500'}>
            {value ? formatDisplayDate(value) : 'Click to select date from calendar...'}
          </span>
        </div>
        <span className="text-xs text-zinc-300 font-mono bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
          📅 Calendar
        </span>
      </button>

      {/* Visual Calendar Modal (Rendered via Portal to prevent clipping) */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-zinc-400" />
                    <span>Select Call Date</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    Future Dates Only
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-90"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            

              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between py-2 px-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  disabled={isPrevMonthDisabled}
                  onClick={prevMonth}
                  className={`p-2 rounded-lg transition ${
                    isPrevMonthDisabled
                      ? 'text-zinc-700 opacity-20 cursor-not-allowed pointer-events-none'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer active:scale-90'
                  }`}
                  title={isPrevMonthDisabled ? 'Past months cannot be selected' : 'Previous Month'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-white tracking-wide">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-90"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 py-1 border-b border-zinc-800/80 uppercase">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Calendar Grid with Touch / Swipe Sliding */}
              <div
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                  touchStartY.current = e.touches[0].clientY;
                }}
                onTouchEnd={(e) => {
                  const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                  const deltaY = e.changedTouches[0].clientY - touchStartY.current;
                  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
                    if (deltaX < 0) {
                      nextMonth();
                    } else if (!isPrevMonthDisabled) {
                      prevMonth();
                    }
                  }
                }}
                className="grid grid-cols-7 gap-1 pt-1 select-none touch-pan-y"
              >
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-9 w-9" />;
                  }
                  const selected = isSelected(day);
                  const current = isToday(day);
                  const isPast = isPastDay(day);

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleSelectDay(day)}
                      title={
                        isPast
                          ? 'Past date (Cannot be selected)'
                          : current
                          ? 'Today (Available)'
                          : `Select ${day} ${MONTHS[currentMonth]}`
                      }
                      className={`h-9 w-9 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition ${
                        isPast
                          ? 'text-zinc-600 bg-zinc-950/40 opacity-30 cursor-not-allowed pointer-events-none line-through'
                          : selected
                          ? 'bg-white text-zinc-950 font-bold scale-105 shadow-md ring-2 ring-zinc-400/40 cursor-pointer active:scale-90'
                          : current
                          ? 'bg-zinc-800 text-amber-300 border border-amber-500/50 font-bold hover:bg-zinc-700 cursor-pointer active:scale-90 shadow-xs'
                          : 'text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer active:scale-90'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono text-xs truncate max-w-50">
                  {value ? formatDisplayDate(value) : 'Select today or future date'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
