import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, CheckCircle2, ArrowRight, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  AUSTRALIAN_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateAndTimeToUTC,
  formatInAustralianTime,
} from '../utils/dateUtils';
import VisualDatePicker from '../components/VisualDatePicker';
import VisualTimePicker from '../components/VisualTimePicker';
import { useTimezone } from '../context/TimezoneContext';

export default function AddReminder() {
  const { selectedTimezone, setTimezone: setGlobalTimezone } = useTimezone();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+61 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(selectedTimezone || DEFAULT_TIMEZONE);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Sync when top bar Australian timezone changes
  useEffect(() => {
    if (selectedTimezone) {
      setTimezone(selectedTimezone);
    }
  }, [selectedTimezone]);

  const handleTimezoneChange = (tz) => {
    setTimezone(tz);
    setGlobalTimezone(tz);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!name.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (!phone.trim() || phone.trim() === '+61') {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!date) {
      setError('Please click on "Call Date" to pick a date from the calendar.');
      return;
    }
    if (!time) {
      setError('Please click on "Call Time" to pick a time from the time selector.');
      return;
    }

    const dueAt = combineDateAndTimeToUTC(date, time, timezone);
    if (!dueAt) {
      setError('Invalid date and time selected.');
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
      };

      await api.post('/reminders', payload);

      setSuccessInfo({
        name: payload.name,
        time: formatInAustralianTime(dueAt, timezone),
      });

      // Clear the form after saving
      setName('');
      setPhone('+61 ');
      setEmail('');
      setAddress('');
      setNote('');
      setDate('');
      setTime('');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to the server (Port 5000). Please check that the backend is running.');
      } else if (err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to save reminder. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const previewDueUTC = date && time ? combineDateAndTimeToUTC(date, time, timezone) : null;
  const currentZoneObj = AUSTRALIAN_TIMEZONES.find((z) => z.value === timezone) || AUSTRALIAN_TIMEZONES[0];

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Add Reminder</span>
          <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
            🇦🇺 Australia
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pick your appointment date on the visual calendar, choose call time, and select the Australian timezone.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-white">Reminder saved successfully!</span>
              <p className="text-emerald-400/90 text-xs mt-0.5">
                Scheduled for {successInfo.name} at {successInfo.time}
              </p>
            </div>
          </div>
          <Link
            to="/reminders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition self-start sm:self-auto shadow-md"
          >
            <span>View in Reminders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Customer Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jack Thompson"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Phone Number <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+61 412 345 678 or 0412 345 678"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Clickable as a direct <code>tel:</code> link in All Reminders for 1-click calling.
          </p>
        </div>

        {/* Email & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (optional)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com.au"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address (optional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Suburb, City, or State"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Australian Timezone Selection */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Australian State / Timezone</span>
            </label>
            <span className="text-[11px] text-indigo-400 font-mono font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {currentZoneObj.short} ({currentZoneObj.state})
            </span>
          </div>

          <select
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            {AUSTRALIAN_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Tip: You can also click any Australian city in the top bar to switch this instantly.
          </p>
        </div>

        {/* Visual Calendar & Visual Time Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Visual Calendar */}
          <VisualDatePicker
            value={date}
            onChange={setDate}
            label="Call Date"
            required={true}
          />

          {/* Visual Time Selector */}
          <VisualTimePicker
            value={time}
            onChange={setTime}
            label="Call Time"
            required={true}
            timezoneHint={`Scheduled in ${currentZoneObj.short} time`}
          />
        </div>

        {/* Real-time Schedule Preview Pill */}
        {previewDueUTC && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">Scheduled Call:</span>
            <span className="font-semibold text-indigo-300 font-mono">
              {formatInAustralianTime(previewDueUTC, timezone)}
            </span>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Note <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Key discussion points, quotation follow-up, callback details..."
            className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
          />
        </div>

        {/* Save Reminder Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{loading ? 'Saving Reminder...' : 'Save Reminder'}</span>
        </button>
      </form>
    </div>
  );
}
