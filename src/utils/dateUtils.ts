/**
 * Date utilities — timezone-aware for São Paulo (UTC-3)
 * All date comparisons should use these helpers instead of toISOString()
 */

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Get today's date string in YYYY-MM-DD format, respecting local timezone
 */
export function getTodayStr(): string {
  return getLocalDateStr(new Date());
}

/**
 * Get yesterday's date string in YYYY-MM-DD format, respecting local timezone
 */
export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateStr(d);
}

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 */
export function getLocalDateStr(date: Date): string {
  // Use Intl.DateTimeFormat for reliable timezone conversion
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Get a date N days ago as YYYY-MM-DD in local timezone
 */
export function getDaysAgoStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateStr(d);
}

/**
 * Get current hour in local timezone (for greetings, etc.)
 */
export function getLocalHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10
  );
}
