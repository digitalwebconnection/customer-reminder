import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";
import RemindIQLogo from "../../components/common/RemindIQLogo";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success(
        "Password Reset Successful!",
        "You can now sign in with your new password.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired password reset link. Please request a new one.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-apple-theme min-h-screen text-slate-800 flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Animated Liquid Glass Background Atmosphere & Slabs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-12 -left-16 w-120 h-36 rounded-full ambient-liquid-slab transform -rotate-12 opacity-85 animate-float-slow" />
        <div className="absolute top-1/4 -right-24 w-135 h-40 rounded-full ambient-liquid-slab transform rotate-8 opacity-80 animate-float-reverse" />
        <div className="absolute -bottom-16 -left-12 w-130 h-44 rounded-full ambient-liquid-slab transform rotate-6 opacity-85 animate-float-slow" />
        <div className="absolute -bottom-20 -right-20 w-145 h-48 rounded-full ambient-liquid-slab transform -rotate-6 opacity-80 animate-float-reverse" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/35 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/35 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
      </div>

      <div className="relative w-full max-w-md liquid-glass-modal p-7 sm:p-9 rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-3">
            <RemindIQLogo size="lg" />
          </div>
          <div className="liquid-glass-pill w-12 h-12 rounded-2xl p-2 flex items-center justify-center mx-auto shadow-xs animate-float-gentle">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight liquid-heading">
            Set New Password
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Create a secure password with at least 6 characters
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-2 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full liquid-glass-pill text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Password Successfully Reset
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                Your password has been changed. You can now access your RemindIQ workspace with your new credentials.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full min-h-12 py-3 px-5 rounded-2xl liquid-shimmer-btn text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 group cursor-pointer shadow-md shadow-amber-500/25"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl liquid-glass-pill bg-rose-500/10 border-rose-300/60 text-xs text-rose-800 font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-tight mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-tight mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 py-3 px-5 rounded-2xl liquid-shimmer-btn text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-amber-500/25"
              >
                <span>{loading ? "Updating..." : "Reset Password"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
