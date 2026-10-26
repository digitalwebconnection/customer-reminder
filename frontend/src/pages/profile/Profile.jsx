import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTimezone } from "../../context/TimezoneContext";
import { AUSTRALIAN_TIMEZONES, INDIAN_TIMEZONES } from "../../utils/dateUtils";
import { validatePhone } from "../../utils/validationUtils";

export default function Profile() {
  const { user, updateProfile, isSuperAdmin } = useAuth();
  const { setTimezone: setGlobalTimezone } = useTimezone();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'security'

  // Profile details state
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [country, setCountry] = useState(user?.country || "Australia");
  const [timezone, setTimezone] = useState(
    user?.timezone || "Australia/Sydney",
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  // Live time preview
  const [previewTime, setPreviewTime] = useState("");

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
        const str = new Intl.DateTimeFormat("en-AU", {
          timeZone: timezone,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        }).format(new Date());
        setPreviewTime(str);
      } catch (e) {
        setPreviewTime("");
      }
    };
    updatePreview();
    const interval = setInterval(updatePreview, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    if (newCountry === "India") {
      setTimezone("Asia/Kolkata");
    } else {
      setTimezone("Australia/Sydney");
    }
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty." });
      return;
    }

    if (phone.trim()) {
      const check = validatePhone(phone.trim(), country, false);
      if (!check.isValid) {
        setProfileMsg({ type: "error", text: check.error });
        return;
      }
    }

    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        country,
        timezone,
      });
      setGlobalTimezone(timezone, country);
      setProfileMsg({
        type: "success",
        text: "Profile details updated successfully.",
      });
      toast.success(
        "Profile Saved",
        "Your details and regional timezone have been updated.",
      );
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (!currentPassword) {
      setPasswordMsg({
        type: "error",
        text: "Please enter your current password.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSavingPassword(true);

    try {
      await updateProfile({ currentPassword, newPassword });
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully.",
      });
      toast.success(
        "Password Changed",
        "Your account password has been updated.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          "Incorrect current password or server error.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const userInitial = (name || user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 space-y-6">
      {/* Sleek Profile Header Banner */}
      <div className="rounded-3xl liquid-glass p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Initials */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl liquid-glass-pill flex items-center justify-center text-slate-800 font-extrabold text-2xl sm:text-3xl shrink-0 shadow-sm">
            {userInitial}
          </div>

          {/* User Details */}
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight liquid-heading truncate">
                {name || user?.name || "My Profile"}
              </h1>

              {isSuperAdmin ? (
                <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-600 bg-amber-500/10">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Super Admin</span>
                </span>
              ) : (
                <span className="liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700">
                  <User className="w-3 h-3 text-slate-500" />
                  <span>Account Owner</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email}</span>
              </span>

              <span className="text-slate-300 hidden sm:inline">•</span>

              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {country === "India" ? "🇮🇳 India" : "🇦🇺 Australia"} (
                  {timezone.split("/")[1] || timezone})
                </span>
              </span>
            </div>

            <p className="text-xs text-slate-500 pt-1 font-medium">
              Manage your personal information, regional time zone, and account
              security.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200/80 flex items-center gap-6 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-px shrink-0 font-bold ${
            activeTab === "general"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>General & Region</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-px shrink-0 font-bold ${
            activeTab === "security"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 1: General Profile & Region */}
      {activeTab === "general" && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Update your contact details and default country time zone for
              client call reminders.
            </p>
          </div>

          {profileMsg.text && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateInfo} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address{" "}
                  <span className="text-slate-400 font-normal">
                    (Account ID)
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full pl-10 pr-4 py-2.5 liquid-glass-pill rounded-2xl text-base sm:text-sm text-slate-500 cursor-not-allowed select-none font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={
                    country === "India" ? "+91 98765 43210" : "+61 412 345 678"
                  }
                  className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Format:{" "}
                {country === "India"
                  ? "Indian 10-digit mobile number"
                  : "Australian mobile or landline"}
              </p>
            </div>

            {/* Country for Time Zone */}
            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-pill space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-500" />
                    <span>Select Country for Time Zone</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Controls your top dashboard clock
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Australia Option Card */}
                  <div
                    onClick={() => handleCountryChange("Australia")}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      country === "Australia"
                        ? "liquid-glass ring-2 ring-amber-400 shadow-sm"
                        : "liquid-glass-pill hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇦🇺</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Australia</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Sydney, Melbourne, Brisbane, Adelaide
                        </p>
                      </div>
                    </div>
                    {country === "Australia" && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                  </div>

                  {/* India Option Card */}
                  <div
                    onClick={() => handleCountryChange("India")}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      country === "India"
                        ? "liquid-glass ring-2 ring-amber-400 shadow-sm"
                        : "liquid-glass-pill hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇮🇳</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>India</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          India Standard Time (IST — UTC+5:30)
                        </p>
                      </div>
                    </div>
                    {country === "India" && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timezone Selection & Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Preferred Time Zone
                </label>

                {country === "Australia" ? (
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 focus:outline-none cursor-pointer font-semibold"
                  >
                    {AUSTRALIAN_TIMEZONES.map((tz) => (
                      <option
                        key={tz.value}
                        value={tz.value}
                        className="bg-white text-slate-800"
                      >
                        {tz.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3.5 py-2.5 liquid-glass-input rounded-2xl text-xs sm:text-sm text-slate-800 font-mono flex items-center justify-between font-semibold">
                    <span>India Standard Time (IST — UTC+5:30)</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Asia/Kolkata
                    </span>
                  </div>
                )}

                {/* Live Clock Preview */}
                {previewTime && (
                  <div className="mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-2xl liquid-glass-pill text-xs font-mono text-slate-700">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Live Time Preview:</span>
                    </span>
                    <span className="font-bold text-amber-600 tabular-nums">
                      {previewTime}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-11.5 py-2.5 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition shadow-lg shadow-amber-500/25 border border-amber-300/40 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingProfile ? "Saving..." : "Save Profile Changes"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <div className="liquid-glass rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Security & Password
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Change your account password to keep your client reminders and
              records secure.
            </p>
          </div>

          {passwordMsg.text && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-2xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-11.5 py-2.5 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition shadow-lg shadow-amber-500/25 border border-amber-300/40 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {savingPassword ? "Updating Password..." : "Update Password"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
