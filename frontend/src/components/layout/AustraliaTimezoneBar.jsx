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
    <div className="bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800/80 px-3 sm:px-6 py-1.5 sm:py-2 text-[11px] select-none shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Profile Country Indicator (Set from user profile, not changed manually) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-[10px] font-bold shadow-xs select-none"
            title={`Timezone region set from your profile (${activeCountry})`}
          >
            <span>{activeCountry === "India" ? "🇮🇳" : "🇦🇺"}</span>
            <span className="font-semibold">{activeCountry}</span>
          </div>
        </div>

        {/* Live Regional Clocks: Filtered by active country */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 touch-pan-x overscroll-x-contain">
          {visibleZones.map((zone) => {
            const isSelected = selectedTimezone === zone.id;
            const data = clockData[zone.id] || { time: "Loading...", code: "" };

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setTimezone(zone.id, zone.country)}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-left transition-all duration-200 cursor-pointer shrink-0 active:scale-95 group ${
                  isSelected
                    ? "bg-zinc-800 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/40"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50"
                }`}
                title={`Click to set ${zone.city} (${zone.id}) as your active reminder timezone`}
              >
                <span className="text-xs">{zone.flag}</span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-300 group-hover:text-white transition">
                      {zone.city}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700/50">
                      {zone.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-100 tabular-nums">
                    <span className="tabular-nums">{data.time}</span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">
                      {data.code}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5 shadow-xs shadow-emerald-400/50"
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
