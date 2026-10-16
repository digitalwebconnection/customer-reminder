/**
 * Australian Timezone & Date/Time utilities
 */

export const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney, NSW / Canberra, ACT (AEDT/AEST)', state: 'NSW', short: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne, VIC (AEDT/AEST)', state: 'VIC', short: 'Melbourne' },
  { value: 'Australia/Brisbane', label: 'Brisbane, QLD (AEST — No DST)', state: 'QLD', short: 'Brisbane' },
  { value: 'Australia/Adelaide', label: 'Adelaide, SA (ACDT/ACST)', state: 'SA', short: 'Adelaide' },
  { value: 'Australia/Perth', label: 'Perth, WA (AWST — No DST)', state: 'WA', short: 'Perth' },
  { value: 'Australia/Darwin', label: 'Darwin, NT (ACST — No DST)', state: 'NT', short: 'Darwin' },
  { value: 'Australia/Hobart', label: 'Hobart, TAS (AEDT/AEST)', state: 'TAS', short: 'Hobart' },
];

export const DEFAULT_TIMEZONE = 'Australia/Sydney';

/**
 * Convert local date string (YYYY-MM-DD) and time string (HH:mm) in a target Australian timezone to UTC ISO string
 */
export function combineDateAndTimeToUTC(dateStr, timeStr, timezone = DEFAULT_TIMEZONE) {
  if (!dateStr || !timeStr) return null;

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const invdate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    const diff = targetDate.getTime() - invdate.getTime();

    return new Date(utcDate.getTime() - diff).toISOString();
  } catch (err) {
    console.error('Error converting date/time to UTC:', err);
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }
}

/**
 * Format a UTC Date input into readable Australian format with timezone label
 * e.g. "17 Oct 2026, 02:30 PM (Sydney)"
 */
export function formatInAustralianTime(dateInput, timezone = DEFAULT_TIMEZONE) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const zoneObj = AUSTRALIAN_TIMEZONES.find((z) => z.value === timezone);
  const shortCity = zoneObj ? zoneObj.short : 'AU';

  const formatted = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  return `${formatted} (${shortCity})`;
}

/**
 * Extract YYYY-MM-DD and HH:mm from UTC Date for a specific Australian timezone
 */
export function getPartsInAustralianTimezone(dateInput, timezone = DEFAULT_TIMEZONE) {
  if (!dateInput) return { date: '', time: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { date: '', time: '' };

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  let year = '', month = '', day = '', hour = '', minute = '';
  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}
