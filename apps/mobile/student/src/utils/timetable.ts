import type { TimetableDay, TimetableSlot } from '@/types';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatLocalFullDate(date: Date): string {
  const normalized = startOfDay(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, '0');
  const day = String(normalized.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getSchoolWeekStart(reference = new Date()): Date {
  const today = startOfDay(reference);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + offset);
  return monday;
}

export function getAcademicYearBounds(reference = new Date()): { start: Date; end: Date } {
  const today = startOfDay(reference);
  const year = today.getFullYear();
  const startYear = today.getMonth() >= 5 ? year : year - 1;
  const start = startOfDay(new Date(startYear, 5, 1));
  const end = startOfDay(new Date(startYear + 1, 4, 31));
  return { start, end };
}

export function buildAcademicYearSchoolDays(reference = new Date()): Omit<TimetableDay, 'slots'>[] {
  const today = startOfDay(reference);
  const { start, end } = getAcademicYearBounds(reference);
  const days: Omit<TimetableDay, 'slots'>[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    if (cursor.getDay() !== 0) {
      const normalized = startOfDay(cursor);
      days.push({
        day: WEEKDAY_NAMES[normalized.getDay()],
        shortDay: SHORT_DAYS[normalized.getDay()],
        date: normalized.getDate(),
        month: normalized.getMonth() + 1,
        year: normalized.getFullYear(),
        fullDate: formatLocalFullDate(normalized),
        isToday: normalized.getTime() === today.getTime(),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
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
      fullDate: formatLocalFullDate(normalized),
      isToday: normalized.getTime() === today.getTime(),
    };
  });
}

export function formatAcademicYearLabel(reference = new Date()): string {
  const { start, end } = getAcademicYearBounds(reference);
  return `${start.getFullYear()}–${String(end.getFullYear()).slice(2)}`;
}

export function getWeekDaysForDate(allDays: TimetableDay[], target: TimetableDay): TimetableDay[] {
  if (!target.fullDate) return allDays.slice(0, 6);

  const monday = getSchoolWeekStart(new Date(target.fullDate));
  const weekTimes = Array.from({ length: 6 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return startOfDay(current).getTime();
  });

  return allDays.filter(
    (day) => day.fullDate && weekTimes.includes(startOfDay(new Date(day.fullDate)).getTime()),
  );
}

export function getMonthDaysForDate(allDays: TimetableDay[], target: TimetableDay): TimetableDay[] {
  return allDays.filter((day) => day.month === target.month && day.year === target.year);
}

export function formatDayStripLabel(day: Pick<TimetableDay, 'day' | 'shortDay' | 'date' | 'month' | 'year' | 'fullDate' | 'isToday'>): string {
  if (day.isToday) return 'Today';
  if (day.fullDate) {
    const parsed = new Date(day.fullDate);
    if (parsed.getDate() === 1) {
      return parsed.toLocaleDateString('en-US', { month: 'short' });
    }
  }
  return day.shortDay ?? day.day.slice(0, 3);
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

export function formatTime12(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatScheduleTimeRange(startTime: string, endTime: string): string {
  return `${formatTime12(startTime)} - ${formatTime12(endTime)}`;
}

export function formatScheduleMonthYear(day: Pick<TimetableDay, 'fullDate' | 'month' | 'year'>): string {
  if (day.month && day.year) {
    return new Date(day.year, day.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  if (day.fullDate && /^\d{4}-\d{2}-\d{2}$/.test(day.fullDate)) {
    const [year, month] = day.fullDate.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getSlotCategory(slot: Pick<TimetableSlot, 'isBreak' | 'subject'>): 'class' | 'others' | 'break' {
  if (slot.isBreak) return 'break';
  const subject = slot.subject.toLowerCase();
  if (subject.includes('project') || subject.includes('seminar') || subject.includes('activity')) {
    return 'others';
  }
  return 'class';
}

export function getSlotTabMeta(category: ReturnType<typeof getSlotCategory>): { color: string; label: string } {
  if (category === 'break') return { color: '#64748b', label: 'Break' };
  if (category === 'others') return { color: '#f59e0b', label: 'Others' };
  return { color: '#2563eb', label: 'Class' };
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function getDayStart(day: Pick<TimetableDay, 'fullDate' | 'date' | 'month' | 'year'>): Date | null {
  if (day.date != null && day.month != null && day.year != null) {
    return startOfDay(new Date(day.year, day.month - 1, day.date));
  }
  if (day.fullDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(day.fullDate)) {
      const [year, month, date] = day.fullDate.split('-').map(Number);
      return startOfDay(new Date(year, month - 1, date));
    }
    const parsed = new Date(day.fullDate);
    if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
  }
  return null;
}

export function getTimetableDayDate(day: Pick<TimetableDay, 'fullDate' | 'date' | 'month' | 'year'>): Date | null {
  return getDayStart(day);
}

export function getTimetableDayKey(day: Pick<TimetableDay, 'fullDate' | 'date' | 'month' | 'year'>): string | null {
  const date = getDayStart(day);
  if (!date) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function findTimetableDayIndex(days: TimetableDay[], target: Date): number {
  if (days.length === 0) return 0;

  const targetTime = startOfDay(target).getTime();
  const exactIndex = days.findIndex((day) => {
    const dayDate = getDayStart(day);
    return dayDate != null && dayDate.getTime() === targetTime;
  });
  if (exactIndex >= 0) return exactIndex;

  let bestIndex = 0;
  let bestDiff = Infinity;
  days.forEach((day, index) => {
    const dayDate = getDayStart(day);
    if (!dayDate) return;
    const diff = Math.abs(dayDate.getTime() - targetTime);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });
  return bestIndex;
}

export function dateToTimetableDayKey(date: Date): string {
  const normalized = startOfDay(date);
  return `${normalized.getFullYear()}-${normalized.getMonth()}-${normalized.getDate()}`;
}

function getDayRelation(
  day: Pick<TimetableDay, 'fullDate' | 'date' | 'month' | 'year' | 'isToday'>,
  now = new Date(),
): 'past' | 'today' | 'future' {
  const dayStart = getDayStart(day);
  if (!dayStart) return day.isToday ? 'today' : 'future';

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart < todayStart) return 'past';
  if (dayStart > todayStart) return 'future';
  return 'today';
}

export function isScheduleSlotComplete(
  slot: Pick<TimetableSlot, 'endTime'>,
  day: Pick<TimetableDay, 'fullDate' | 'date' | 'month' | 'year' | 'isToday'>,
  now = new Date(),
): boolean {
  const relation = getDayRelation(day, now);
  if (relation === 'past') return true;
  if (relation === 'future') return false;
  return parseTimeToMinutes(slot.endTime) <= now.getHours() * 60 + now.getMinutes();
}

const SCHEDULE_WINDOW_SIZE = 5;
const SCHEDULE_CENTER_OFFSET = Math.floor(SCHEDULE_WINDOW_SIZE / 2);

export function getScheduleWindow(days: TimetableDay[], centerIndex: number, windowSize = SCHEDULE_WINDOW_SIZE) {
  if (days.length === 0) return { start: 0, items: [] as { day: TimetableDay; globalIndex: number; isCenter: boolean }[] };

  const safeCenter = Math.min(Math.max(centerIndex, 0), days.length - 1);
  let start = safeCenter - SCHEDULE_CENTER_OFFSET;
  if (start < 0) start = 0;
  if (start + windowSize > days.length) start = Math.max(0, days.length - windowSize);

  const items = days.slice(start, start + windowSize).map((day, offset) => ({
    day,
    globalIndex: start + offset,
    isCenter: start + offset === safeCenter,
  }));

  return { start, items };
}

export function clampScheduleCenter(centerIndex: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.min(Math.max(centerIndex, 0), totalDays - 1);
}
