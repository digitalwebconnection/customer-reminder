import React, { useEffect, useState } from 'react';
import { Menu, LogOut, Activity, User } from 'lucide-react';
import api from '../api/axios';

export default function Navbar({ onToggleSidebar, title }) {
  const [health, setHealth] = useState({ status: 'checking', database: 'unknown' });

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealth({ status: res.data.status, database: res.data.database });
    } catch (err) {
      setHealth({ status: 'offline', database: 'disconnected' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

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

      <div className="flex items-center gap-4">
        {/* Backend API Health Status Indicator */}
        <div
          title={`API: ${health.status} | DB: ${health.database}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-800 cursor-help"
        >
          <Activity
            className={`w-3.5 h-3.5 ${
              health.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
          <span className="text-slate-300 hidden sm:inline">API</span>
          <span
            className={`w-2 h-2 rounded-full ${
              health.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800/80">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shadow-inner">
            <User className="w-4 h-4" />
          </div>
          <span className="hidden md:block text-xs font-medium text-slate-300">
            Owner
          </span>
        </div>
      </div>
    </header>
  );
}
