import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_API_DELAY, MOCK_CREDENTIALS, STORAGE_KEYS } from '@/constants/config';
import type {
  Announcement,
  AnnouncementDetail,
  Assignment,
  AttendanceRecord,
  AttendanceSummary,
  AuthTokens,
  DashboardData,
  Exam,
  FeesOverview,
  LoginResponse,
  MarksOverview,
  NotificationItem,
  PaymentMethod,
  SubjectAttendance,
  SubjectMark,
  TimetableDay,
  User,
  WorkItemType,
  CourseDetail,
} from '@/types';
import { formatDueDate } from '@/utils/workItems';
import { buildAcademicYearSchoolDays } from '@/utils/timetable';
import { getMockCourseDetail } from '@/utils/courses';
import { getMergedFeesOverview } from './feesState';

const delay = (ms = MOCK_API_DELAY) => new Promise((r) => setTimeout(r, ms));

function buildDueDate(daysFromToday: number): { dueAt: string; dueDate: string } {
  const due = new Date();
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + daysFromToday);
  due.setHours(23, 59, 59, 999);
  return { dueAt: due.toISOString(), dueDate: formatDueDate(due.toISOString()) };
}

function buildWorkItem(
  id: string,
  title: string,
  subject: string,
  type: WorkItemType,
  teacher: string,
  daysFromToday: number,
  status: Assignment['status'],
  description: string,
): Assignment {
  const { dueAt, dueDate } = buildDueDate(daysFromToday);
  return {
    id,
    title,
    subject,
    className: '10-A',
    type,
    description,
    dueDate,
    dueAt,
    teacher,
    status,
  };
}

const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.j@school.edu',
  studentId: '2024-001',
  grade: '10',
  rollNumber: '001',
  className: '10-A',
  schoolName: 'International Delhi Public School',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5LqQwITXuAYIuFaKg7yXpiIfTBObJYBvavDVW4k-r9LEK_jzacT6w6Jss23PrvU4Bewsigkluj9Nj5pLH5aoqmH0DTuo72hP1lV3_ewFZec3-DFTFsD2y7CfP7mpVanloP9BLHij3SGDU1PBfS4YAkCVA_nq0hXg-YnA76gK4Jmxpx7nthTXt2LpTVjMynIUwTVTr7wKbsR63k9M6yrt8rggiWpmCegV8XdBBNTcxBYeFtqoePowjGzWOXBPOwIUmwHqUv-EJK-4g',
  phone: '+91 98765-43210',
  address: 'Apartment 42, Green Valley Towers, New Delhi',
  gender: 'Male',
  dob: '15 May 2008',
  bloodGroup: 'O+',
  parentName: 'Robert Johnson',
  parentPhone: '+91 98765-43211',
  transport: {
    routeNo: 'R-12',
    pickupPoint: 'Green Valley Towers Gate 2, Sector 45, New Delhi',
    vehicleNo: 'DL-01-AB-4521',
    inchargeNumber: '+91 98765-43220',
    driverName: 'Mr. Suresh Patel',
    driverNumber: '+91 98765-43221',
    destinationAddress: 'International Delhi Public School, Kalaburagi',
    captainName: 'Mr. Ramesh Kumar',
    trackingLink: 'https://track.idps.edu/bus/R-12',
  },
  hostel: {
    block: 'Dome Block',
    roomNo: '204',
    bedNo: 'B2',
    wardenName: 'Mrs. Anitha Reddy',
    wardenPhone: '+91 98765-43230',
    messTimings: 'Breakfast 7:30 AM · Lunch 1:00 PM · Dinner 7:30 PM',
  },
};

const tokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const mockApi = {
  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      await delay();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const validEmail =
        normalizedEmail === MOCK_CREDENTIALS.email.toLowerCase() ||
        normalizedEmail === 'alex.j@school.edu';
      if (validEmail && normalizedPassword === MOCK_CREDENTIALS.password) {
        return { ...tokens, user: mockUser };
      }
      throw new Error('Invalid credentials');
    },
    verifyOtp: async (otp: string): Promise<{ success: boolean }> => {
      await delay();
      if (otp === MOCK_CREDENTIALS.otp) return { success: true };
      throw new Error('Invalid OTP');
    },
    resetPassword: async (): Promise<{ success: boolean }> => {
      await delay();
      return { success: true };
    },
    forgotPassword: async (_payload?: { email?: string; phone?: string }): Promise<{ success: boolean }> => {
      await delay();
      return { success: true };
    },
  },
  dashboard: async (): Promise<DashboardData> => {
    await delay();
    const fees = await getMergedFeesOverview();
    return {
      studentName: mockUser.name,
      schoolName: mockUser.schoolName,
      attendancePercent: 92,
      attendanceStatus: 'Present Today',
      classesToday: 2,
      nextClass: 'Math (9:00 AM) - Room 102',
      gpa: 3.8,
      feesDue: fees.dueAmount,
      notificationCount: 3,
      announcements: [
        {
          id: '1',
          title: 'Final exams schedule released!',
          description: 'Please check your email for the detailed PDF or visit the library notice board.',
          timeAgo: '2 hours ago',
          isNew: true,
        },
        {
          id: '2',
          title: 'Holiday: Republic Day',
          description: 'The campus will remain closed on Jan 26th in observance of Republic Day.',
          timeAgo: 'Yesterday',
          isNew: false,
        },
      ],
    };
  },
  attendance: {
    summary: async (): Promise<AttendanceSummary> => {
      await delay();
      return {
        overallPercent: 92.5,
        target: 85,
        present: 18,
        absent: 2,
        late: 1,
        leave: 1,
        month: 'January',
        className: '10-A',
      };
    },
    subjects: async (): Promise<SubjectAttendance[]> => {
      await delay();
      return [
        { id: '1', subject: 'English', percent: 95 },
        { id: '2', subject: 'Math', percent: 90 },
        { id: '3', subject: 'Science', percent: 88 },
        { id: '4', subject: 'History', percent: 92 },
        { id: '5', subject: 'PE', percent: 100 },
      ];
    },
    records: async (): Promise<AttendanceRecord[]> => {
      await delay();
      return buildAttendanceRecords();
    },
  },
  marks: {
    overview: async (): Promise<MarksOverview> => {
      await delay();
      return buildMarksOverview();
    },
    subject: async (id: string): Promise<SubjectMark | undefined> => {
      await delay();
      return mockSubjects.find((s) => s.id === id);
    },
    performance: async () => {
      await delay();
      return {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
        barData: [78, 82, 85, 88, 91],
        lineData: [75, 80, 83, 87, 91],
      };
    },
  },
  assignments: async (): Promise<Assignment[]> => {
    await delay();
    return [
      buildWorkItem('1', 'Algebra Problem Set', 'Math', 'homework', 'Mr. Smith', 0, 'pending', 'Complete exercises 1-20 from Chapter 5. Show all working steps.'),
      buildWorkItem('2', 'Science Lab Report', 'Science', 'assignment', 'Dr. Patel', 0, 'pending', 'Write a detailed report on the photosynthesis experiment conducted in lab.'),
      buildWorkItem('3', 'Unit Test Revision', 'Math', 'assessment', 'Mr. Smith', 0, 'submitted', 'Review chapters 4-6 for tomorrow\'s assessment.'),
      buildWorkItem('4', 'Group History Project', 'History', 'project', 'Mrs. Emma', 1, 'pending', 'Collaborative presentation on the Indian independence movement.'),
      buildWorkItem('5', 'Reading Log Task', 'English', 'task', 'Mrs. Sarah', 2, 'pending', 'Submit weekly reading log with reflections.'),
      buildWorkItem('6', 'Grammar Classwork', 'English', 'classwork', 'Mrs. Sarah', 0, 'pending', 'Complete in-class grammar exercises from today\'s lesson.'),
      buildWorkItem('7', 'Essay on Shakespeare', 'English', 'assignment', 'Mrs. Sarah', -3, 'overdue', 'Write a 1000-word essay analyzing themes in Hamlet Act 3.'),
      buildWorkItem('8', 'Ch 5 Exercise: Calculus', 'Math', 'homework', 'Mr. John', -2, 'overdue', 'Complete calculus exercises from Chapter 5.'),
      buildWorkItem('9', 'History Book Report', 'History', 'assignment', 'Mrs. Emma', -5, 'submitted', 'Book report on assigned history reading.'),
    ];
  },
  exams: async (): Promise<Exam[]> => {
    await delay();
    return [
      { id: '1', subject: 'Mathematics', date: 'Feb 10, 2026', time: '9:00 AM - 12:00 PM', hallNumber: 'Hall A' },
      { id: '2', subject: 'Science', date: 'Feb 12, 2026', time: '9:00 AM - 12:00 PM', hallNumber: 'Hall B' },
      { id: '3', subject: 'English', date: 'Feb 14, 2026', time: '9:00 AM - 12:00 PM', hallNumber: 'Hall A' },
      { id: '4', subject: 'History', date: 'Feb 16, 2026', time: '2:00 PM - 5:00 PM', hallNumber: 'Hall C' },
    ];
  },
  timetable: async (): Promise<TimetableDay[]> => {
    await delay();
    const yearDays = buildAcademicYearSchoolDays();
    const todaySlots = [
      { id: 'w1', subject: 'Environmental Impact Assessment', color: '#2563eb', teacher: 'Dr. Rao', room: '201', startTime: '09:20', endTime: '10:10' },
      { id: 'w2', subject: 'Human Computer Interaction', color: '#2563eb', teacher: 'Ms. Priya', room: '305', startTime: '10:10', endTime: '11:00' },
      { id: 'w2b', subject: 'Short Break', color: '#64748b', teacher: '', room: '', startTime: '11:00', endTime: '11:50', isBreak: true },
      { id: 'w3', subject: 'Organizational Behaviour', color: '#2563eb', teacher: 'Mr. Kumar', room: '102', startTime: '11:50', endTime: '12:40' },
      { id: 'w3b', subject: 'Lunch Break', color: '#64748b', teacher: '', room: '', startTime: '12:40', endTime: '13:20', isBreak: true },
      { id: 'w4', subject: 'Project Stage-II Including Seminar', color: '#f59e0b', teacher: 'Guide', room: 'Lab 2', startTime: '13:20', endTime: '15:50' },
    ];
    return yearDays.map((d) => ({
      ...d,
      slots: d.isToday
        ? todaySlots
        : d.day === 'Saturday'
          ? []
          : [
              { id: `${d.fullDate}-1`, subject: 'Mathematics', color: '#2563eb', teacher: 'Mr. John', room: '102', startTime: '09:00', endTime: '10:00' },
              { id: `${d.fullDate}-2`, subject: 'English Literature', color: '#2563eb', teacher: 'Ms. Sarah', room: '101', startTime: '10:00', endTime: '11:00' },
              { id: `${d.fullDate}-2b`, subject: 'Short Break', color: '#64748b', teacher: '', room: '', startTime: '11:00', endTime: '11:30', isBreak: true },
              { id: `${d.fullDate}-3`, subject: 'Science Lab', color: '#2563eb', teacher: 'Dr. Patel', room: 'Lab 1', startTime: '11:30', endTime: '12:30' },
              { id: `${d.fullDate}-3b`, subject: 'Lunch Break', color: '#64748b', teacher: '', room: '', startTime: '12:30', endTime: '13:15', isBreak: true },
              { id: `${d.fullDate}-4`, subject: 'History', color: '#2563eb', teacher: 'Mrs. Emma', room: '103', startTime: '13:15', endTime: '14:15' },
            ],
    }));
  },
  courseDetail: async (courseId: string, subjectHint?: string): Promise<CourseDetail> => {
    await delay();
    return getMockCourseDetail(courseId, subjectHint);
  },
  fees: async (): Promise<FeesOverview> => {
    await delay();
    return getMergedFeesOverview();
  },
  paymentMethods: async (): Promise<PaymentMethod[]> => {
    await delay();
    return [
      { id: 'upi', name: 'UPI', icon: 'account-balance-wallet', description: 'Google Pay, PhonePe, Paytm' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', description: 'Visa, Mastercard, RuPay' },
      { id: 'netbanking', name: 'Net Banking', icon: 'account-balance', description: 'All major banks' },
    ];
  },
  notifications: async (): Promise<NotificationItem[]> => {
    await delay();
    return [
      { id: '1', title: 'Final Exam Schedule', body: 'Exam timetable has been published.', type: 'exam', time: '2h ago', read: false },
      { id: '2', title: 'Assignment Due', body: 'Algebra Problem Set due tomorrow.', type: 'assignment', time: '5h ago', read: false },
      { id: '3', title: 'Fee Reminder', body: '₹2,650 due by Jan 20, 2026.', type: 'fee', time: '1d ago', read: true },
      { id: '4', title: 'School Notice', body: 'Republic Day holiday on Jan 26.', type: 'notice', time: '2d ago', read: true },
    ];
  },
  announcements: async (): Promise<AnnouncementDetail[]> => {
    await delay();
    return [
      {
        id: '1',
        title: 'I B.Tech Regular/Supplementary Exams — June 2026 Time Tables',
        description:
          'I B.Tech II Semester Regular/Supplementary and I B.Tech I Semester Supplementary Exams — June 2026 Time Tables are now published.',
        timeAgo: '2h ago',
        isNew: true,
        category: 'important',
        postedBy: 'IDPS ADMIN | EXAMINATION CELL',
        postedAt: 'Jun 12, 2026 10:13 AM',
        dateTime: 'Jun 12, 2026 • 10:13 AM',
        priority: 'High',
        attachments: 3,
        attachmentFiles: [
          'I B.TECH I SEMESTER R22 SUPPLEMENTARY EXAMS JUNE-2026 TIME TABLE.PDF',
          'I B.TECH II SEMESTER R22 REGULAR EXAMS JUNE-2026 TIME TABLE.PDF',
          'I B.TECH II SEMESTER R22 SUPPLEMENTARY EXAMS JUNE-2026 TIME TABLE.PDF',
        ],
        content:
          'Dear students, the final examination schedule for Term 2 is now available. Please download the attached PDF and review your exam dates, rooms, and reporting times.',
      },
      {
        id: '2',
        title: 'Republic Day Holiday',
        description: 'Campus will remain closed on Jan 26. Regular classes resume Jan 27.',
        timeAgo: '1d ago',
        isNew: false,
        category: 'holiday',
        postedBy: 'IDPS ADMIN | GENERAL NOTICES',
        postedAt: 'Jan 8, 2026 9:00 AM',
        dateTime: 'Jan 26, 2026',
        priority: 'Closed',
        content: 'The school will remain closed on Republic Day. Regular classes resume Jan 27.',
      },
      {
        id: '3',
        title: 'Annual Sports Day Registration',
        description: 'Register by Jan 20 for track, field, and team events.',
        timeAgo: '3d ago',
        isNew: false,
        category: 'events',
        postedBy: 'IDPS ADMIN | SPORTS DEPARTMENT',
        postedAt: 'Jan 5, 2026 8:00 AM',
        dateTime: 'Feb 2, 2026 • 8:00 AM',
        attachments: 1,
        attachmentFiles: ['Sports_Day_Registration_Form.pdf'],
        content: 'Join us for Annual Sports Day! Students can register for track, field, and team events through the portal.',
      },
      {
        id: '4',
        title: 'Library Hours Extended During Exams',
        description: 'Library open until 6 PM on weekdays during the exam period.',
        timeAgo: '5d ago',
        isNew: false,
        category: 'general',
        postedBy: 'IDPS ADMIN | LIBRARY',
        postedAt: 'Jan 3, 2026 11:30 AM',
        content: 'During exam week, the library will remain open until 6:00 PM on weekdays.',
      },
    ];
  },
  profile: async (): Promise<User> => {
    await delay();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      return { ...mockUser, ...JSON.parse(raw) as User };
    }
    return mockUser;
  },
};

