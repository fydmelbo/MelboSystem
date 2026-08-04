// Guatemala timezone helper (UTC-6, no DST)
// All date operations use Guatemala local time

const GUATEMALA_OFFSET = -6; // UTC-6 hours

/**
 * Get current date in Guatemala as YYYY-MM-DD string
 */
export function getGuatemalaDate(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const guatemala = new Date(utc + GUATEMALA_OFFSET * 3600000);
  return guatemala.toISOString().split('T')[0];
}

/**
 * Get start of day (00:00:00.000) in Guatemala for a given YYYY-MM-DD string
 */
export function getGuatemalaStartOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in Guatemala time, then convert to UTC for Firestore
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - GUATEMALA_OFFSET * 3600000);
}

/**
 * Get end of day (23:59:59.999) in Guatemala for a given YYYY-MM-DD string
 */
export function getGuatemalaEndOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - GUATEMALA_OFFSET * 3600000);
}

/**
 * Check if a given YYYY-MM-DD string is today in Guatemala
 */
export function isGuatemalaToday(dateStr: string): boolean {
  return dateStr === getGuatemalaDate();
}

/**
 * Convert a Firestore Timestamp or date string to a Date object
 */
export function toDate(value: any): Date {
  if (!value) return new Date(0);
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate(); // Firestore Timestamp
  }
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000); // Firestore-like timestamp
  }
  return new Date(value); // String or Date
}

/**
 * Format a Firestore Timestamp or date string to Guatemala date string (DD/MM/YYYY)
 */
export function formatGuatemalaDate(value: any): string {
  const d = toDate(value);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Guatemala',
  });
}

/**
 * Format a Firestore Timestamp or date string to Guatemala time string (HH:MM:SS)
 */
export function formatGuatemalaTime(value: any): string {
  const d = toDate(value);
  return d.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Guatemala',
  });
}

/**
 * Format a Firestore Timestamp or date string to full Guatemala datetime
 */
export function formatGuatemalaDateTime(value: any): string {
  const d = toDate(value);
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guatemala',
  });
}
