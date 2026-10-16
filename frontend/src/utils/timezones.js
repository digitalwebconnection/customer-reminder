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
 * Format a UTC date into the selected Australian timezone
 */
export function formatInAustralianTz(
  dateInput,
  timezone = DEFAULT_AUSTRALIAN_TIMEZONE,
  options = {}
) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const defaultOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  };

  return new Intl.DateTimeFormat('en-AU', defaultOptions).format(date);
}

/**
 * Format relative time (e.g., "in 15 mins", "2 hours overdue")
 */
export function formatTimeRelative(dateInput, now = new Date()) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const absMins = Math.abs(diffMins);

  if (diffMins < 0) {
    if (absMins < 1) return 'Due just now';
    if (absMins < 60) return `${absMins}m overdue`;
    const hours = Math.floor(absMins / 60);
    const remMins = absMins % 60;
    if (hours < 24) return `${hours}h ${remMins > 0 ? remMins + 'm ' : ''}overdue`;
    const days = Math.floor(hours / 24);
    return `${days}d overdue`;
  } else {
    if (diffMins === 0) return 'Due now';
    if (diffMins < 60) return `in ${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    if (hours < 24) return `in ${hours}h ${remMins > 0 ? remMins + 'm' : ''}`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
  }
}
