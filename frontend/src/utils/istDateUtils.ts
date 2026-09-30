// Fixed offset for Indian Standard Time (IST): UTC+5:30 in minutes
const IST_OFFSET_MINUTES = 330;

/**
 * Returns a Date object shifted into IST context.
 */
export function getISTDate(date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MINUTES * 60000);
}

/**
 * Formats a Date or ISO timestamp into IST time (e.g. "09:30 AM", "02:00 PM").
 */
export function formatISTTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

/**
 * Formats a Date or ISO timestamp into IST date header (e.g. "Mon, 28 Sep").
 */
export function formatISTDateHeader(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Returns an array of 7 Date objects representing the 7 days of the selected week (Monday -> Sunday)
 */
export function getWeekDays(referenceDate: Date): Date[] {
  const istCurrent = getISTDate(referenceDate);
  const dayOfWeek = istCurrent.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (dayOfWeek + 6) % 7; // Monday becomes index 0

  const monday = new Date(istCurrent);
  monday.setDate(istCurrent.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

/**
 * Combines an IST Date (YYYY-MM-DD) and an IST time string ("HH:MM") into an ISO UTC string.
 */
export function istDateTimeToUTC(date: Date, timeStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Format as RFC3339 with explicit +05:30 offset
  const istIsoWithOffset = `${year}-${month}-${day}T${timeStr}:00+05:30`;
  return new Date(istIsoWithOffset).toISOString();
}

/**
 * Extracts hour (0-23) in IST from an ISO string
 */
export function getISTHourAndMinute(isoString: string): { hour: number; minute: number } {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return { hour, minute };
}