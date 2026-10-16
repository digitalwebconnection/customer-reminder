import React, { useState, useEffect } from 'react';
import { Clock, Globe, Check } from 'lucide-react';
import { useTimezone } from '../context/TimezoneContext';

export const AUSTRALIAN_ZONES = [
  { id: 'Australia/Sydney', city: 'Sydney', state: 'NSW/ACT' },
  { id: 'Australia/Melbourne', city: 'Melbourne', state: 'VIC' },
  { id: 'Australia/Brisbane', city: 'Brisbane', state: 'QLD' },
  { id: 'Australia/Adelaide', city: 'Adelaide', state: 'SA' },
  { id: 'Australia/Perth', city: 'Perth', state: 'WA' },
  { id: 'Australia/Darwin', city: 'Darwin', state: 'NT' },
  { id: 'Australia/Hobart', city: 'Hobart', state: 'TAS' },
];

export default function AustraliaTimezoneBar() {
  const { selectedTimezone, setTimezone } = useTimezone();
  const [clockData, setClockData] = useState({});

  useEffect(() => {
    const updateAllClocks = () => {
      const now = new Date();
      const newClocks = {};

      AUSTRALIAN_ZONES.forEach((z) => {
        try {
          const parts = new Intl.DateTimeFormat('en-AU', {
            timeZone: z.id,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short',
          }).formatToParts(now);

          let hour = '', minute = '', second = '', dayPeriod = '', tzName = '';
          parts.forEach((p) => {
            if (p.type === 'hour') hour = p.value;
            if (p.type === 'minute') minute = p.value;
            if (p.type === 'second') second = p.value;
            if (p.type === 'dayPeriod') dayPeriod = p.value;
            if (p.type === 'timeZoneName') tzName = p.value;
          });

          newClocks[z.id] = {
            time: `${hour}:${minute}:${second} ${dayPeriod.toUpperCase()}`,
            code: tzName,
          };
        } catch (e) {
          newClocks[z.id] = {
            time: '--:--:--',
            code: 'AU',
          };
        }
      });

      setClockData(newClocks);
    };

    updateAllClocks();
    const interval = setInterval(updateAllClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#070b14]/90 backdrop-blur-xl border-b border-white/[0.06] px-3 sm:px-6 py-2 overflow-x-auto text-[11px] select-none scrollbar-none shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-[760px]">
        {/* Label Header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-5 h-5 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs">
            🇦🇺
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>Australia Live Regional Clocks</span>
          </span>
        </div>

        {/* Live Australian Timezone Clocks */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {AUSTRALIAN_ZONES.map((zone) => {
            const isSelected = selectedTimezone === zone.id;
            const data = clockData[zone.id] || { time: 'Loading...', code: '' };

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setTimezone(zone.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-left transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950/90 to-slate-900 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/50 border-white/[0.06] text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
                title={`Click to set ${zone.city} (${zone.id}) as your active reminder timezone`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition">
                      {zone.city}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800/90 text-indigo-300/90 font-mono border border-white/[0.05]">
                      {zone.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-100">
                    <span>{data.time}</span>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase">{data.code}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5 shadow-sm shadow-emerald-400/50" title="Active selection" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
