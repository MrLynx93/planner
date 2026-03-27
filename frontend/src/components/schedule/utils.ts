import type { DayOfWeek } from './types'

export const HOUR_HEIGHT_PX = 64

export const WEEK_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
]

/** Parses "HH:mm:ss" or "HH:mm" into total minutes */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Formats "HH:mm:ss" → "HH:mm" for display */
export function formatTime(time: string): string {
  return time.substring(0, 5)
}

/** Pixel offset from the top of the grid for a given time */
export function timeToTop(time: string, openingTime: string): number {
  return ((timeToMinutes(time) - timeToMinutes(openingTime)) / 60) * HOUR_HEIGHT_PX
}

/** Pixel height for a block spanning startTime → endTime */
export function blockHeight(startTime: string, endTime: string): number {
  return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * HOUR_HEIGHT_PX
}

/** Total grid height in pixels */
export function totalGridHeight(openingTime: string, closingTime: string): number {
  return ((timeToMinutes(closingTime) - timeToMinutes(openingTime)) / 60) * HOUR_HEIGHT_PX
}

/** Integer hours to render grid lines: [7, 8, ..., 17] for "07:00"–"17:00" */
export function hoursRange(openingTime: string, closingTime: string): number[] {
  const startHour = Math.floor(timeToMinutes(openingTime) / 60)
  const endHour = Math.ceil(timeToMinutes(closingTime) / 60)
  return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
}

/** Returns the Monday of the week containing date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** Returns [Mon, Tue, Wed, Thu, Fri] Date objects for the given week start */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

/** Adds n weeks to a date */
export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}
