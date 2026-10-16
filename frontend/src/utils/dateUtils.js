/**
 * Date & Time utility strictly formatted in Asia/Kolkata timezone
 */

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Format a UTC date string into readable Asia/Kolkata display string
 * e.g. "16 Oct 2026, 02:30 PM"
 */
export function formatKolkataTime(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Combine Date string (YYYY-MM-DD) and Time string (HH:mm) into a single UTC ISO string
 */
export function combineDateAndTimeToUTC(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  // Parse in Asia/Kolkata context (+05:30)
  // Format: "YYYY-MM-DDTHH:mm:00+05:30"
  const isoStringWithKolkataOffset = `${dateStr}T${timeStr}:00+05:30`;
  const date = new Date(isoStringWithKolkataOffset);
  return date.toISOString();
}

/**
 * Convert UTC ISO date into separate { date: 'YYYY-MM-DD', time: 'HH:mm' } in Asia/Kolkata
 */
export function getKolkataDateAndTimeParts(dateInput) {
  if (!dateInput) return { date: '', time: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { date: '', time: '' };

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
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
