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
} from '@/types';
import { formatDueDate } from '@/utils/workItems';
import { buildSchoolWeekDays } from '@/utils/timetable';
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
    inchargeNumber: '+91 98765-43220',
    driverName: 'Mr. Suresh Patel',
    driverNumber: '+91 98765-43221',
    routeNo: 'R-12',
    destinationAddress: 'Green Valley Towers, Sector 45, New Delhi',
    captainName: 'Mr. Ramesh Kumar',
    trackingLink: 'https://track.idps.edu/bus/R-12',
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
      studentName: mockUser.name.split(' ')[0],
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
      return Array.from({ length: 20 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        status: (['present', 'present', 'absent', 'late', 'present'] as const)[i % 5],
      }));
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
    const week = buildSchoolWeekDays();
    const todaySlots = [
      { id: 'w1', subject: 'English', color: '#3b82f6', teacher: 'Ms. Sarah', room: '101', startTime: '09:00', endTime: '10:00' },
      { id: 'w2', subject: 'Math', color: '#0fbd83', teacher: 'Mr. John', room: '102', startTime: '10:00', endTime: '11:00', isLive: true },
      { id: 'w3', subject: 'Lunch Break', color: '#94a3b8', teacher: '', room: 'Cafeteria', startTime: '11:00', endTime: '11:30', isBreak: true },
      { id: 'w4', subject: 'Science', color: '#8b5cf6', teacher: 'Dr. Patel', room: 'Lab 1', startTime: '11:30', endTime: '12:30' },
      { id: 'w5', subject: 'History', color: '#f59e0b', teacher: 'Mr. Brown', room: '305', startTime: '01:00', endTime: '02:00' },
    ];
    return week.map((d) => ({
      ...d,
      slots: d.isToday
        ? todaySlots
        : [
            { id: `${d.fullDate}-1`, subject: 'Math', color: '#0fbd83', teacher: 'Mr. John', room: '102', startTime: '09:00', endTime: '10:00' },
            { id: `${d.fullDate}-2`, subject: 'English', color: '#3b82f6', teacher: 'Ms. Sarah', room: '101', startTime: '10:00', endTime: '11:00' },
            { id: `${d.fullDate}-3`, subject: 'Science', color: '#8b5cf6', teacher: 'Dr. Patel', room: 'Lab 1', startTime: '11:30', endTime: '12:30' },
          ],
    }));
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
        title: 'Final Exams Schedule',
        description: 'Exam timetable has been published for all grades.',
        timeAgo: '2h ago',
        isNew: true,
        category: 'important',
        postedAt: 'Posted: 10 Jan',
        dateTime: 'Jan 10, 2025 • 9:00 AM',
        priority: 'High',
        attachments: 2,
        imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
        content: 'Dear students, the final examination schedule for Term 2 is now available. Please download the attached PDF and review your exam dates, rooms, and reporting times.',
      },
      {
        id: '2',
        title: 'Republic Day',
        description: 'Campus closed on Jan 26.',
        timeAgo: '1d ago',
        isNew: false,
        category: 'holiday',
        postedAt: 'Jan 8, 2025',
        dateTime: 'Jan 26, 2025',
        priority: 'Closed',
        content: 'The school will remain closed on Republic Day. Regular classes resume Jan 27.',
      },
      {
        id: '3',
        title: 'Annual Sports Day',
        description: 'Register by Jan 20 for events.',
        timeAgo: '3d ago',
        isNew: false,
        category: 'events',
        postedAt: 'Posted: 5 Jan',
        dateTime: 'Feb 2, 2025 • 8:00 AM',
        attachments: 1,
        content: 'Join us for Annual Sports Day! Students can register for track, field, and team events through the portal.',
      },
      {
        id: '4',
        title: 'Library Hours Extended',
        description: 'Library open until 6 PM during exams.',
        timeAgo: '5d ago',
        isNew: false,
        category: 'general',
        postedAt: 'Posted: 3 Jan',
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
