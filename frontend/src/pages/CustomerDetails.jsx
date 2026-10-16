import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building, Clock } from 'lucide-react';

export default function CustomerDetails() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customers</span>
      </Link>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Customer Profile ({id})</h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed customer timeline, call logs, and next reminders will be connected in Step 5.
        </p>
      </div>
    </div>
  );
}
