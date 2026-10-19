/**
 * International Regional Timezone & Date/Time utilities
 * Supports Australia & India
 */

export const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney, NSW / Canberra, ACT (AEDT/AEST)', state: 'NSW', short: 'Sydney', country: 'Australia', offset: 'AEDT/AEST' },
  { value: 'Australia/Melbourne', label: 'Melbourne, VIC (AEDT/AEST)', state: 'VIC', short: 'Melbourne', country: 'Australia', offset: 'AEDT/AEST' },
  { value: 'Australia/Brisbane', label: 'Brisbane, QLD (AEST — No DST)', state: 'QLD', short: 'Brisbane', country: 'Australia', offset: 'AEST' },
  { value: 'Australia/Adelaide', label: 'Adelaide, SA (ACDT/ACST)', state: 'SA', short: 'Adelaide', country: 'Australia', offset: 'ACDT/ACST' },
];

export const INDIAN_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST — UTC+5:30)', state: 'IST', short: 'India', country: 'India', offset: 'IST (UTC+5:30)' },
];

export const COUNTRIES = [
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultTimezone: 'Australia/Sydney',
    timezones: AUSTRALIAN_TIMEZONES,
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    defaultTimezone: 'Asia/Kolkata',
    timezones: INDIAN_TIMEZONES,
  },
];

export const ALL_TIMEZONES = [
  ...AUSTRALIAN_TIMEZONES,
  ...INDIAN_TIMEZONES,
];

export const DEFAULT_TIMEZONE = 'Australia/Sydney';
export const DEFAULT_COUNTRY = 'Australia';

/**
 * Convert local date string (YYYY-MM-DD) and time string (HH:mm) in a target timezone to UTC ISO string
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
 * Format a UTC Date input into readable format with timezone label
 * e.g. "17 Oct 2026, 02:30 PM (Sydney)" or "19 Oct 2026, 12:30 PM (India)"
 */
export function formatInAustralianTime(dateInput, timezone = DEFAULT_TIMEZONE) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const zoneObj = ALL_TIMEZONES.find((z) => z.value === timezone);
  const shortCity = zoneObj ? zoneObj.short : (timezone === 'Asia/Kolkata' ? 'India' : 'AU');
  const locale = timezone === 'Asia/Kolkata' ? 'en-IN' : 'en-AU';

  const formatted = new Intl.DateTimeFormat(locale, {
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

// Universal alias
export const formatInTimezone = formatInAustralianTime;

/**
 * Extract YYYY-MM-DD and HH:mm from UTC Date for a specific timezone
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

export const getPartsInTimezone = getPartsInAustralianTimezone;
