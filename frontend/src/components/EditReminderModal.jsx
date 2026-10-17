import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, MapPin, Check, Globe, Calendar, Clock, FileText } from 'lucide-react';
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!date || !time) {
      setError('Both call date and call time are required');
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900/98 border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] backdrop-blur-2xl text-slate-100 ring-1 ring-black/70 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-white/8 bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Edit Reminder
              </h3>
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                AUSTRALIA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Update customer details, scheduled date/time, and status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-reminder-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Customer Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0412 345 678"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition font-mono shadow-inner"
              />
            </div>
          </div>

          {/* Email & Address (2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Address / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sydney, NSW"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Australian Timezone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Australian Timezone</span>
              </span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer shadow-inner"
            >
              {AUSTRALIAN_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-slate-900 text-slate-100">
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          {/* Call Date & Call Time (2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <VisualDatePicker
                value={date}
                onChange={setDate}
                label="Call Date"
                required={true}
              />
            </div>
            <div>
              <VisualTimePicker
                value={time}
                onChange={setTime}
                label="Call Time"
                timezone={timezone}
                required={true}
              />
            </div>
          </div>

          {/* Real-time Preview */}
          {previewDueUTC && (
            <div className="p-3 rounded-xl bg-linear-to-r from-indigo-950/70 to-purple-950/50 border border-indigo-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-inner">
              <span className="text-slate-400 font-medium">Scheduled In Zone:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {formatInAustralianTime(previewDueUTC, timezone)}
              </span>
            </div>
          )}

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer shadow-inner"
            >
              <option value="pending" className="bg-slate-900 text-slate-100">Pending (Call Pending)</option>
              <option value="completed" className="bg-slate-900 text-emerald-400">Completed (Finished)</option>
            </select>
          </div>

          {/* Note / Follow-up Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Note / Agenda
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call regarding insurance quotation follow-up"
              className="w-full p-3 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition resize-none shadow-inner"
            />
          </div>
        </form>

        {/* Pinned Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-white/8 bg-slate-950/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/6 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-reminder-form"
            disabled={loading}
            className="btn-shimmer px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Update Reminder'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