const mockSubjects: SubjectMark[] = [
  { id: '1', subject: 'Math', score: 95, maxScore: 100, grade: 'A+', icon: 'calculate', internalMarks: 45, externalMarks: 50 },
  { id: '2', subject: 'Arts', score: 92, maxScore: 100, grade: 'A+', icon: 'palette', internalMarks: 42, externalMarks: 50 },
  { id: '3', subject: 'Science', score: 89, maxScore: 100, grade: 'A', icon: 'biotech', internalMarks: 39, externalMarks: 50 },
  { id: '4', subject: 'English', score: 88, maxScore: 100, grade: 'A', icon: 'menu-book', internalMarks: 38, externalMarks: 50 },
  { id: '5', subject: 'PE', score: 85, maxScore: 100, grade: 'A', icon: 'fitness-center', internalMarks: 35, externalMarks: 50 },
  { id: '6', subject: 'History', score: 87, maxScore: 100, grade: 'A', icon: 'history-edu', internalMarks: 37, externalMarks: 50 },
];

function scaleSubjects(factor: number): SubjectMark[] {
  return mockSubjects.map((s) => {
    const score = Math.min(100, Math.round(s.score * factor));
    const pct = score / s.maxScore;
    const grade = pct >= 0.9 ? 'A+' : pct >= 0.8 ? 'A' : pct >= 0.7 ? 'B+' : 'B';
    return { ...s, score, grade };
  });
}

