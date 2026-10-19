import React, { useState, useEffect } from 'react';
import {
  Bell,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTimezone } from '../context/TimezoneContext';
import {
  AUSTRALIAN_TIMEZONES,
  INDIAN_TIMEZONES,
} from '../utils/dateUtils';
import {
  validateEmail,
  validatePhone,
  sanitizePhoneInput,
} from '../utils/validationUtils';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Australia');
  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [liveTime, setLiveTime] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  // Handle Country switch
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    if (newCountry === 'India') {
      setTimezone('Asia/Kolkata');
    } else {
      setTimezone('Australia/Sydney');
    }
  };

  // Live time ticker for selected timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const locale = country === 'India' ? 'en-IN' : 'en-AU';
        const formatted = new Intl.DateTimeFormat(locale, {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        }).format(new Date());
        setLiveTime(formatted);
      } catch (e) {
        setLiveTime('');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [country, timezone]);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailTouched(true);
    setPhoneTouched(true);

    // Full name validation
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    // Email address validation
    if (!emailVal.isValid) {
      setError(emailVal.error);
      return;
    }

    // Phone number validation (if provided)
    if (phone.trim() && !phoneVal.isValid) {
      setError(phoneVal.error);
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
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

      // Synchronize global timezone immediately
      setGlobalTimezone(timezone, country);

      toast.success('Account Created! 🎉', `Welcome to RemindIQ. Your workspace is set to ${country} (${timezone}).`);
      navigate('/reminders');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Could not create account. Please check your details and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden selection:bg-zinc-800 selection:text-white">
      {/* Subtle background grid pattern */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-20" />

      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-2xl my-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-200 shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Remind<span className="text-zinc-400">IQ</span>
          </h1>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-200 tracking-tight">
              Create Your Account
            </h2>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 mb-5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Row 1: Full Name (Single Full-Width Grid Row) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                name="user_signup_name"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition shadow-inner"
              />
            </div>
          </div>

          {/* Row 2: Email Address & Phone Number in ONE Grid (2 columns on sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                {email && (
                  <span className="text-[10px]">
                    {emailVal.isValid ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    ) : emailTouched ? (
                      <span className="text-rose-400 font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Invalid
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
                  name="user_signup_email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-zinc-900 border ${
                    showEmailError ? 'border-rose-500/70 focus:border-rose-400' : 'border-zinc-800 focus:border-zinc-500'
                  } rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition shadow-inner`}
                />
              </div>
              {showEmailError && (
                <p className="mt-1 text-[11px] text-rose-400 animate-in fade-in">
                  {emailVal.error}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Phone Number <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                {phone ? (
                  <span className="text-[10px]">
                    {phoneVal.isValid ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </span>
                    ) : phoneTouched ? (
                      <span className="text-rose-400 font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Invalid
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
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
                    if (error) setError('');
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder={country === 'India' ? '+91 98765 43210' : '+61 412 345 678'}
                  className={`w-full pl-10 pr-4 py-2.5 bg-zinc-900 border ${
                    showPhoneError ? 'border-rose-500/70 focus:border-rose-400' : 'border-zinc-800 focus:border-zinc-500'
                  } rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition shadow-inner`}
                />
              </div>
              {showPhoneError && (
                <p className="mt-1 text-[11px] text-rose-400 animate-in fade-in">
                  {phoneVal.error}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Select Country for Time Zone (Simple Dropdown Input) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Select Country for Time Zone <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition shadow-inner cursor-pointer appearance-none"
              >
                <option value="Australia" className="bg-zinc-900 text-zinc-100">
                  Australia
                </option>
                <option value="India" className="bg-zinc-900 text-zinc-100">
                  India
                </option>
              </select>
              <div className="absolute right-3.5 top-3 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Row 4: Password & Confirm Password in ONE Grid (2 columns on sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Password <span className="text-rose-400">*</span>
                </label>
                {password && (
                  <span className="text-[10px] font-medium text-zinc-400">
                    <span
                      className={
                        strength.score >= 3
                          ? 'text-emerald-400 font-semibold'
                          : strength.score === 2
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {strength.label}
                    </span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name="user_signup_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Min. 6 chars"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Mismatch
                  </span>
                )}
                {confirmPassword && password === confirmPassword && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Matched
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  name="user_signup_confirm_password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-600 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 sm:py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-sm"
          >
            <span>{loading ? 'Creating Your Account...' : 'Complete Sign Up'}</span>
            <ArrowRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-xs sm:text-sm text-zinc-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-zinc-200 hover:text-white font-medium underline underline-offset-4 transition"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
