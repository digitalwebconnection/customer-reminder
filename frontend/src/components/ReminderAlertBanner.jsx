import React, { useState, useEffect } from 'react';
import { PhoneCall, BellRing, Clock, X, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { playChimeSound, triggerDesktopNotification } from '../utils/audioAlert';
import { useTimezone } from '../context/TimezoneContext';
import CompleteCallModal from './CompleteCallModal';
import SnoozeModal from './SnoozeModal';

export default function ReminderAlertBanner() {
  const { timezone } = useTimezone();
  const [activeAlert, setActiveAlert] = useState(null);
  const [lastNotifiedId, setLastNotifiedId] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);

  const checkDueReminders = async () => {
    try {
      const res = await api.get(`/reminders?due=today&timezone=${timezone}`);
      const reminders = res.data.data || [];
      const now = new Date();

      // Find pending reminder where dueAt <= now and not yet acknowledged
      const dueNow = reminders.find(
        (r) => r.status === 'pending' && new Date(r.dueAt) <= now
      );

      if (dueNow) {
        setActiveAlert(dueNow);

        if (dueNow._id !== lastNotifiedId) {
          playChimeSound();
          triggerDesktopNotification(
            `Call Reminder: ${dueNow.customer?.name || 'Customer'}`,
            `Time to call ${dueNow.customer?.phone || ''} — ${dueNow.title}`
          );
          setLastNotifiedId(dueNow._id);
        }
      } else {
        setActiveAlert(null);
      }
    } catch (err) {
      // Quiet fail on network hiccups
    }
  };

  useEffect(() => {
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [timezone]);

  if (!activeAlert) return null;

  const customerName = activeAlert.customer?.name || 'Customer';
  const customerPhone = activeAlert.customer?.phone || '';

  return (
    <>
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 p-[1px] shadow-2xl sticky top-0 z-40 animate-bounce-short">
        <div className="bg-[#0b0f19] px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white">
                  Call Due Now
                </span>
                <span className="text-xs font-semibold text-white">{customerName}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeAlert.title} &bull; Objective: {activeAlert.notes || 'Routine follow-up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {customerPhone}</span>
              </a>
            )}

            <button
              onClick={() => setCompleteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Log Outcome</span>
            </button>

            <button
              onClick={() => setSnoozeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze</span>
            </button>

            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Dismiss alert banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {completeModalOpen && (
        <CompleteCallModal
          isOpen={completeModalOpen}
          reminder={activeAlert}
          onClose={() => setCompleteModalOpen(false)}
          onCompleted={() => {
            setActiveAlert(null);
            checkDueReminders();
          }}
        />
      )}

      {snoozeModalOpen && (
        <SnoozeModal
          isOpen={snoozeModalOpen}
          reminder={activeAlert}
          onClose={() => setSnoozeModalOpen(false)}
          onSnoozed={() => {
            setActiveAlert(null);
            checkDueReminders();
          }}
        />
      )}
    </>
  );
}