function termStats(subjects: SubjectMark[]) {
  const total = subjects.reduce((a, s) => a + s.score, 0);
  const max = subjects.reduce((a, s) => a + s.maxScore, 0);
  const totalPercent = Math.round((total / max) * 100);
  const gpa = Math.round((totalPercent / 100) * 4 * 10) / 10;
  const grade = totalPercent >= 90 ? 'A' : totalPercent >= 80 ? 'B+' : 'B';
  return { gpa, grade, rank: '5/45', totalPercent, subjects };
}

function buildAttendanceRecords(): AttendanceRecord[] {
  const statuses = ['present', 'present', 'absent', 'late', 'present', 'leave'] as const;
  const subjectTargets = [
    { subject: 'English', percent: 95 },
    { subject: 'Math', percent: 90 },
    { subject: 'Science', percent: 88 },
    { subject: 'History', percent: 92 },
    { subject: 'PE', percent: 100 },
  ];
  const months = [
    { year: 2025, month: 9 },
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
  ];
  const records: AttendanceRecord[] = [];

  months.forEach(({ year, month }, monthIndex) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) continue;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      records.push({
        date: dateStr,
        status: statuses[(day + monthIndex) % statuses.length],
      });

      subjectTargets.forEach((item, subjectIndex) => {
        const seed = day * 17 + monthIndex * 13 + subjectIndex * 29 + item.subject.charCodeAt(0);
        const roll = seed % 100;
        let status: AttendanceRecord['status'] = 'present';
        if (roll >= item.percent) {
          status = roll >= item.percent + 6 ? 'absent' : roll >= item.percent + 3 ? 'leave' : 'late';
        }
        records.push({ date: dateStr, status, subject: item.subject });
      });
    }
  });

  return records.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return (a.subject ?? '').localeCompare(b.subject ?? '');
  });
}

function buildMarksOverview(): MarksOverview {
  const term1 = termStats(mockSubjects);
  const term2 = termStats(scaleSubjects(0.96));
  const term3 = termStats(scaleSubjects(0.92));
  const annual = termStats(scaleSubjects(0.98));
  return {
    ...term1,
    lastUpdated: 'Jan 15',
    teacherInCharge: 'Mrs. Sarah Williams',
    terms: { term1, term2, term3, annual },
  };
}
