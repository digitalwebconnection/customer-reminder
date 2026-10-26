import  { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Globe
} from "lucide-react";
import api from "../../api/axios";
import {
  AUSTRALIAN_TIMEZONES,
  INDIAN_TIMEZONES,
  DEFAULT_TIMEZONE,
  combineDateAndTimeToUTC,
  getPartsInAustralianTimezone,
  formatInAustralianTime,
} from "../../utils/dateUtils";
import VisualDateTimePicker from "../forms/VisualDateTimePicker";
import {
  validateEmail,
  validatePhone,
  sanitizePhoneInput,
} from "../../utils/validationUtils";

export default function EditReminderModal({
  isOpen,
  onClose,
  reminder,
  onSaved,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reminder && isOpen) {
      setName(reminder.name || "");
      setPhone(reminder.phone || "");
      setEmail(reminder.email || "");
      setAddress(reminder.address || "");
      setNote(reminder.note || "");
      setStatus(reminder.status || "pending");

      const tz = reminder.timezone || DEFAULT_TIMEZONE;
      setTimezone(tz);

      const parts = getPartsInAustralianTimezone(reminder.dueAt, tz);
      setDate(parts.date);
      setTime(parts.time);
      setError("");
    }
  }, [reminder, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !reminder) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Customer name is required");
      return;
    }

    const country = timezone === "Asia/Kolkata" ? "India" : "Australia";
    const phoneCheck = validatePhone(phone, country, true);
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
    if (!date || !time) {
      setError("Both call date and call time are required");
      return;
    }

    const dueAt = combineDateAndTimeToUTC(date, time, timezone);
    if (!dueAt) {
      setError("Invalid date and time selected");
      return;
    }

    if (
      status === "pending" &&
      new Date(dueAt).getTime() < Date.now() - 60000
    ) {
      setError(
        "Scheduled call date and time cannot be in the past. Please choose a current or future time.",
      );
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
      setError(err.response?.data?.message || "Failed to update reminder");
    } finally {
      setLoading(false);
    }
  };

  const previewDueUTC =
    date && time ? combineDateAndTimeToUTC(date, time, timezone) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-9998 flex items-center justify-center p-2.5 sm:p-6 bg-slate-900/35 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl liquid-glass-modal rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] text-slate-800 ring-1 ring-slate-900/10 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-200/80 bg-white/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Edit Reminder
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full liquid-glass-pill text-slate-500 hover:text-slate-900 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="edit-reminder-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 pb-16"
        >
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

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
                placeholder="e.g. John Smith"
                className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
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
                name="edit_customer_phone"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(sanitizePhoneInput(e.target.value));
                  if (error) setError("");
                }}
                placeholder={
                  timezone === "Asia/Kolkata"
                    ? "+91 98765 43210"
                    : "0412 345 678"
                }
                className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {timezone === "Asia/Kolkata"
                ? "Indian 10-digit mobile number"
                : "Australian 9-10 digit mobile or landline"}
            </p>
          </div>

          {/* Email & Address (2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="edit_customer_email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 liquid-glass-input rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Address / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sydney, NSW"
                  className="w-full pl-10 pr-3.5 py-2.5 liquid-glass-input rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                />
              </div>
            </div>
          </div>

          {/* Regional Timezone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Country & Regional Timezone</span>
              </span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none transition cursor-pointer font-semibold"
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
                    {tz.label} ({tz.offset})
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
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Select Date & Time (Unified visual calendar & time selector) */}
          <VisualDateTimePicker
            date={date}
            time={time}
            onDateChange={setDate}
            onTimeChange={setTime}
            label="Select Date & Time"
            required={true}
            timezone={timezone}
          />

          {/* Real-time Preview (Slim) */}
          {previewDueUTC && (
            <div className="px-3.5 py-2 rounded-2xl liquid-glass-pill text-xs flex items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Scheduled In Zone:
              </span>
              <span className="font-mono text-amber-600 font-bold text-xs">
                {formatInAustralianTime(previewDueUTC, timezone)}
              </span>
            </div>
          )}

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none transition cursor-pointer font-semibold"
            >
              <option value="pending" className="bg-white text-slate-900">
                Pending (Call Pending)
              </option>
              <option
                value="completed"
                className="bg-white text-emerald-600 font-bold"
              >
                Completed (Finished)
              </option>
            </select>
          </div>

          {/* Note / Follow-up Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Call Note / Agenda
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call regarding insurance quotation follow-up"
              className="w-full p-3.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition resize-none font-medium"
            />
          </div>
        </form>

        {/* Pinned Footer */}
        <div
          style={{
            paddingBottom: "max(0.875rem, env(safe-area-inset-bottom, 0px))",
          }}
          className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200/80 bg-white/40 flex items-center justify-end gap-3"
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full liquid-glass-pill text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer min-h-10 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-reminder-form"
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/25 border border-amber-300/40 cursor-pointer active:scale-95 disabled:opacity-50 min-h-10"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? "Saving Changes..." : "Update Reminder"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
