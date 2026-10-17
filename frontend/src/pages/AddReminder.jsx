import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Globe,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  AUSTRALIAN_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateAndTimeToUTC,
  formatInAustralianTime,
} from "../utils/dateUtils";
import VisualDatePicker from "../components/VisualDatePicker";
import VisualTimePicker from "../components/VisualTimePicker";
import { useTimezone } from "../context/TimezoneContext";
import { useToast } from "../context/ToastContext";

export default function AddReminder() {
  const toast = useToast();
  const { selectedTimezone, setTimezone: setGlobalTimezone } = useTimezone();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+61 ");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(
    selectedTimezone || DEFAULT_TIMEZONE,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    setSuccessInfo(null);

    if (!name.trim()) {
      setError("Please enter the customer name.");
      return;
    }
    if (!phone.trim() || phone.trim() === "+61") {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!date) {
      setError('Please click on "Call Date" to pick a date from the calendar.');
      return;
    }
    if (!time) {
      setError(
        'Please click on "Call Time" to pick a time from the time selector.',
      );
      return;
    }

    const dueAt = combineDateAndTimeToUTC(date, time, timezone);
    if (!dueAt) {
      setError("Invalid date and time selected.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim().replace(/^(\+61\s*)+/, "+61 "),
        email: email.trim(),
        address: address.trim(),
        note: note.trim(),
        dueAt,
        timezone,
      };

      await api.post("/reminders", payload);

      const formattedTime = formatInAustralianTime(dueAt, timezone);
      setSuccessInfo({
        name: payload.name,
        time: formattedTime,
      });

      toast.success(
        "Reminder Scheduled! 🚀",
        `Call with ${payload.name} booked for ${formattedTime}.`
      );

      // Clear the form after saving
      setName("");
      setPhone("+61 ");
      setEmail("");
      setAddress("");
      setNote("");
      setDate("");
      setTime("");
    } catch (err) {
      if (!err.response) {
        setError(
          "Cannot connect to the backend server. Please check your internet connection or verify the backend is running.",
        );
      } else if (err.response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to save reminder. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const previewDueUTC =
    date && time ? combineDateAndTimeToUTC(date, time, timezone) : null;
  const currentZoneObj =
    AUSTRALIAN_TIMEZONES.find((z) => z.value === timezone) ||
    AUSTRALIAN_TIMEZONES[0];

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Add Reminder
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              🇦🇺 Australia
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick your appointment date on the visual calendar, choose call time,
            and select the Australian timezone.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-white">
                Reminder saved successfully!
              </span>
              <p className="text-emerald-400/90 text-xs mt-0.5">
                Scheduled for{" "}
                <span className="font-semibold text-white">
                  {successInfo.name}
                </span>{" "}
                at {successInfo.time}
              </p>
            </div>
          </div>
          <Link
            to="/reminders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition self-start sm:self-auto shadow-md active:scale-95"
          >
            <span>View in Reminders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 backdrop-blur-md shadow-lg">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-card border border-white/8 rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Left Column: Customer Details & Notes */}
          <div className="space-y-4 sm:space-y-5">
            <div className="border-b border-white/8 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Customer Information</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Fields marked * required
              </span>
            </div>

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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/8 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/8 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition font-mono shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Clickable as a direct <code>tel:</code> link in All Reminders
                for 1-click calling.
              </p>
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com.au"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/8 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Address (optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suburb, City, or State"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/8 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Call Notes & Discussion Points</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  Optional
                </span>
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Key discussion points, quotation follow-up, callback details..."
                className="w-full p-3.5 bg-slate-950/70 border border-white/8 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition resize-none shadow-inner"
              />
            </div>
          </div>

          {/* Right Column: Schedule, Timezone, Preview & Submit */}
          <div className="space-y-5 flex flex-col justify-between h-full">
            <div className="space-y-5">
              <div className="border-b border-white/8 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Call Schedule & Timezone</span>
                </h2>
                <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                  {currentZoneObj.short} ({currentZoneObj.state})
                </span>
              </div>

              {/* Australian Timezone Selection */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/8 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Australian State / Timezone</span>
                  </label>
                </div>

                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-400 transition cursor-pointer"
                >
                  {AUSTRALIAN_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Tip: Click any Australian city clock in the top bar to
                  synchronize this timezone automatically.
                </p>
              </div>

              {/* Visual Calendar & Visual Time Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              {previewDueUTC ? (
                <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs shadow-inner backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                      <Clock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Scheduled Call Time ({currentZoneObj.short})
                      </span>
                      <span className="font-bold text-indigo-200 font-mono text-xs sm:text-sm">
                        {formatInAustralianTime(previewDueUTC, timezone)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md font-medium whitespace-nowrap">
                    Active Time
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/6 text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Select both a date and time above to view the exact
                    scheduled appointment preview.
                  </span>
                </div>
              )}
            </div>

            {/* Save Reminder Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-shimmer w-full py-3.5 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? "Saving Reminder..." : "Save Reminder"}</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Stored in MongoDB Atlas with 1-min desktop alert and audio chime
                when due.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
