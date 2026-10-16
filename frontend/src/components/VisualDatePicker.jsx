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
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm text-left transition cursor-pointer ${
          isOpen
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-slate-900/90 text-white shadow-inner'
            : 'border-white/[0.08] bg-slate-950/70 text-slate-200 hover:border-white/[0.15] hover:bg-slate-900/60 shadow-inner'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className={value ? 'font-medium text-white' : 'text-slate-500'}>
            {value ? formatDisplayDate(value) : 'Click to select date from calendar...'}
          </span>
        </div>
        <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          📅 Calendar
        </span>
      </button>

      {/* Visual Calendar Modal (Rendered via Portal to prevent clipping) */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-slate-900/95 border border-white/[0.1] rounded-2xl shadow-2xl p-5 space-y-3 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-400" />
                  <span>Select Call Date</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1.5 pb-2 text-xs overflow-x-auto scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium whitespace-nowrap cursor-pointer transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium whitespace-nowrap cursor-pointer transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium whitespace-nowrap cursor-pointer transition"
                >
                  In 2 Days
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(7)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium whitespace-nowrap cursor-pointer transition"
                >
                  Next Week
                </button>
              </div>

              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between py-2 px-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-800/80 uppercase">
                {DAYS_OF_WEEK.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 pt-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8" />;
                  }
                  const selected = isSelected(day);
                  const current = isToday(day);

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={`h-8 w-8 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                        selected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-105 ring-2 ring-indigo-400/40'
                          : current
                          ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-indigo-400 font-mono">
                  {value ? formatDisplayDate(value) : 'Select a date above'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
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
