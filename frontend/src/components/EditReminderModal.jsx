import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Check, Globe } from 'lucide-react';
import api from '../api/axios';
import {
  AUSTRALIAN_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateAndTimeToUTC,
  getPartsInAustralianTimezone,
  formatInAustralianTime,
} from '../utils/dateUtils';
import VisualDatePicker from './VisualDatePicker';
import VisualTimePicker from './VisualTimePicker';

export default function EditReminderModal({ isOpen, onClose, reminder, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reminder && isOpen) {
      setName(reminder.name || '');
      setPhone(reminder.phone || '');
      setEmail(reminder.email || '');
      setAddress(reminder.address || '');
      setNote(reminder.note || '');
      setStatus(reminder.status || 'pending');

      const tz = reminder.timezone || DEFAULT_TIMEZONE;
      setTimezone(tz);

      const parts = getPartsInAustralianTimezone(reminder.dueAt, tz);
      setDate(parts.date);
      setTime(parts.time);
      setError('');
    }
  }, [reminder, isOpen]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!date || !time) {
      setError('Both date and time are required');
      return;
    }

    const dueAt = combineDateAndTimeToUTC(date, time, timezone);
    if (!dueAt) {
      setError('Invalid date and time selected');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim(),
        dueAt,
        timezone,
        status,
      };

      await api.patch(`/reminders/${reminder._id}`, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  const previewDueUTC = date && time ? combineDateAndTimeToUTC(date, time, timezone) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Edit Reminder</span>
              <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                AUSTRALIA
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Update customer details, date/time, and timezone.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Customer Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition font-mono shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
            </div>
          </div>

          {/* Australian Timezone Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Australian Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/[0.08] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
            >
              {AUSTRALIAN_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <VisualDatePicker
              value={date}
              onChange={setDate}
              label="Call Date"
              required={true}
            />

            <VisualTimePicker
              value={time}
              onChange={setTime}
              label="Call Time"
              required={true}
              timezoneHint={`Zone: ${timezone.split('/')[1]}`}
            />
          </div>

          {/* Real-time Preview */}
          {previewDueUTC && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 text-xs flex items-center justify-between">
              <span className="text-slate-400">Scheduled In Zone:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {formatInAustralianTime(previewDueUTC, timezone)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
            >
              <option value="pending">Pending (Call Pending)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Note</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-950/70 border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition resize-none shadow-inner"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Update Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
