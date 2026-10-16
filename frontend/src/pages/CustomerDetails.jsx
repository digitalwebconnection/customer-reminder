import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building, Clock, BellRing, CheckCircle2, AlertCircle, Plus, Calendar } from 'lucide-react';
import api from '../api/axios';
import { useTimezone } from '../context/TimezoneContext';
import { formatInAustralianTz } from '../utils/timezones';
import ReminderModal from '../components/ReminderModal';
import CompleteCallModal from '../components/CompleteCallModal';

export default function CustomerDetails() {
  const { id } = useParams();
  const { timezone } = useTimezone();
  const [customer, setCustomer] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, logsRes, remsRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/call-logs`),
        api.get(`/reminders?due=all&timezone=${timezone}`),
      ]);

      setCustomer(custRes.data.data);
      setCallLogs(logsRes.data.data || []);
      const custReminders = (remsRes.data.data || []).filter(
        (r) => (r.customerId?._id || r.customerId) === id
      );
      setReminders(custReminders);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, timezone]);

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 space-y-4">
        <p>Customer not found</p>
        <Link to="/customers" className="text-indigo-400 hover:underline">Return to Customer List</Link>
      </div>
    );
  }

  const activeReminders = reminders.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer Directory</span>
      </Link>

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/25">
                {customer.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{customer.name}</h2>
                {customer.company && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.company}</span>
                  </p>
                )}
              </div>
            </div>

            {customer.notes && (
              <p className="text-xs text-slate-300 max-w-2xl pt-2 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                "{customer.notes}"
              </p>
            )}
          </div>

          {/* Quick Call & Schedule Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`tel:${customer.phone}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Phone className="w-4 h-4" />
              <span>Call {customer.phone}</span>
            </a>

            <button
              onClick={() => setReminderModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              <span>Schedule Call</span>
            </button>
          </div>
        </div>

        {/* Contact details pills */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-indigo-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>{customer.phone}</span>
          </div>

          {customer.email && (
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <a href={`mailto:${customer.email}`} className="hover:text-indigo-400 transition">
                {customer.email}
              </a>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Added {formatInAustralianTz(customer.createdAt, timezone, { hour: undefined, minute: undefined })}</span>
          </div>
        </div>
      </div>

      {/* Grid: Active Reminders & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Reminders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BellRing className="w-4 h-4 text-indigo-400" />
              <span>Active Scheduled Calls</span>
            </h3>
            <span className="text-xs text-slate-500">{activeReminders.length} pending</span>
          </div>

          {activeReminders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No pending call reminders for this customer.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeReminders.map((r) => (
                <div
                  key={r._id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{r.title}</p>
                    <p className="text-[11px] text-indigo-400 font-mono mt-0.5">
                      Due: {formatInAustralianTz(r.dueAt, timezone)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveReminder(r);
                      setCompleteModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition"
                  >
                    Log Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call History Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Call History & Follow-up Timeline</span>
            </h3>
            <span className="text-xs text-slate-500">{callLogs.length} calls logged</span>
          </div>

          {callLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No previous call logs recorded. Complete a reminder to start the timeline.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 border-l border-slate-800">
              {callLogs.map((log) => (
                <div key={log._id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        {log.outcome}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatInAustralianTz(log.calledAt, timezone)}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-slate-300 italic pt-0.5">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReminderModal
        isOpen={reminderModalOpen}
        preselectedCustomer={customer}
        onClose={() => setReminderModalOpen(false)}
        onSaved={loadData}
      />

      {completeModalOpen && activeReminder && (
        <CompleteCallModal
          isOpen={completeModalOpen}
          reminder={activeReminder}
          onClose={() => setCompleteModalOpen(false)}
          onCompleted={loadData}
        />
      )}
    </div>
  );
}
