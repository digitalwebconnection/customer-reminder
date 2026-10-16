import React, { useState } from 'react';
import { X, PhoneCall, CheckCircle2, Calendar, FileText, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const OUTCOMES = [
  { value: 'answered', label: 'Answered — Had Conversation', color: 'text-emerald-400 border-emerald-500/30' },
  { value: 'callback_requested', label: 'Callback Requested', color: 'text-amber-400 border-amber-500/30' },
  { value: 'busy', label: 'Line Busy / Engaged', color: 'text-rose-400 border-rose-500/30' },
  { value: 'no_answer', label: 'No Answer / Voicemail Left', color: 'text-slate-400 border-slate-700' },
  { value: 'not_interested', label: 'Not Interested / Lost', color: 'text-zinc-500 border-zinc-800' },
];

export default function CompleteCallModal({ isOpen, onClose, reminder, onCompleted }) {
  const [outcome, setOutcome] = useState('answered');
  const [notes, setNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDateTime, setNextDateTime] = useState('');
  const [nextTitle, setNextTitle] = useState('Next follow-up call');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !reminder) return null;

  const customerName = reminder.customer?.name || 'Customer';
  const customerPhone = reminder.customer?.phone || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        outcome,
        notes: notes.trim(),
        nextReminderDueAt: scheduleNext && nextDateTime ? new Date(nextDateTime).toISOString() : null,
        nextReminderTitle: scheduleNext ? nextTitle.trim() : null,
      };

      await api.post(`/reminders/${reminder._id}/complete`, payload);
      onCompleted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Record Call Outcome</h3>
              <p className="text-xs text-slate-400">
                {customerName} &bull; <a href={`tel:${customerPhone}`} className="text-indigo-400 hover:underline">{customerPhone}</a>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Quick Call Action Button */}
          {customerPhone && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-400">Need to call again?</span>
                <p className="font-mono text-indigo-300 font-medium">{customerPhone}</p>
              </div>
              <a
                href={`tel:${customerPhone}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Phone</span>
              </a>
            </div>
          )}

          {/* Outcome Select */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">What happened on the call?</label>
            <div className="space-y-1.5">
              {OUTCOMES.map((item) => (
                <label
                  key={item.value}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                    outcome === item.value
                      ? 'bg-slate-800/80 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="call_outcome"
                    value={item.value}
                    checked={outcome === item.value}
                    onChange={() => {
                      setOutcome(item.value);
                      if (item.value === 'callback_requested') {
                        setScheduleNext(true);
                      }
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Call Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of conversation, key points discussed, objections, or commitments..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Schedule Next Follow-up Checkbox */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-medium text-indigo-300">
                Schedule next follow-up call reminder for this customer
              </span>
            </label>

            {scheduleNext && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Follow-up Subject</label>
                  <input
                    type="text"
                    value={nextTitle}
                    onChange={(e) => setNextTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Next Call Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={nextDateTime}
                    onChange={(e) => setNextDateTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Completing...' : 'Mark Call Complete'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
