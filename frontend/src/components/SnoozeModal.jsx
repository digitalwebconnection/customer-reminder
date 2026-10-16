import React, { useState } from 'react';
import { X, Clock, Calendar, Check } from 'lucide-react';
import api from '../api/axios';

export default function SnoozeModal({ isOpen, onClose, reminder, onSnoozed }) {
  const [customDateTime, setCustomDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !reminder) return null;

  const handleSnoozeMinutes = async (minutes) => {
    setLoading(true);
    try {
      await api.post(`/reminders/${reminder._id}/snooze`, { minutes });
      onSnoozed();
      onClose();
    } catch (err) {
      alert('Failed to snooze reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customDateTime) return;
    setLoading(true);
    try {
      await api.post(`/reminders/${reminder._id}/snooze`, { dueAt: new Date(customDateTime).toISOString() });
      onSnoozed();
      onClose();
    } catch (err) {
      alert('Failed to reschedule reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Snooze / Reschedule Call</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400">
            Reschedule reminder for <span className="text-slate-200 font-medium">{reminder.customer?.name}</span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '+15 Minutes', mins: 15 },
              { label: '+30 Minutes', mins: 30 },
              { label: '+1 Hour', mins: 60 },
              { label: '+3 Hours', mins: 180 },
              { label: '+1 Day', mins: 1440 },
              { label: '+2 Days', mins: 2880 },
            ].map((btn) => (
              <button
                key={btn.mins}
                type="button"
                disabled={loading}
                onClick={() => handleSnoozeMinutes(btn.mins)}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-indigo-600/20 hover:border-indigo-500/30 transition disabled:opacity-50"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-[11px] font-medium text-slate-400">Or pick custom date & time</label>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !customDateTime}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Reschedule Call</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
