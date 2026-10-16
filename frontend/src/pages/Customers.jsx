import React from 'react';
import { Users, Plus, Search } from 'lucide-react';

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customers</h2>
          <p className="text-sm text-slate-400">Manage contacts, notes, and call history.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone or company..."
          className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No customers yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Customer management endpoints and forms will be connected in Step 4.
        </p>
      </div>
    </div>
  );
}
