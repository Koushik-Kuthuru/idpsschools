import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_API_DELAY, STORAGE_KEYS } from '@/constants/config';
import type {
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
} from '@/types';
import { buildAcademicYearSchoolDays } from '@/utils/timetable';
import { getMockCourseDetail } from '@/utils/courses';
import { getMergedFeesOverview } from './feesState';

const delay = (ms = MOCK_API_DELAY) => new Promise((r) => setTimeout(r, ms));

const EMPTY_USER: User = {
  id: '',
  name: '',
  email: '',
  studentId: '',
  grade: '',
  rollNumber: '',
  className: '',
  schoolName: '',
};

const tokens: AuthTokens = {
  accessToken: '',
  refreshToken: '',
};

const EMPTY_MARKS_OVERVIEW: MarksOverview = {
  gpa: 0,
  grade: '—',
  rank: '—',
  totalPercent: 0,
  subjects: [],
  lastUpdated: '',
  teacherInCharge: '',
  terms: {
    term1: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    term2: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    term3: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    annual: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
  },
};

async function resolveUser(): Promise<User> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return { ...EMPTY_USER };
  try {
    return { ...EMPTY_USER, ...(JSON.parse(raw) as User) };
  } catch {
    return { ...EMPTY_USER };
  }
}

export const mockApi = {
  auth: {
    login: async (_email: string, _password: string): Promise<LoginResponse> => {
      await delay();
      throw new Error('Invalid credentials');
    },
    verifyOtp: async (_otp: string): Promise<{ success: boolean }> => {
      await delay();
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
    const user = await resolveUser();
    const fees = await getMergedFeesOverview();
    return {
      studentName: user.name,
      schoolName: user.schoolName,
      attendancePercent: 0,
      attendanceStatus: '—',
      classesToday: 0,
      nextClass: '',
      gpa: 0,
      feesDue: fees.dueAmount,
      notificationCount: 0,
      announcements: [],
    };
  },
  attendance: {
    summary: async (): Promise<AttendanceSummary> => {
      await delay();
      return {
        overallPercent: 0,
        target: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        month: '',
        className: '',
      };
    },
    subjects: async (): Promise<SubjectAttendance[]> => {
      await delay();
      return [];
    },
    records: async (): Promise<AttendanceRecord[]> => {
      await delay();
      return [];
    },
  },
  marks: {
    overview: async (): Promise<MarksOverview> => {
      await delay();
      return EMPTY_MARKS_OVERVIEW;
    },
    subject: async (_id: string): Promise<SubjectMark | undefined> => {
      await delay();
      return undefined;
    },
    performance: async () => {
      await delay();
      return { labels: [] as string[], barData: [] as number[], lineData: [] as number[] };
    },
  },
  assignments: async (): Promise<Assignment[]> => {
    await delay();
    return [];
  },
  exams: async (): Promise<Exam[]> => {
    await delay();
    return [];
  },
  calendar: async () => {
    await delay();
    return [];
  },
  timetable: async (): Promise<TimetableDay[]> => {
    await delay();
    return buildAcademicYearSchoolDays().map((d) => ({ ...d, slots: [] }));
  },
  courseDetail: async (courseId: string, subjectHint?: string) => {
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
    return [];
  },
  announcements: async (): Promise<AnnouncementDetail[]> => {
    await delay();
    return [];
  },
  profile: async (): Promise<User> => {
    await delay();
    return resolveUser();
  },
};
