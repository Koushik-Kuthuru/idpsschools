import type { useTheme } from '@/hooks/useTheme';
import type { AttendanceRecord } from '@/types';

type Theme = ReturnType<typeof useTheme>;

export function subjectBarColor(percent: number, target: number, theme: Theme) {
  if (percent >= target) return theme.colors.primary;
  if (percent >= target - 10) return theme.colors.amber500;
  return theme.colors.red500;
}

export const ATTENDANCE_STATUS = {
  present: { color: '#144835', icon: 'checkmark-circle' as const, label: 'Present' },
  absent: { color: '#ef4444', icon: 'close-circle' as const, label: 'Absent' },
  late: { color: '#f59e0b', icon: 'alarm-outline' as const, label: 'Late' },
  leave: { color: '#64748b', icon: 'calendar-outline' as const, label: 'Leave' },
};

export function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function getAvailableMonths(records: AttendanceRecord[]) {
  const keys = [...new Set(records.map((r) => getMonthKey(r.date)))];
  return keys.sort((a, b) => b.localeCompare(a));
}

export function filterRecordsByMonth(records: AttendanceRecord[], monthKey: string) {
  return records.filter((r) => getMonthKey(r.date) === monthKey);
}

export function defaultMonthKey(records: AttendanceRecord[], preferredMonth?: string) {
  const available = getAvailableMonths(records);
  if (available.length === 0) return '';
  if (preferredMonth) {
    const match = available.find((key) => formatMonthLabel(key).startsWith(preferredMonth));
    if (match) return match;
  }
  return available[0];
}

export function filterOverallRecords(records: AttendanceRecord[]) {
  return records.filter((r) => !r.subject);
}

export function filterSubjectRecords(records: AttendanceRecord[], subjectName: string) {
  return records.filter((r) => r.subject === subjectName);
}

export function countAttendanceRecords(records: AttendanceRecord[]) {
  return records.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { present: 0, absent: 0, late: 0, leave: 0 },
  );
}

export function formatAttendanceDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return {
    day: date.getDate(),
    month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    weekday: date.toLocaleString('en-US', { weekday: 'short' }),
  };
}

export function averageSubjectPercent(subjects: { percent: number }[]) {
  if (subjects.length === 0) return 0;
  const total = subjects.reduce((sum, s) => sum + s.percent, 0);
  return Math.round((total / subjects.length) * 10) / 10;
}
