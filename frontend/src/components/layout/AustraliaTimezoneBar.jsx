import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { useTimezone } from "../../context/TimezoneContext";
import { useAuth } from "../../context/AuthContext";

export const REGIONAL_ZONES = [
  {
    id: "Australia/Sydney",
    city: "Sydney",
    state: "NSW/ACT",
    flag: "🇦🇺",
    country: "Australia",
  },
  {
    id: "Australia/Melbourne",
    city: "Melbourne",
    state: "VIC",
    flag: "🇦🇺",
    country: "Australia",
  },
  {
    id: "Australia/Brisbane",
    city: "Brisbane",
    state: "QLD",
    flag: "🇦🇺",
    country: "Australia",
  },
  {
    id: "Australia/Adelaide",
    city: "Adelaide",
    state: "SA",
    flag: "🇦🇺",
    country: "Australia",
  },
  {
    id: "Asia/Kolkata",
    city: "India (IST)",
    state: "IST",
    flag: "🇮🇳",
    country: "India",
  },
];

export const AUSTRALIAN_ZONES = REGIONAL_ZONES; // backwards compatibility

export default function AustraliaTimezoneBar() {
  const { user } = useAuth();
  const { selectedTimezone, selectedCountry, setTimezone } = useTimezone();
  const [clockData, setClockData] = useState({});

  // Active country is set strictly by the user's profile
  const activeCountry =
    user?.country ||
    selectedCountry ||
    (selectedTimezone === "Asia/Kolkata" ? "India" : "Australia");

  // Filter to show ONLY Australia timezones for Australia profile, and ONLY India for India profile
  const visibleZones = REGIONAL_ZONES.filter(
    (zone) => zone.country === activeCountry,
  );

  useEffect(() => {
    const updateAllClocks = () => {
      const now = new Date();
      const newClocks = {};

      REGIONAL_ZONES.forEach((z) => {
        try {
          const locale = z.id === "Asia/Kolkata" ? "en-IN" : "en-AU";
          const parts = new Intl.DateTimeFormat(locale, {
            timeZone: z.id,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZoneName: "short",
          }).formatToParts(now);

          let hour = "",
            minute = "",
            second = "",
            dayPeriod = "",
            tzName = "";
          parts.forEach((p) => {
            if (p.type === "hour") hour = p.value;
            if (p.type === "minute") minute = p.value;
            if (p.type === "second") second = p.value;
            if (p.type === "dayPeriod") dayPeriod = p.value;
            if (p.type === "timeZoneName") tzName = p.value;
          });

          newClocks[z.id] = {
            time: `${hour}:${minute}:${second} ${dayPeriod.toUpperCase()}`,
            code: tzName,
          };
        } catch (e) {
          newClocks[z.id] = {
            time: "--:--:--",
            code: z.id === "Asia/Kolkata" ? "IST" : "AU",
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
    <div className="liquid-glass-header px-3 sm:px-6 py-1.5 sm:py-2 text-[11px] select-none border-b border-white/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 min-w-0 w-full">
        {/* Profile Country Indicator (Set from user profile, not changed manually) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex items-center gap-1.5 px-3 py-1 liquid-glass-pill text-slate-800 text-[10px] font-extrabold select-none"
            title={`Timezone region set from your profile (${activeCountry})`}
          >
            <span>{activeCountry === "India" ? "🇮🇳" : "🇦🇺"}</span>
            <span className="font-bold">{activeCountry}</span>
          </div>
        </div>

        {/* Live Regional Clocks: Filtered by active country */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 touch-pan-x overscroll-x-contain min-w-0 flex-1 justify-start sm:justify-end">
          {visibleZones.map((zone) => {
            const isSelected = selectedTimezone === zone.id;
            const data = clockData[zone.id] || { time: "Loading...", code: "" };

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setTimezone(zone.id, zone.country)}
                className={`flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-full text-left transition-all duration-200 cursor-pointer shrink-0 active:scale-95 group ${
                  isSelected
                    ? "liquid-glass-pill text-amber-950 font-bold ring-2 ring-amber-400/60 shadow-sm"
                    : "liquid-glass-pill text-slate-600 hover:text-slate-900 hover:bg-white/80 opacity-90"
                }`}
                title={`Click to set ${zone.city} (${zone.id}) as your active reminder timezone`}
              >
                <span className="text-xs">{zone.flag}</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-800 group-hover:text-amber-700 transition">
                      {zone.city}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-white/80 text-slate-600 font-mono border border-slate-200/60">
                      {zone.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-900 tabular-nums">
                    <span className="tabular-nums">{data.time}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                      {data.code}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 shadow-xs shadow-emerald-500/50"
                    title="Active timezone"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
