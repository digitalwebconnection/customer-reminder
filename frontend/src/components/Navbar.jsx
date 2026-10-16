import React, { useEffect, useState } from 'react';
import { Menu, Globe, Activity, User, Bell } from 'lucide-react';
import api from '../api/axios';
import { useTimezone } from '../context/TimezoneContext';

export default function Navbar({ onToggleSidebar, title }) {
  const { timezone, setTimezone, currentTzTime, supportedTimezones } = useTimezone();
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });
  const [tzDropdownOpen, setTzDropdownOpen] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealth({
        status: res.data.status,
        database: res.data.database,
        storageMode: res.data.storageMode,
      });
    } catch (err) {
      setHealth({ status: 'offline', database: 'disconnected', storageMode: 'none' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentTzObj = supportedTimezones.find((t) => t.value === timezone) || {
    label: timezone,
    state: 'AU',
  };

  return (
    <header className="h-16 bg-[#0d1322]/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Australian Timezone Selector & Live Clock */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setTzDropdownOpen(!tzDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 text-slate-200 transition shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <div className="text-left hidden sm:block">
              <span className="font-semibold text-indigo-300">{currentTzObj.state || 'AU'}</span>
              <span className="text-slate-400 text-[11px] ml-1.5">{currentTzTime}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">▼</span>
          </button>

          {tzDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setTzDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in">
                <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                  Australian Timezones
                </p>
                <div className="max-h-64 overflow-y-auto mt-1 space-y-0.5">
                  {supportedTimezones.map((tz) => (
                    <button
                      key={tz.value}
                      onClick={() => {
                        setTimezone(tz.value);
                        setTzDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                        timezone === tz.value
                          ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{tz.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{tz.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Backend API Health Status Indicator */}
        <div
          title={`API: ${health.status} | Mode: ${health.storageMode} | Database: ${health.database}`}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-800 cursor-help"
        >
          <Activity
            className={`w-3.5 h-3.5 ${
              health.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
          <span className="text-slate-300 hidden md:inline">API</span>
          <span
            className={`w-2 h-2 rounded-full ${
              health.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden lg:block text-xs font-medium text-slate-300">
            Owner
          </span>
        </div>
      </div>
    </header>
  );
}
