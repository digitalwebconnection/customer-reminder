import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, FileText, Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { combineDateAndTimeToUTC, formatKolkataTime } from '../utils/dateUtils';

export default function AddReminder() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (!name.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!date) {
      setError('Please pick a date for the call reminder.');
      return;
    }
    if (!time) {
      setError('Please pick a time for the call reminder.');
      return;
    }

    const dueAt = combineDateAndTimeToUTC(date, time);
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
      };

      const res = await api.post('/reminders', payload);

      setSuccessInfo({
        name: payload.name,
        time: formatKolkataTime(dueAt),
      });

      // Clear the form after saving
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNote('');
      setDate('');
      setTime('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Add Reminder</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Schedule a customer follow-up. Stored as UTC, calculated and notified in <span className="text-indigo-400 font-medium">Asia/Kolkata</span>.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition self-start sm:self-auto"
          >
            <span>View All</span>
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

      {/* Add Reminder Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
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
              placeholder="e.g. +91 98765 43210 or 9876543210"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
          </div>
        </div>

        {/* Email & Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Area, or Street"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Date and Time Picker (Required) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Call Time <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Timezone: Asia/Kolkata (IST)</p>
          </div>
        </div>

        {/* Note (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Note <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What to discuss on this call, quotation points, callbacks..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
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
