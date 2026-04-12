import type { DayOfWeek } from './types';

export const HOUR_HEIGHT_PX = 48;

export const WEEK_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
];

/** Parses "HH:mm:ss" or "HH:mm" into total minutes */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Formats "HH:mm:ss" → "HH:mm" for display */
export function formatTime(time: string): string {
  return time.substring(0, 5);
}

/** Pixel offset from the top of the grid for a given time */
export function timeToTop(time: string, scheduleStartTime: string): number {
  return (
    ((timeToMinutes(time) - timeToMinutes(scheduleStartTime)) / 60) *
    HOUR_HEIGHT_PX
  );
}

/** Pixel height for a block spanning startTime → endTime */
export function blockHeight(startTime: string, endTime: string): number {
  return (
    ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * HOUR_HEIGHT_PX
  );
}

/** Total grid height in pixels */
export function totalGridHeight(
  scheduleStartTime: string,
  scheduleEndTime: string
): number {
  return (
    ((timeToMinutes(scheduleEndTime) - timeToMinutes(scheduleStartTime)) / 60) *
    HOUR_HEIGHT_PX
  );
}

/** Integer hours to render grid lines: [7, 8, ..., 17] for "07:00"–"17:00" */
export function hoursRange(
  scheduleStartTime: string,
  scheduleEndTime: string
): number[] {
  const startHour = Math.floor(timeToMinutes(scheduleStartTime) / 60);
  const endHour = Math.floor(timeToMinutes(scheduleEndTime) / 60);
  return Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i
  );
}

/** Returns the Monday of the week containing date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Returns [Mon, Tue, Wed, Thu, Fri] Date objects for the given week start */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Converts total minutes to "HH:mm:ss" string */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Adds n weeks to a date */
export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** Returns the first day of the month containing date */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Adds n months to a date (returns the 1st of that month) */
export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/** Returns Monday-start dates for all weeks that intersect the given month */
export function getMonthWeeks(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: Date[] = [];
  let cur = getWeekStart(firstDay);
  while (cur <= lastDay) {
    weeks.push(new Date(cur));
    cur = addWeeks(cur, 1);
  }
  return weeks;
}

const DAY_TO_OFFSET: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/**
 * Returns the ISO date string for a schedule block given the week it belongs to.
 * MODIFICATION blocks carry their own date; TEMPLATE blocks are derived from weekStart + dayOfWeek.
 */
export function blockDateStr(
  block: { dayOfWeek: DayOfWeek; date?: string },
  weekStart: Date
): string {
  if (block.date) return block.date;
  const d = new Date(weekStart);
  d.setDate(d.getDate() + DAY_TO_OFFSET[block.dayOfWeek]);
  return d.toISOString().slice(0, 10);
}
