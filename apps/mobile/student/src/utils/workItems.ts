import type { Assignment, WorkItemType } from '@/types';
import type { MaterialIcons } from '@expo/vector-icons';

export function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isDueToday(dueAt: string): boolean {
  const due = new Date(dueAt);
  const today = new Date();
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

export function sortWorkItemsForOverview(items: Assignment[]): Assignment[] {
  return [...items].sort((a, b) => {
    const aToday = isDueToday(a.dueAt) ? 0 : 1;
    const bToday = isDueToday(b.dueAt) ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export function groupAssignmentsBySubject(items: Assignment[]): { subject: string; items: Assignment[] }[] {
  const groups = new Map<string, Assignment[]>();
  for (const item of sortWorkItemsForOverview(items)) {
    const list = groups.get(item.subject) ?? [];
    list.push(item);
    groups.set(item.subject, list);
  }
  return Array.from(groups.entries())
    .map(([subject, subjectItems]) => ({ subject, items: subjectItems }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export function getWorkItemsSummary(items: Assignment[]) {
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'overdue').length;
  const dueToday = items.filter((i) => isDueToday(i.dueAt)).length;
  const subjects = new Set(items.map((i) => i.subject)).size;
  return { total: items.length, pending, dueToday, subjects };
}

export function getWorkItemsOverviewSubtitle(items: Assignment[]): string {
  if (items.length === 0) {
    return 'No homework or assignments assigned';
  }
  const { total, pending, dueToday, subjects } = getWorkItemsSummary(items);
  const parts = [`${total} items across ${subjects} subject${subjects === 1 ? '' : 's'}`];
  if (pending > 0) parts.push(`${pending} pending`);
  if (dueToday > 0) parts.push(`${dueToday} due today`);
  return parts.join(' • ');
}

export function getWorkItemStatusLabel(status: Assignment['status']): string {
  const labels: Record<Assignment['status'], string> = {
    pending: 'Pending',
    submitted: 'Submitted',
    overdue: 'Overdue',
  };
  return labels[status];
}

export function getWorkItemTypeLabel(type: WorkItemType): string {
  const labels: Record<WorkItemType, string> = {
    homework: 'Homework',
    assignment: 'Assignment',
    project: 'Project',
    task: 'Task',
    assessment: 'Assessment',
    classwork: 'Classwork',
  };
  return labels[type];
}

export function getWorkItemIcon(type: WorkItemType): keyof typeof MaterialIcons.glyphMap {
  const icons: Record<WorkItemType, keyof typeof MaterialIcons.glyphMap> = {
    homework: 'assignment',
    assignment: 'assignment-turned-in',
    project: 'folder-special',
    task: 'checklist',
    assessment: 'quiz',
    classwork: 'edit-note',
  };
  return icons[type];
}

export function getWorkItemOverviewSubtitle(item: Assignment): string {
  return `${item.subject} • ${item.className} • ${item.teacher} • Due: ${item.dueDate}`;
}

export function getWorkItemIconStyle(type: WorkItemType, primary: string, blue500: string, amber500: string) {
  const styles: Record<WorkItemType, { iconColor: string; iconBg: string }> = {
    homework: { iconColor: primary, iconBg: `${primary}1a` },
    assignment: { iconColor: blue500, iconBg: 'rgba(59, 130, 246, 0.1)' },
    project: { iconColor: '#8b5cf6', iconBg: 'rgba(139, 92, 246, 0.1)' },
    task: { iconColor: amber500, iconBg: 'rgba(245, 158, 11, 0.1)' },
    assessment: { iconColor: '#ef4444', iconBg: 'rgba(239, 68, 68, 0.1)' },
    classwork: { iconColor: '#06b6d4', iconBg: 'rgba(6, 182, 212, 0.1)' },
  };
  return styles[type];
}
