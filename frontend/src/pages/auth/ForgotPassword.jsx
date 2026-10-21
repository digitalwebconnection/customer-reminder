import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please check your email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500/30">
      <div className="fixed inset-0 bg-radial-ambient pointer-events-none" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40" />

      <div className="relative w-full max-w-md glass-card border border-white/10 p-7 sm:p-9 rounded-3xl shadow-2xl backdrop-blur-2xl">
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-600/35 border border-white/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-zinc-400">
            Enter your registered email and we'll send you a password recovery link
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-2 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Reset Link Dispatched</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                If an account exists for <span className="text-indigo-300 font-mono">{email}</span>,
                you will receive an email with reset instructions shortly.
              </p>
            </div>
            <p className="text-[11px] text-zinc-500">
              Link expires in 60 minutes. Check your spam folder if it doesn't appear.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-11.5 py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:brightness-110 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/35 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
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
