import React, { useState, useEffect } from 'react';
import { X, BellRing, Clock, Calendar, AlertCircle, Check, Users } from 'lucide-react';
import api from '../api/axios';
import { useTimezone } from '../context/TimezoneContext';

export default function ReminderModal({ isOpen, onClose, preselectedCustomer, onSaved }) {
  const { timezone } = useTimezone();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('Follow-up call');
  const [dueDateTime, setDueDateTime] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default datetime to 30 mins from now formatted for input[type="datetime-local"]
  const getInitialDateTime = (offsetMinutes = 30) => {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      api.get('/customers')
        .then((res) => {
          setCustomers(res.data.data || []);
          if (preselectedCustomer) {
            setCustomerId(preselectedCustomer._id);
          } else if (res.data.data?.length > 0 && !customerId) {
            setCustomerId(res.data.data[0]._id);
          }
        })
        .catch(() => {});

      setDueDateTime(getInitialDateTime(30));
      setTitle('Follow-up call');
      setPriority('normal');
      setNotes('');
      setError('');
    }
  }, [isOpen, preselectedCustomer]);

  if (!isOpen) return null;

  const applyPreset = (minutes) => {
    setDueDateTime(getInitialDateTime(minutes));
  };

  const applyTomorrowPreset = (hour) => {
    const d = new Date(Date.now() + 86400000);
    d.setHours(hour, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    setDueDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (!dueDateTime) {
      setError('Please choose a due date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        customerId,
        title: title.trim(),
        dueAt: new Date(dueDateTime).toISOString(),
        timezone,
        priority,
        notes: notes.trim(),
      };

      await api.post('/reminders', payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Schedule Call Reminder</h3>
              <p className="text-[11px] text-indigo-400 font-mono">Timezone: {timezone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Customer <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone}) {c.company ? `— ${c.company}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reminder Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Reminder Subject</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow-up on pricing proposal"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Due Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Call Due Date & Time <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Australian local time</span>
            </div>
            <input
              type="datetime-local"
              required
              value={dueDateTime}
              onChange={(e) => setDueDateTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition font-mono"
            />

            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(15)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                +15 mins
              </button>
              <button
                type="button"
                onClick={() => applyPreset(60)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                +1 hour
              </button>
              <button
                type="button"
                onClick={() => applyTomorrowPreset(9)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Tomorrow 9 AM
              </button>
              <button
                type="button"
                onClick={() => applyTomorrowPreset(14)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Tomorrow 2 PM
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'normal', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 text-xs font-medium rounded-xl capitalize border transition ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : p === 'normal'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-700 text-slate-200 border-slate-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Call Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Call Objectives & Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What to ask, questions to resolve, or quote points..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Scheduling...' : 'Set Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
