import React, { useState } from "react";
import {
  Bell,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";


export default function Login() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("vaibhavdigitalwebconnection@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleFillDemoOwner = () => {
    setEmail("vaibhavdigitalwebconnection@gmail.com");
    setPassword("admin123");
    setError("");
    toast.info("Demo Loaded", "Owner credentials auto-filled.");
  };

  const handleFillAltOwner = () => {
    setEmail("admin@reminder.com");
    setPassword("Admin@123");
    setError("");
    toast.info("Admin Loaded", "admin@reminder.com credentials filled.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!", "Successfully signed in with JWT token.");
        navigate("/reminders");
      } else {
        // Register mode validation
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match. Please re-enter.");
          setLoading(false);
          return;
        }

        await register(name, email, password);
        toast.success("Account Created!", "Signed in with your new JWT authentication token.");
        navigate("/reminders");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (mode === "login"
          ? "Invalid email or password. Please check your credentials."
          : "Could not create account. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Ambient background glow and grid */}
      <div className="fixed inset-0 bg-radial-ambient pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md glass-card border border-white/10 p-7 sm:p-9 rounded-3xl shadow-2xl backdrop-blur-2xl">
     
        {/* Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-600/35 border border-white/20">
            <Bell className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Remind
              <span className="bg-linear-to-r from-indigo-400 via-violet-400 to-purple-300 bg-clip-text text-transparent">
                IQ
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Customer Call Reminder & Alert Automation
            </p>
          </div>
        </div>

        {/* Mode Switch Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-white/8 mb-6 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "register"
                ? "bg-linear-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 animate-in fade-in slide-in-from-top-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Registration only) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              {mode === "login" && (
                <span className="text-[11px] text-indigo-400 font-medium">
                  30-Day JWT Session
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
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

          {/* Confirm Password (Registration only) */}
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white text-xs sm:text-sm font-semibold transition shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <span>
              {loading
                ? mode === "login"
                  ? "Verifying Token..."
                  : "Creating Account..."
                : mode === "login"
                ? "Sign In with JWT"
                : "Create Account"}
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Quick Demo Credentials Helper */}
        {mode === "login" && (
          <div className="mt-5 pt-4 border-t border-white/8 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick Login Autofill:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillDemoOwner}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-white/6 text-[11px] text-slate-300 font-medium transition cursor-pointer text-left truncate"
                title="Fill vaibhavdigitalwebconnection@gmail.com"
              >
                👤 Owner 1 (Vaibhav)
              </button>
              <button
                type="button"
                onClick={handleFillAltOwner}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-white/6 text-[11px] text-slate-300 font-medium transition cursor-pointer text-left truncate"
                title="Fill admin@reminder.com"
              >
                🛡️ Admin (System)
              </button>
            </div>
          </div>
        )}

        {/* Security & Render Keep-Alive Info Footer */}
        <div className="mt-5 pt-3 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>JWT Bearer + Secure Cookie</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>14-Min Render Active Ping</span>
          </div>
        </div>
      </div>
    </div>
  );
}
