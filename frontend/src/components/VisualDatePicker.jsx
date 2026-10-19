import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function VisualDatePicker({ value, onChange, label = 'Call Date', required = true }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial selected date or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(() => (selectedDate ? selectedDate.getFullYear() : today.getFullYear()));
  const [currentMonth, setCurrentMonth] = useState(() => (selectedDate ? selectedDate.getMonth() : today.getMonth()));

  // Close calendar popup on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const prevMonth = (e) => {
    e.stopPropagation();
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

  const handleSelectDay = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    onChange(dateFormatted);
    setIsOpen(false);
  };

  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    onChange(dateFormatted);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setIsOpen(false);
  };

  // Build calendar matrix
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isToday = (day) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

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
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-zinc-400" />
                  <span>Select Call Date</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 pb-2 text-xs overflow-x-auto touch-pan-x overscroll-x-contain scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium whitespace-nowrap cursor-pointer transition shrink-0 active:scale-95"
                >
                  Next Week
                </button>
              </div>

              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between py-2 px-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-90"
                  title="Previous Month"
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

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 pt-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-9 w-9" />;
                  }
                  const selected = isSelected(day);
                  const current = isToday(day);

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-9 w-9 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer active:scale-90 ${
                        selected
                          ? 'bg-white text-zinc-950 font-bold scale-105 shadow-md ring-2 ring-zinc-400/40'
                          : current
                          ? 'bg-zinc-800 text-zinc-100 border border-zinc-600 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono text-xs">
                  {value ? formatDisplayDate(value) : 'Select a date above'}
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
