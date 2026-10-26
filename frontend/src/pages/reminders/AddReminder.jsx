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
import api from "../../api/axios";
import {
  AUSTRALIAN_TIMEZONES,
  INDIAN_TIMEZONES,
  ALL_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateAndTimeToUTC,
  formatInAustralianTime,
} from "../../utils/dateUtils";
import VisualDateTimePicker from "../../components/forms/VisualDateTimePicker";
import { useTimezone } from "../../context/TimezoneContext";
import { useToast } from "../../context/ToastContext";
import {
  validateEmail,
  validatePhone,
  sanitizePhoneInput,
} from "../../utils/validationUtils";
import { requestAndSubscribePush } from "../../services/pushManager";

export default function AddReminder() {
  const toast = useToast();
  const {
    selectedTimezone,
    selectedCountry,
    setTimezone: setGlobalTimezone,
  } = useTimezone();

  const [name, setName] = useState("");
  const defaultPhone =
    selectedCountry === "India" || selectedTimezone === "Asia/Kolkata"
      ? "+91 "
      : "+61 ";
  const [phone, setPhone] = useState(defaultPhone);
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

    const activeCountry =
      selectedCountry === "India" || timezone === "Asia/Kolkata"
        ? "India"
        : "Australia";
    const phoneCheck = validatePhone(phone, activeCountry, true);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error);
      return;
    }

    if (email && email.trim()) {
      const emailCheck = validateEmail(email, false);
      if (!emailCheck.isValid) {
        setError(emailCheck.error);
        return;
      }
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

    if (new Date(dueAt).getTime() < Date.now() - 60000) {
      setError(
        "Scheduled call date and time cannot be in the past. Please choose a current or future time.",
      );
      return;
    }

    setLoading(true);

    try {
      // Ensure mobile push subscription is armed and associated with user on this device
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (
            Notification.permission === "granted" ||
            Notification.permission === "default"
          ) {
            requestAndSubscribePush().catch(() => {});
          }
        }
      } catch (e) {}

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
        `Call with ${payload.name} booked for ${formattedTime}.`,
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
    ALL_TIMEZONES.find((z) => z.value === timezone) || ALL_TIMEZONES[0];

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight liquid-heading">
              Add Reminder
            </h1>
            <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700">
              {currentZoneObj?.country === "India"
                ? "🇮🇳 India (IST)"
                : "🇦🇺 Australia"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Pick your appointment date on the visual calendar, choose call time,
            and select your regional timezone.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successInfo && (
        <div className="p-4 sm:p-5 rounded-3xl liquid-glass-modal text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900">
                Reminder saved successfully!
              </span>
              <p className="text-slate-600 font-medium text-xs mt-0.5">
                Scheduled for{" "}
                <span className="font-bold text-slate-900">
                  {successInfo.name}
                </span>{" "}
                at {successInfo.time}
              </p>
            </div>
          </div>
          <Link
            to="/reminders"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition self-start sm:self-auto shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <span>View in Reminders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="liquid-glass rounded-3xl p-5 sm:p-8 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Left Column: Customer Details & Notes */}
          <div className="space-y-4 sm:space-y-5">
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span>Customer Information</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-semibold">
                Fields marked * required
              </span>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jack Thompson"
                  className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  name="customer_phone"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    const clean = sanitizePhoneInput(e.target.value);
                    setPhone(clean);
                    if (error) setError("");
                  }}
                  placeholder={
                    selectedCountry === "India" || timezone === "Asia/Kolkata"
                      ? "+91 98765 43210"
                      : "+61 412 345 678"
                  }
                  className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {selectedCountry === "India" || timezone === "Asia/Kolkata"
                  ? "Indian 10-digit mobile number (e.g. 98765 43210 or +91 98765 43210)"
                  : "Australian mobile or landline (e.g. 0412 345 678 or +61 412 345 678)"}
              </p>
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="customer_email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="customer@example.com"
                    className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address (optional)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Suburb, City, or State"
                    className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Call Notes & Discussion Points</span>
                <span className="text-slate-400 font-medium text-[11px]">
                  Optional
                </span>
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Key discussion points, quotation follow-up, callback details..."
                className="w-full p-3.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none font-medium"
              />
            </div>
          </div>

          {/* Right Column: Schedule, Timezone, Preview & Submit */}
          <div className="space-y-5 flex flex-col justify-between h-full">
            <div className="space-y-5">
              <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Call Schedule & Timezone</span>
                </h2>
                <span className="liquid-glass-pill text-[11px] text-slate-700 px-3 py-1 font-mono font-bold">
                  {currentZoneObj.short} ({currentZoneObj.state})
                </span>
              </div>

              {/* Regional Timezone Selection */}
              <div className="p-4 rounded-lg liquid-glass-pill space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>Country & Regional Timezone</span>
                  </label>
                </div>

                <select
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 liquid-glass-input rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none transition cursor-pointer font-semibold"
                >
                  <optgroup
                    label="🇦🇺 Australia"
                    className="bg-white text-slate-800 font-bold"
                  >
                    {AUSTRALIAN_TIMEZONES.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className="bg-white text-slate-800 font-normal"
                      >
                        {tz.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup
                    label="🇮🇳 India"
                    className="bg-white text-slate-800 font-bold"
                  >
                    {INDIAN_TIMEZONES.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className="bg-white text-slate-800 font-normal"
                      >
                        {tz.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tip: Click any Australian or Indian city clock in the top bar
                  to synchronize this timezone automatically.
                </p>
              </div>

              {/* Unified Date & Time Selection */}
              <VisualDateTimePicker
                date={date}
                time={time}
                onDateChange={setDate}
                onTimeChange={setTime}
                label="Select Date & Time"
                required={true}
                timezone={timezone}
              />

              {/* Real-time Schedule Preview (Slim & Compact) */}
              {previewDueUTC ? (
                <div className="px-3.5 py-2.5 rounded-lg liquid-glass-pill flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Scheduled ({currentZoneObj.short}):
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-600 text-xs">
                    {formatInAustralianTime(previewDueUTC, timezone)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Save Reminder Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 py-3.5 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm sm:text-base transition shadow-lg shadow-amber-500/25 border border-amber-300/40 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {loading ? "Saving Customer..." : "Create Customer"}
                </span>
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                Stored with automated desktop alert and audio chime when call is
                due.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
