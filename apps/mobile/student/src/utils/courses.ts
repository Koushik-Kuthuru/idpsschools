import type { CourseDetail, CourseSyllabusChapter, CourseSyllabusTopic, CourseTopicAttachment } from '@/types';

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

function topicAttachment(
  id: string,
  title: string,
  type: CourseTopicAttachment['type'],
  fileName: string,
  size: string,
): CourseTopicAttachment {
  return { id, title, type, fileName, size };
}

function buildUnitTopics(
  unitId: string,
  count: number,
  namedTitles: string[],
): CourseSyllabusTopic[] {
  return Array.from({ length: count }, (_, index) => {
    const title = namedTitles[index] ?? `Topic ${index + 1}`;
    const hasAttachments = index < Math.min(5, count);

    return {
      id: `${unitId}-t${index + 1}`,
      title,
      attachments: hasAttachments
        ? [
            topicAttachment(`${unitId}-n${index}`, `${title} — Class notes`, 'notes', `${unitId}-topic-${index + 1}-notes.pdf`, '840 KB'),
            ...(index % 2 === 0
              ? [topicAttachment(`${unitId}-p${index}`, `${title} — Reference PDF`, 'pdf', `${unitId}-topic-${index + 1}.pdf`, '1.8 MB')]
              : []),
          ]
        : undefined,
    };
  });
}

function buildEiaLessonPlan(): CourseSyllabusChapter[] {
  return [
    {
      id: 'u1',
      unitNumber: 1,
      title: 'EIA METHODOLOGIES',
      topics: buildUnitTopics('u1', 23, [
        'Concept and evolution of EIA',
        'Screening and scoping',
        'Baseline data collection',
        'Impact identification',
        'Impact prediction',
        'Impact evaluation',
        'Checklist method',
        'Matrix method',
        'Network method',
        'Overlay method',
      ]),
    },
    {
      id: 'u2',
      unitNumber: 2,
      title: 'EIA METHODOLOGIES',
      topics: buildUnitTopics('u2', 16, [
        'Rapid and comprehensive EIA',
        'Strategic environmental assessment',
        'Risk assessment in EIA',
        'Public participation',
        'EIA report preparation',
      ]),
    },
    {
      id: 'u3',
      unitNumber: 3,
      title: 'ENVIRONMENTAL MANAGEMENT PLAN',
      topics: buildUnitTopics('u3', 8, [
        'Structure of EMP',
        'Mitigation measures',
        'Monitoring plan',
        'Institutional arrangements',
        'Budget and scheduling',
      ]),
    },
    {
      id: 'u4',
      unitNumber: 4,
      title: 'ENVIRONMENTAL LEGISLATION AND LIFE CYCLE ASSESSMENT',
      topics: buildUnitTopics('u4', 15, [
        'Environmental legislation in India',
        'EIA notification',
        'Life cycle assessment framework',
        'Inventory analysis',
        'Impact assessment in LCA',
      ]),
    },
    {
      id: 'u5',
      unitNumber: 5,
      title: 'CASE STUDIES',
      topics: buildUnitTopics('u5', 11, [
        'Municipal solid waste processing plant',
        'Sewage treatment plant',
        'Highway project',
        'Nuclear fuel complex',
        'Thermal power plant',
      ]),
    },
    {
      id: 'u999',
      unitNumber: 999,
      title: 'Custom Unit',
      topics: buildUnitTopics('u999', 52, ['Custom topic overview']),
    },
  ];
}

