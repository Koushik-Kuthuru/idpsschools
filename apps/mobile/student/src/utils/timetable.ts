import type { TimetableDay } from '@/types';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getSchoolWeekStart(reference = new Date()): Date {
  const today = startOfDay(reference);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + offset);
  return monday;
}

export function buildSchoolWeekDays(reference = new Date()): Omit<TimetableDay, 'slots'>[] {
  const today = startOfDay(reference);
  const monday = getSchoolWeekStart(reference);

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const normalized = startOfDay(current);

    return {
      day: WEEKDAY_NAMES[normalized.getDay()],
      shortDay: SHORT_DAYS[normalized.getDay()],
      date: normalized.getDate(),
      month: normalized.getMonth() + 1,
      year: normalized.getFullYear(),
      fullDate: normalized.toISOString(),
      isToday: normalized.getTime() === today.getTime(),
    };
  });
}

export function formatTimetableWeekRange(days: Pick<TimetableDay, 'date' | 'month' | 'year' | 'fullDate'>[]): string {
  if (days.length === 0) return '';

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const first = firstDay?.fullDate ? new Date(firstDay.fullDate) : null;
  const last = lastDay?.fullDate ? new Date(lastDay.fullDate) : null;

  if (first && last) {
    const month = first.toLocaleDateString('en-US', { month: 'long' });
    const year = first.getFullYear();
    return `${month} ${first.getDate()}–${last.getDate()}, ${year}`;
  }

  return '';
}

export function formatTimetableWeekLabel(days: Pick<TimetableDay, 'date' | 'month' | 'year' | 'fullDate'>[]): string {
  const range = formatTimetableWeekRange(days);
  return range ? `CLASS 10-A | ${range}` : 'CLASS 10-A';
}

export function formatTimetableDayLabel(day: TimetableDay): string {
  if (day.fullDate) {
    return new Date(day.fullDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const month = day.month
    ? new Date(2000, day.month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
    : '';
  const year = day.year ?? new Date().getFullYear();
  return `${day.day}${day.date ? `, ${month} ${day.date}, ${year}` : ''}`;
}
