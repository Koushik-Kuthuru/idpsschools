import type { CourseDetail, CourseSyllabusChapter } from '@/types';

export function subjectToCourseId(subject: string): string {
  return subject
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getCourseIdFromSubject(subject: string, courseId?: string): string {
  return courseId ?? subjectToCourseId(subject);
}

export function formatUnitLabel(chapter: CourseSyllabusChapter): string {
  const unitNo = chapter.unitNumber ?? 1;
  return `Unit ${unitNo}: ${chapter.title}`;
}

export function getMockCourseDetail(courseId: string, subjectHint?: string): CourseDetail {
  const subject = subjectHint ?? courseId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const code = subject
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(3, 'X');

  return {
    id: courseId,
    code,
    subject,
    teacher: '',
    yourAttendancePercent: 0,
    classAveragePercent: 0,
    syllabus: [],
    resources: [],
    timeline: [],
  };
}
