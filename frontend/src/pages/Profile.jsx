import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Check,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTimezone } from '../context/TimezoneContext';
import { usePwa } from '../context/PwaContext';
import { playChimeSound } from '../utils/audioAlert';
import { AUSTRALIAN_TIMEZONES, INDIAN_TIMEZONES } from '../utils/dateUtils';
import { validatePhone } from '../utils/validationUtils';

export default function Profile() {
  const { user, updateProfile, isSuperAdmin } = useAuth();
  const {
    permissions,
    setShowAlarmModal,
    enableRingPermission,
    toggleRingPermission,
    testMobileAlarm,
  } = usePwa();
  const { setTimezone: setGlobalTimezone } = useTimezone();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Australia');
  const [timezone, setTimezone] = useState(user?.timezone || 'Australia/Sydney');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Live time preview
  const [previewTime, setPreviewTime] = useState('');

  // Sync state if user object updates
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone !== undefined) setPhone(user.phone);
      if (user.country) setCountry(user.country);
      if (user.timezone) setTimezone(user.timezone);
    }
  }, [user]);

  // Live clock preview for selected timezone
  useEffect(() => {
    const updatePreview = () => {
      try {
        const str = new Intl.DateTimeFormat('en-AU', {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        }).format(new Date());
        setPreviewTime(str);
      } catch (e) {
        setPreviewTime('');
      }
    };
    updatePreview();
    const interval = setInterval(updatePreview, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    if (newCountry === 'India') {
      setTimezone('Asia/Kolkata');
    } else {
      setTimezone('Australia/Sydney');
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }

    if (phone.trim()) {
      const check = validatePhone(phone.trim(), country, false);
      if (!check.isValid) {
        setProfileMsg({ type: 'error', text: check.error });
        return;
      }
    }

    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        country,
        timezone,
      });
      setGlobalTimezone(timezone, country);
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully.' });
      toast.success('Profile Saved', 'Your details and regional timezone have been updated.');
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);

    try {
      await updateProfile({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      toast.success('Password Changed', 'Your account password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Incorrect current password or server error.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const userInitial = (name || user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 space-y-6">
      {/* Sleek Profile Header Banner */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Initials */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shrink-0 shadow-xs">
            {userInitial}
          </div>

          {/* User Details */}
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {name || user?.name || 'My Profile'}
              </h1>

              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Super Admin</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-700/80">
                  <User className="w-3 h-3 text-zinc-400" />
                  <span>Account Owner</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user?.email}</span>
              </span>

              <span className="text-zinc-600 hidden sm:inline">•</span>

              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {country === 'India' ? '🇮🇳 India' : '🇦🇺 Australia'} ({timezone.split('/')[1] || timezone})
                </span>
              </span>
            </div>

            <p className="text-xs text-zinc-500 pt-1">
              Manage your personal information, regional time zone, and account security.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800 flex items-center gap-6 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeTab === 'general'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>General & Region</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeTab === 'security'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alarms')}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-px shrink-0 ${
            activeTab === 'alarms'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alarms & Ringtone</span>
          {permissions.ringSound === 'granted' ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: General Profile & Region */}
      {activeTab === 'general' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-semibold text-white">Personal Information</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Update your contact details and default country time zone for client call reminders.
            </p>
          </div>

          {profileMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateInfo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address <span className="text-zinc-500 font-normal">(Account ID)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-base sm:text-sm text-zinc-400 cursor-not-allowed select-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={country === 'India' ? '+91 98765 43210' : '+61 412 345 678'}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Format: {country === 'India' ? 'Indian 10-digit mobile number' : 'Australian mobile or landline'}
              </p>
            </div>

            {/* Country for Time Zone */}
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    <span>Select Country for Time Zone</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Controls your top dashboard clock
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Australia Option Card */}
                  <div
                    onClick={() => handleCountryChange('Australia')}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      country === 'Australia'
                        ? 'bg-zinc-900 border-white text-white shadow-xs'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇦🇺</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Australia</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Sydney, Melbourne, Brisbane, Adelaide
                        </p>
                      </div>
                    </div>
                    {country === 'Australia' && (
                      <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                  </div>

                  {/* India Option Card */}
                  <div
                    onClick={() => handleCountryChange('India')}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      country === 'India'
                        ? 'bg-zinc-900 border-white text-white shadow-xs'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇮🇳</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>India</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          India Standard Time (IST — UTC+5:30)
                        </p>
                      </div>
                    </div>
                    {country === 'India' && (
                      <div className="w-5 h-5 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timezone Selection & Preview */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Preferred Time Zone
                </label>

                {country === 'Australia' ? (
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    {AUSTRALIAN_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-zinc-900 text-zinc-100">
                        {tz.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 font-mono flex items-center justify-between">
                    <span>India Standard Time (IST — UTC+5:30)</span>
                    <span className="text-[10px] text-zinc-400 font-sans">Asia/Kolkata</span>
                  </div>
                )}

                {/* Live Clock Preview */}
                {previewTime && (
                  <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-300">
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Live Time Preview:</span>
                    </span>
                    <span className="font-semibold text-white tabular-nums">{previewTime}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-11.5 py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-bold transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-base font-semibold text-white">Security & Password</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Change your account password to keep your client reminders and records secure.
            </p>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer p-1"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer p-1"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition cursor-pointer p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-11.5 py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-bold transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Alarms & Ringtone Settings */}
      {activeTab === 'alarms' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <span>Mobile Alarms & Ringtone Settings</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure your device's audio ringtone and background push alarms for customer reminders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAlarmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Full Device Diagnostics</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Setting 1: Call Reminder Ringtone */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    permissions.ringSound === 'granted'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {permissions.ringSound === 'granted' ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      Incoming Call Ringtone
                    </span>
                    {permissions.ringSound === 'granted' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ring Ready 🔊
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Muted / Needs Permission
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                    Plays an unmistakable telephone double-ring alarm through your mobile speaker when a customer follow-up call is due.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => playChimeSound()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                  title="Test how the phone ringtone sounds"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test Ring</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await toggleRingPermission();
                    if (res?.success) {
                      toast.success('Ringtone Enabled! 🔔', 'Reminders will now ring out loud.');
                    } else {
                      toast.info('Ringtone Muted 🔕', 'Audio ringtone has been silenced.');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md ${
                    permissions.ringSound === 'granted'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                  }`}
                >
                  {permissions.ringSound === 'granted' ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Mute Ring</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Allow Ring Sound</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Setting 2: Lock Screen & Background Push Alarms */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    permissions.notification === 'granted' && permissions.pushSubscribed
                      ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      Background Lock Screen Alarms
                    </span>
                    {permissions.notification === 'granted' && permissions.pushSubscribed ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Armed 🟢
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Setup Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                    Wakes your phone and displays urgent call notifications even when the app is completely closed or your screen is locked.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await testMobileAlarm(5);
                      toast.call('⏱️ 5s Alarm Test Dispatched!', 'Lock your phone right now to test.');
                    } catch (e) {
                      toast.error('Test Error', e.message || 'Failed to dispatch test.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                  title="Dispatches an alarm 5 seconds after clicking so you can lock your screen"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock Screen Test (5s)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
