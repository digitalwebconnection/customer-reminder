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
    <div className="bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-1.5 overflow-x-auto text-[11px] select-none scrollbar-thin shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-[760px]">
        {/* Label Header */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-base">🇦🇺</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Australia Live Clocks</span>
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-left transition cursor-pointer group ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
                title={`Click to set ${zone.city} (${zone.id}) as your active reminder timezone`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                      {zone.city}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                      {zone.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-100">
                    <span>{data.time}</span>
                    <span className="text-[9px] text-indigo-400/90 uppercase">{data.code}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Active selection" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
