import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTimezone } from "../../context/TimezoneContext";
import {
  validateEmail,
  validatePhone,
  sanitizePhoneInput,
} from "../../utils/validationUtils";
import RemindIQLogo from "../../components/common/RemindIQLogo";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Australia");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [liveTime, setLiveTime] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const { register } = useAuth();
  const { setTimezone: setGlobalTimezone } = useTimezone();
  const toast = useToast();
  const navigate = useNavigate();

  // Dynamic validation results
  const emailVal = validateEmail(email, true);
  const phoneVal = validatePhone(phone, country, false);
  const showEmailError = emailTouched && email.length > 0 && !emailVal.isValid;
  const showPhoneError = phoneTouched && phone.length > 0 && !phoneVal.isValid;

  // Prefetch adjacent routes during idle for 0ms navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./Login");
      import("../reminders/Reminders");
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle Country switch
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    if (newCountry === "India") {
      setTimezone("Asia/Kolkata");
    } else {
      setTimezone("Australia/Sydney");
    }
  };

  // Live time ticker for selected timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const locale = country === "India" ? "en-IN" : "en-AU";
        const formatted = new Intl.DateTimeFormat(locale, {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        }).format(new Date());
        setLiveTime(formatted);
      } catch (e) {
        setLiveTime("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [country, timezone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);
    setPhoneTouched(true);

    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }

    if (phone.trim() && !phoneVal.isValid) {
      setError(phoneVal.error);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country,
        timezone,
        password,
        confirmPassword,
      });

      setGlobalTimezone(timezone, country);

      toast.success(
        "Account Created! 🎉",
        `Welcome to RemindIQ (${country}).`,
      );
      navigate("/reminders");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Could not create account. Please check your details and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-apple-theme min-h-screen text-slate-800 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* ======================================================== */}
      {/* Floating 3D Liquid Glass Spheres (Matching Reference UI) */}
      {/* ======================================================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-1/4 -right-12 w-48 sm:w-64 h-48 sm:h-64 liquid-glass-sphere opacity-90 animate-float-slow" />
        <div className="absolute top-1/3 -left-10 w-32 sm:w-44 h-32 sm:h-44 liquid-glass-sphere opacity-85 animate-float-reverse" />
        <div className="absolute top-12 left-10 w-16 sm:w-20 h-16 sm:h-20 liquid-glass-sphere opacity-80 animate-float-slow" />
        <div className="absolute -bottom-8 left-16 w-24 sm:w-32 h-24 sm:h-32 liquid-glass-sphere opacity-85 animate-float-reverse" />
        <div className="absolute bottom-16 right-12 w-20 sm:w-28 h-20 sm:h-28 liquid-glass-sphere opacity-80 animate-float-slow" />

        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl opacity-50 animate-pulse-subtle" />
      </div>

      {/* ======================================================== */}
      {/* Compact Liquid Glass Card (Refined Mobile View)          */}
      {/* ======================================================== */}
      <div className="relative w-full max-w-85 sm:max-w-100 liquid-glass-compact p-4.5 sm:p-6 rounded-[26px] sm:rounded-3xl shadow-xl transition-all duration-300 z-10 my-3 animate-in fade-in zoom-in-95">
        {/* Header with Official RemindIQ Logo */}
        <div className="text-center space-y-1 mb-3.5 sm:mb-4">
          <div className="flex justify-center mb-1">
            <RemindIQLogo size="md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight liquid-heading relative inline-block">
            Register
            <span className="block w-10 h-0.5 bg-linear-to-r from-amber-500 to-amber-400 rounded-full mx-auto mt-1" />
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Create your account to start managing reminders
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded-xl liquid-glass-pill bg-rose-500/10 border-rose-300/60 text-[11px] text-rose-800 font-semibold flex items-start gap-2 mb-3 animate-in fade-in slide-in-from-top-1 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3" autoComplete="off">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                name="user_signup_name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-3.5 pr-8 py-2 liquid-glass-input rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Email Address & Phone Number (2 cols on sm, 1 col on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 tracking-tight">
                  Email <span className="text-rose-500">*</span>
                </label>
                {email && (
                  <span className="text-[9px] font-bold">
                    {emailVal.isValid ? (
                      <span className="text-emerald-600">Valid</span>
                    ) : emailTouched ? (
                      <span className="text-rose-600">Invalid</span>
                    ) : null}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  name="user_signup_email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@company.com"
                  className={`w-full pl-3.5 pr-8 py-2 liquid-glass-input rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-xs ${
                    showEmailError ? "border-rose-400 focus:ring-rose-400/30" : "focus:border-amber-400"
                  }`}
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 tracking-tight">
                  Phone 
                </label>
                {phone && (
                  <span className="text-[9px] font-bold">
                    {phoneVal.isValid ? (
                      <span className="text-emerald-600">Valid</span>
                    ) : phoneTouched ? (
                      <span className="text-rose-600">Invalid</span>
                    ) : null}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="tel"
                  name="user_signup_phone"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = sanitizePhoneInput(raw);
                    setPhone(sanitized);
                    if (raw !== sanitized) setPhoneTouched(true);
                    if (error) setError("");
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder={country === "India" ? "+91..." : "+61..."}
                  className={`w-full pl-3.5 pr-8 py-2 liquid-glass-input rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-xs ${
                    showPhoneError ? "border-rose-400 focus:ring-rose-400/30" : "focus:border-amber-400"
                  }`}
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Country / Timezone Segmented Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight">
                Country & Timezone
              </label>
              {liveTime && (
                <span className="text-[9px] font-mono font-bold text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {liveTime}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCountryChange("Australia")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  country === "Australia"
                    ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-300/40"
                    : "liquid-glass-pill text-slate-700 hover:text-slate-900"
                }`}
              >
                <span>🇦🇺</span>
                <span>Australia (AU)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCountryChange("India")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  country === "India"
                    ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-300/40"
                    : "liquid-glass-pill text-slate-700 hover:text-slate-900"
                }`}
              >
                <span>🇮🇳</span>
                <span>India (IST)</span>
              </button>
            </div>
          </div>

          {/* Password & Confirm Password (2 cols on sm, 1 col on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 tracking-tight mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="user_signup_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Min. 6 chars"
                  className="w-full pl-3.5 pr-8 py-2 liquid-glass-input rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 tracking-tight">
                  Confirm <span className="text-rose-500">*</span>
                </label>
                {confirmPassword && password === confirmPassword && (
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Matched
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  name="user_signup_confirm_password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Re-enter password"
                  className="w-full pl-3.5 pr-8 py-2 liquid-glass-input rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button (Matching Reference Image) */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-slate-300/40 border border-white/90 transition select-none"
            >
              <span>{loading ? "Creating..." : "Create Account"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-3.5 border-t border-slate-200/60 text-center">
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-slate-900 hover:text-amber-700 font-extrabold transition"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
