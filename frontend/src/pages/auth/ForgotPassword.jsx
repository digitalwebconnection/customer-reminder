import React, { useState } from "react";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import RemindIQLogo from "../../components/common/RemindIQLogo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please check your email and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-apple-theme min-h-screen text-slate-800 flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Animated Liquid Glass Background Atmosphere & Slabs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-12 -left-16 w-[480px] h-36 rounded-full ambient-liquid-slab transform -rotate-12 opacity-85 animate-float-slow" />
        <div className="absolute top-1/4 -right-24 w-[540px] h-40 rounded-full ambient-liquid-slab transform rotate-8 opacity-80 animate-float-reverse" />
        <div className="absolute -bottom-16 -left-12 w-[520px] h-44 rounded-full ambient-liquid-slab transform rotate-6 opacity-85 animate-float-slow" />
        <div className="absolute -bottom-20 -right-20 w-[580px] h-48 rounded-full ambient-liquid-slab transform -rotate-6 opacity-80 animate-float-reverse" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/35 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/35 rounded-full blur-3xl opacity-60 animate-pulse-subtle" />
      </div>

      <div className="relative w-full max-w-md liquid-glass-modal p-7 sm:p-9 rounded-3xl shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 mb-6">
          <div className="flex justify-center mb-3">
            <RemindIQLogo size="lg" />
          </div>
          <div className="liquid-glass-pill w-12 h-12 rounded-2xl p-2 flex items-center justify-center mx-auto shadow-xs animate-float-gentle">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight liquid-heading">
            Reset Password
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Enter your registered email and we'll send you a password recovery link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-2 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full liquid-glass-pill text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Reset Link Dispatched
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                If an account exists for{" "}
                <span className="text-amber-700 font-bold font-mono">{email}</span>, you
                will receive an email with reset instructions shortly.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Link expires in 60 minutes. Check your spam folder if it doesn't
              appear.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl liquid-glass-pill text-slate-700 hover:text-slate-900 text-xs font-bold transition shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
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
                Registered Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition shadow-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 py-3 px-5 rounded-2xl liquid-shimmer-btn text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-amber-500/25"
              >
                <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-700 font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
