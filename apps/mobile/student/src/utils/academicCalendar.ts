import type { AcademicCalendarEvent, AcademicCalendarEventType } from '@/types';

export const CALENDAR_FILTERS: { key: 'all' | AcademicCalendarEventType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'academic', label: 'Academic' },
  { key: 'exam', label: 'Exams' },
  { key: 'holiday', label: 'Holidays' },
  { key: 'event', label: 'Events' },
];

export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export function dayIndexMondayStart(date: Date): number {
  const js = date.getDay();
  return (js + 6) % 7;
}

export function buildMonthCells(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const gridStart = addDays(monthStart, -dayIndexMondayStart(monthStart));
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function eventsForDate(events: AcademicCalendarEvent[], date: Date): AcademicCalendarEvent[] {
  const key = dateKey(date);
  return events.filter((event) => event.date === key);
}

export function eventsByDateMap(events: AcademicCalendarEvent[]): Map<string, AcademicCalendarEvent[]> {
  const map = new Map<string, AcademicCalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}

export function filterCalendarEvents(
  events: AcademicCalendarEvent[],
  filter: 'all' | AcademicCalendarEventType,
): AcademicCalendarEvent[] {
  if (filter === 'all') return events;
  return events.filter((event) => event.type === filter);
}

export function eventTypeMeta(type: AcademicCalendarEventType): { label: string; color: string; bg: string } {
  switch (type) {
    case 'academic':
      return { label: 'Academic', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' };
    case 'exam':
      return { label: 'Exam', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.12)' };
    case 'holiday':
      return { label: 'Holiday', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' };
    case 'meeting':
      return { label: 'Meeting', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' };
    default:
      return { label: 'Event', color: '#144835', bg: 'rgba(20, 72, 53, 0.12)' };
  }
}

export function formatSelectedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
