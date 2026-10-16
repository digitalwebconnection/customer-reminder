import React from 'react';

export default function StatusBadge({ status, label }) {
  const normalizedStatus = (status || '').toLowerCase();

  const styles = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    archived: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  };

  const currentStyle = styles[normalizedStatus] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label || status || 'Unknown'}
    </span>
  );
}
