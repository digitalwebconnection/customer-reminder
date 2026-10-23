import React, { useState } from "react";
import {
  Bell,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { validateEmail } from "../../utils/validationUtils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        "Invalid email or password. Please verify your credentials and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Subtle background grid pattern */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-20" />

      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 p-7 sm:p-9 rounded-2xl shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Remind<span className="text-zinc-400">IQ</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Sign in to manage follow-ups, calls, and customer reminders
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 mb-5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Email Address <span className="text-rose-400">*</span>
              </label>
              {email && (
                <span className="text-[10px]">
                  {emailValidation.isValid ? (
                    <span className="text-emerald-400 font-medium">
                      Valid email
                    </span>
                  ) : emailTouched ? (
                    <span className="text-rose-400 font-medium">
                      Invalid email format
                    </span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
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
                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-900 border ${
                  showEmailError
                    ? "border-rose-500/70 focus:border-rose-400"
                    : "border-zinc-800 focus:border-zinc-500"
                } rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition shadow-inner`}
              />
            </div>
            {showEmailError && (
              <p className="mt-1 text-[11px] text-rose-400 animate-in fade-in">
                {emailValidation.error}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Password <span className="text-rose-400">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
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
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition cursor-pointer p-0.5"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11.5 py-2.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-bold transition flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95 shadow-md"
          >
            <span>{loading ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Link to Sign Up */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-xs sm:text-sm text-zinc-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-zinc-200 hover:text-white font-medium underline underline-offset-4 transition"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
