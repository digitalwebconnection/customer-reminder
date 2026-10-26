import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { validateEmail } from "../../utils/validationUtils";
import RemindIQLogo from "../../components/common/RemindIQLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/reminders";

  const emailValidation = validateEmail(email, true);
  const showEmailError =
    emailTouched && email.length > 0 && !emailValidation.isValid;

  // Prefetch adjacent routes during idle for 0ms navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./SignUp");
      import("../reminders/Reminders");
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const res = await login(trimmedEmail, password);

      toast.success(
        "Welcome back!",
        `Signed in as ${res?.user?.name || email}`,
      );

      // Role-based post-login navigation
      if (res?.user?.role === "superadmin") {
        navigate("/admin", { replace: true });
      } else {
        const dest = from === "/login" || from === "/" ? "/reminders" : from;
        navigate(dest, { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Invalid email or password. Please verify your credentials.";
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
        {/* Large 3D Sphere Right */}
        <div className="absolute top-1/4 -right-12 w-48 sm:w-64 h-48 sm:h-64 liquid-glass-sphere opacity-90 animate-float-slow" />
        {/* Medium 3D Sphere Left */}
        <div className="absolute top-1/3 -left-10 w-32 sm:w-44 h-32 sm:h-44 liquid-glass-sphere opacity-85 animate-float-reverse" />
        {/* Small 3D Sphere Top Left */}
        <div className="absolute top-12 left-10 w-16 sm:w-20 h-16 sm:h-20 liquid-glass-sphere opacity-80 animate-float-slow" />
        {/* Small 3D Sphere Bottom Left */}
        <div className="absolute -bottom-8 left-16 w-24 sm:w-32 h-24 sm:h-32 liquid-glass-sphere opacity-85 animate-float-reverse" />
        {/* Small 3D Sphere Bottom Right */}
        <div className="absolute bottom-16 right-12 w-20 sm:w-28 h-20 sm:h-28 liquid-glass-sphere opacity-80 animate-float-slow" />

        {/* Ambient warm chromatic caustics */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl opacity-50 animate-pulse-subtle" />
      </div>

      {/* ======================================================== */}
      {/* Compact Liquid Glass Card (Refined Best View on Mobile)  */}
      {/* ======================================================== */}
      <div className="relative w-full max-w-85 sm:max-w-95 liquid-glass-compact p-5 sm:p-7 rounded-[26px] sm:rounded-3xl shadow-xl transition-all z-10 animate-in fade-in zoom-in-95 duration-400">
        {/* Header with Official RemindIQ Logo & Underlined Login title */}
        <div className="text-center space-y-1 mb-4 sm:mb-5">
          <div className="flex justify-center mb-1">
            <RemindIQLogo size="md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight liquid-heading relative inline-block">
            Login
            <span className="block w-10 h-0.5 bg-linear-to-r from-amber-500 to-amber-400 rounded-full mx-auto mt-1" />
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Sign in to access your follow-ups & calls
          </p>
        </div>

        {/* Error Alert Pill */}
        {error && (
          <div className="p-2.5 rounded-xl liquid-glass-pill bg-rose-500/10 border-rose-300/60 text-[11px] text-rose-800 font-semibold flex items-start gap-2 mb-3.5 animate-in fade-in slide-in-from-top-1 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5" autoComplete="off">
          {/* Email Address */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 tracking-tight mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                name="user_login_email"
                autoComplete="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="name@company.com"
                className={`w-full pl-3.5 pr-9 py-2 sm:py-2.5 liquid-glass-input rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-xs ${
                  showEmailError
                    ? "border-rose-400 focus:ring-rose-400/30"
                    : "focus:border-amber-400"
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 sm:top-3 pointer-events-none" />
            </div>
            {showEmailError && (
              <p className="mt-1 text-[10px] font-semibold text-rose-600 animate-in fade-in">
                {emailValidation.error}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 tracking-tight mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                name="user_login_password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter password"
                className="w-full pl-3.5 pr-9 py-2 sm:py-2.5 liquid-glass-input rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 sm:top-2.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Options Row (Matching Reference Image: Remember me + Forgot Password?) */}
          <div className="flex items-center justify-between pt-0.5 text-[11px]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 select-none font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-slate-600 hover:text-amber-700 font-semibold transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Submit Button (Matching Reference Image Capsule) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-slate-300/40 border border-white/90 transition select-none"
            >
              <span>{loading ? "Signing in..." : "Login"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        {/* Footer Link (Matching Reference Image: Don't have an account? Register) */}
        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-200/60 text-center">
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-slate-900 hover:text-amber-700 font-extrabold transition"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
