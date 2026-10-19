import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Check, X } from 'lucide-react';

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function VisualTimePicker({ value, onChange, label = 'Call Time', required = true, timezoneHint }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse value ('HH:mm') into hour (1-12), minute ('00'), period ('AM'|'PM')
  const parseTime = (val) => {
    if (!val) return { hour: '10', minute: '00', period: 'AM' };
    const [hStr, mStr] = val.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return { hour: String(h), minute: m, period };
  };

  const parsed = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
    }
  }, [value]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const formatDisplayTime = (val) => {
    if (!val) return '';
    const { hour, minute, period } = parseTime(val);
    return `${hour.padStart(2, '0')}:${minute} ${period}`;
  };

  const emitTime = (h, m, p) => {
    let hNum = parseInt(h, 10);
    if (p === 'PM' && hNum < 12) hNum += 12;
    if (p === 'AM' && hNum === 12) hNum = 0;
    const time24 = `${String(hNum).padStart(2, '0')}:${m}`;
    onChange(time24);
  };

  const handleHourSelect = (h) => {
    setSelectedHour(h);
    emitTime(h, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (m) => {
    setSelectedMinute(m);
    emitTime(selectedHour, m, selectedPeriod);
  };

  const handlePeriodSelect = (p) => {
    setSelectedPeriod(p);
    emitTime(selectedHour, selectedMinute, p);
  };

  const handleQuickPreset = (h, m, p) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    emitTime(h, m, p);
    setIsOpen(false);
  };

  const handleRelativePreset = (minutesToAdd) => {
    const d = new Date(Date.now() + minutesToAdd * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const time24 = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    onChange(time24);
    setIsOpen(false);
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
          <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className={value ? 'font-medium font-mono text-white text-sm' : 'text-zinc-500'}>
            {value ? formatDisplayTime(value) : 'Click to select time...'}
          </span>
        </div>
        <span className="text-xs text-zinc-300 font-mono bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
          🕒 Pick Time
        </span>
      </button>

      {timezoneHint && (
        <p className="text-[11px] text-zinc-400 mt-1 font-mono">
          {timezoneHint}
        </p>
      )}

      {/* Visual Time Modal (Rendered via Portal to prevent modal clipping) */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 backdrop-blur-2xl max-h-[92dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>Select Call Time</span>
                  </h4>
                  {timezoneHint && (
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{timezoneHint}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pb-1 text-xs overflow-x-auto touch-pan-x overscroll-x-contain scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => handleRelativePreset(15)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleRelativePreset(60)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  +1h
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('9', '00', 'AM')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  9:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('11', '30', 'AM')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  11:30 AM
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('2', '00', 'PM')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  2:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('4', '30', 'PM')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-medium cursor-pointer transition shrink-0 active:scale-95"
                >
                  4:30 PM
                </button>
              </div>

              {/* Time Display and AM/PM Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <span className="text-xl font-bold font-mono text-white tracking-wider">
                  {selectedHour.padStart(2, '0')}:{selectedMinute}
                </span>

                <div className="flex items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800">
                  {['AM', 'PM'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePeriodSelect(p)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer active:scale-95 ${
                        selectedPeriod === p
                          ? 'bg-white text-zinc-950 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours Grid */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Select Hour
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {HOURS.map((h) => {
                    const active = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleHourSelect(h)}
                        className={`h-10 rounded-xl text-xs font-bold transition cursor-pointer active:scale-90 ${
                          active
                            ? 'bg-white text-zinc-950 shadow-md ring-2 ring-zinc-400/40'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/80'
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes Grid */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Select Minute
                </span>
                <div className="grid grid-cols-6 gap-1.5">
                  {MINUTES.map((m) => {
                    const active = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMinuteSelect(m)}
                        className={`h-9 rounded-xl text-xs font-mono font-bold transition cursor-pointer active:scale-90 ${
                          active
                            ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/80'
                        }`}
                      >
                        :{m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 font-bold">
                  {formatDisplayTime(value) || `${selectedHour.padStart(2, '0')}:${selectedMinute} ${selectedPeriod}`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-95"
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
