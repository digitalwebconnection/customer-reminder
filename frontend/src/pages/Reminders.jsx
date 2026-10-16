import React, { useState } from 'react';
import { BellRing, Plus, Calendar, Clock, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Reminders() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Call Reminders</h2>
          <p className="text-sm text-slate-400">View upcoming, overdue, and scheduled calls.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Reminder</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {['all', 'today', 'upcoming', 'overdue', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              filter === tab
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <BellRing className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No scheduled reminders</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Reminder scheduling, filters, and call outcome completion will be implemented in Step 5.
        </p>
      </div>
    </div>
  );
}
