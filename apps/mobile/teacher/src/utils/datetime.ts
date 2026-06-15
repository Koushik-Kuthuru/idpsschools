/** e.g. "Thursday, Jun 4, 2026" */
export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** e.g. "June 2026" */
export function formatMonthYear(date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** e.g. "2:45 PM" */
export function formatTime12h(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** e.g. "Thursday, Jun 4, 2026 • 2:45 PM • Campus Live" */
export function formatDashboardDateLine(date = new Date()): string {
  const timePart = formatTime12h(date);
  return `${formatLongDate(date)} • ${timePart} • Campus Live`;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday-based week start */
export function startOfWeekMonday(date = new Date()): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export function formatWeekdayLetter(date: Date): string {
  const day = date.getDay();
  return WEEKDAY_LETTERS[day === 0 ? 6 : day - 1];
}

export function eventDateFromOffset(dayOffset: number, base = new Date()): Date {
  return startOfDay(addDays(base, dayOffset));
}

export function formatEventSchedule(hour: number, minute: number, location: string, base = new Date()): string {
  const when = new Date(base);
  when.setHours(hour, minute, 0, 0);
  return `${formatTime12h(when)} · ${location}`;
}

/** e.g. "Thursday, Jun 4, 2026 • Term 2 — Week 23" */
export function formatAcademicTermLine(date = new Date()): string {
  const month = date.getMonth();
  const term = month < 4 ? 'Term 1' : month < 8 ? 'Term 2' : 'Term 3';
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + yearStart.getDay() + 1) / 7);
  return `${formatLongDate(date)} • ${term} — Week ${week}`;
}