const COURSE_CATALOG: Record<string, Omit<CourseDetail, 'id'>> = {
  'environmental-impact-assessment': {
    code: 'CE801OE',
    subject: 'Environmental Impact Assessment',
    teacher: 'Dr. Rao',
    yourAttendancePercent: 70.59,
    classAveragePercent: 63.79,
    syllabus: buildEiaLessonPlan(),
    resources: [
      {
        id: 'r1',
        title: 'Environmental Impact Assessment: Theory and Practice',
        type: 'book',
        author: 'Canter & Canter',
        subtitle: 'Reference textbook',
      },
      {
        id: 'r2',
        title: 'EIA Notification Guidelines',
        type: 'pdf',
        subtitle: 'MoEFCC reference document',
      },
    ],
    timeline: [
      { id: 's1', date: '22 Apr, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'present', topic: 'Municipal Solid waste processing plant.' },
      { id: 's2', date: '15 Apr, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'present', topic: 'Sewage treatment plant.' },
      { id: 's3', date: '08 Apr, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'present', topic: 'Highway project.' },
      { id: 's4', date: '01 Apr, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'present', topic: 'Nuclear fuel complex.' },
      { id: 's5', date: '25 Mar, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'present' },
      { id: 's6', date: '18 Mar, 2026', timeRange: '11:00 AM - 11:50 AM', status: 'absent' },
    ],
  },
  'human-computer-interaction': {
    code: 'CS702HC',
    subject: 'Human Computer Interaction',
    teacher: 'Ms. Priya',
    yourAttendancePercent: 82.35,
    classAveragePercent: 76.4,
    syllabus: [
      {
        id: 'ch1',
        unitNumber: 1,
        title: 'HCI FUNDAMENTALS',
        topics: buildUnitTopics('hci-u1', 12, ['Usability principles', 'User-centered design', 'Interaction models']),
      },
      {
        id: 'ch2',
        unitNumber: 2,
        title: 'INTERACTION DESIGN',
        topics: buildUnitTopics('hci-u2', 10, ['Wireframing and prototyping', 'Accessibility and inclusive design']),
      },
    ],
    resources: [
      { id: 'r1', title: 'Interaction Design: Beyond Human-Computer Interaction', type: 'book', author: 'Rogers, Sharp & Preece' },
    ],
    timeline: [
      { id: 's1', date: '22 Apr, 2026', timeRange: '10:10 AM - 11:00 AM', status: 'present', topic: 'Usability heuristics evaluation.' },
      { id: 's2', date: '15 Apr, 2026', timeRange: '10:10 AM - 11:00 AM', status: 'present', topic: 'Persona and scenario building.' },
      { id: 's3', date: '08 Apr, 2026', timeRange: '10:10 AM - 11:00 AM', status: 'late', topic: 'Low-fidelity prototyping.' },
    ],
  },
};

function buildGenericCourse(id: string, subject: string): CourseDetail {
  const code = subject
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .padEnd(3, 'X')
    .concat('101');

  return {
    id,
    code,
    subject,
    teacher: 'Faculty',
    yourAttendancePercent: 88,
    classAveragePercent: 84.5,
    syllabus: [
      {
        id: 'ch1',
        unitNumber: 1,
        title: 'FUNDAMENTALS',
        topics: buildUnitTopics(`${id}-u1`, 8, ['Introduction and fundamentals', 'Core concepts']),
      },
      {
        id: 'ch2',
        unitNumber: 2,
        title: 'APPLICATIONS',
        topics: buildUnitTopics(`${id}-u2`, 6, ['Applied topics', 'Case studies and review']),
      },
    ],
    resources: [{ id: 'r1', title: `${subject} — Course Reader`, type: 'book', subtitle: 'Prescribed textbook' }],
    timeline: [
      { id: 's1', date: '22 Apr, 2026', timeRange: '9:00 AM - 10:00 AM', status: 'present', topic: 'Introduction to the unit.' },
      { id: 's2', date: '15 Apr, 2026', timeRange: '9:00 AM - 10:00 AM', status: 'present', topic: 'Discussion and examples.' },
      { id: 's3', date: '08 Apr, 2026', timeRange: '9:00 AM - 10:00 AM', status: 'present' },
    ],
  };
}

export function getMockCourseDetail(courseId: string, subjectHint?: string): CourseDetail {
  const catalog = COURSE_CATALOG[courseId];
  if (catalog) return { id: courseId, ...catalog };

  const subject = subjectHint ?? courseId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return buildGenericCourse(courseId, subject);
}
