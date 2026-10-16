export const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney, NSW (AEDT/AEST)', state: 'NSW', default: true },
  { value: 'Australia/Melbourne', label: 'Melbourne, VIC (AEDT/AEST)', state: 'VIC' },
  { value: 'Australia/Brisbane', label: 'Brisbane, QLD (AEST — No DST)', state: 'QLD' },
  { value: 'Australia/Adelaide', label: 'Adelaide, SA (ACDT/ACST)', state: 'SA' },
  { value: 'Australia/Perth', label: 'Perth, WA (AWST — No DST)', state: 'WA' },
  { value: 'Australia/Darwin', label: 'Darwin, NT (ACST — No DST)', state: 'NT' },
  { value: 'Australia/Hobart', label: 'Hobart, TAS (AEDT/AEST)', state: 'TAS' },
  { value: 'Australia/Canberra', label: 'Canberra, ACT (AEDT/AEST)', state: 'ACT' },
  { value: 'Australia/Eucla', label: 'Eucla, WA (CWST — UTC+8:45)', state: 'WA' },
  { value: 'Australia/Lord_Howe', label: 'Lord Howe Island (UTC+10:30/+11)', state: 'NSW' },
];

export const DEFAULT_AUSTRALIAN_TIMEZONE = 'Australia/Sydney';

/**
 * Get start and end of "today" in the specified timezone
 */
export function getDayBoundariesInTimezone(tz = DEFAULT_AUSTRALIAN_TIMEZONE, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [year, month, day] = formatter.format(date).split('-').map(Number);

  // Construct start of day and end of day in the specified timezone
  // Format as ISO string with target timezone offset
  const nowInTz = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const diff = nowInTz.getTime() - date.getTime();

  const startOfDayLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDayLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    startOfDay: new Date(startOfDayLocal.getTime() - diff),
    endOfDay: new Date(endOfDayLocal.getTime() - diff),
    dateString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}
