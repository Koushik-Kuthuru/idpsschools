import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { setSecureItem, getSecureItem, deleteSecureItem } from '@/utils/storage';
import { portalGet, portalPost, getSelectedAcademicYear } from './portalClient';
import { clearMessageCache } from './messages';
import { STORAGE_KEYS, API_BASE_URL } from '@/constants/config';
import type {
  AnnouncementDetail,
  Assignment,
  AttendanceRecord,
  AttendanceSummary,
  DashboardData,
  Exam,
  FeesOverview,
  LoginResponse,
  MarksOverview,
  NotificationItem,
  PaymentMethod,
  PaymentRecord,
  SubjectAttendance,
  SubjectMark,
  TimetableDay,
  User,
  CourseDetail,
  AcademicCalendarEvent,
} from '@/types';

import { portalLogin } from './portalAuth';
import { isTransportAssigned } from '@/utils/transport';

function pickAcademicYear(
  ...sources: Array<Partial<User> & { academicYearName?: string } | null | undefined>
): string | undefined {
  for (const source of sources) {
    const year = String(source?.academicYear ?? source?.academicYearName ?? '').trim();
    if (year) return year;
  }
  return undefined;
}

function mergePortalProfile(stored: User | null | undefined, apiProfile: Partial<User> | undefined): User {
  const merged = { ...(stored ?? {}), ...(apiProfile ?? {}) } as User;
  const fromApi = pickAcademicYear(apiProfile);
  if (fromApi) {
    // Live API year always wins over AsyncStorage (avoids stuck 2026-27).
    merged.academicYear = fromApi;
  } else if (apiProfile) {
    delete merged.academicYear;
  }
  if (!isTransportAssigned(apiProfile?.transport)) {
    delete merged.transport;
  }
  return merged;
}

const EMPTY_MARKS: MarksOverview = {
  gpa: 0,
  grade: '—',
  rank: '—',
  totalPercent: 0,
  subjects: [],
  lastUpdated: '',
  teacherInCharge: '',
  exams: [],
  terms: {
    term1: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    term2: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    term3: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
    annual: { gpa: 0, grade: '—', rank: '—', totalPercent: 0, subjects: [] },
  },
};

async function portalFetchAuthed<T>(path: string, accessToken: string): Promise<T> {
  const base = API_BASE_URL.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String((data as { error?: string }).error ?? 'Request failed'));
  }
  return data as T;
}

async function enrichUserFromPortal(user: User, schoolId: string, accessToken: string): Promise<User> {
  try {
    const { profile } = await portalFetchAuthed<{ profile: User }>(
      `/api/portal/student/profile?schoolId=${encodeURIComponent(schoolId)}`,
      accessToken,
    );
    return mergePortalProfile(user, profile);
  } catch {
    return user;
  }
}

export const authService = {
  login: async (studentId: string, password: string, schoolId?: string): Promise<LoginResponse> => {
    const session = await portalLogin(studentId, password, {
      prefer: 'student',
      schoolId: schoolId ?? undefined,
    });
    const resolvedSchoolId = session.schoolId ?? schoolId ?? null;
    let user: User = {
      id: session.user?.id ?? studentId,
      name: session.displayName ?? studentId,
      email: session.user?.email ?? '',
      studentId,
      grade: '',
      rollNumber: '',
      className: '',
      schoolName: resolvedSchoolId ?? '',
    };

    if (resolvedSchoolId && session.access_token) {
      try {
        const me = await portalFetchAuthed<{
          user?: {
            displayName?: string;
            grade?: string;
            section?: string;
            className?: string;
            rollNumber?: string;
            academicYearName?: string;
            academicYear?: string;
          };
          schoolId?: string;
        }>('/api/portal/me', session.access_token);
        const enrollment = me.user;
        if (enrollment) {
          const academicYear = pickAcademicYear(enrollment);
          user = {
            ...user,
            name: enrollment.displayName ?? user.name,
            grade: enrollment.grade ?? user.grade,
            rollNumber: enrollment.rollNumber ?? user.rollNumber,
            className: enrollment.className ?? user.className,
            studentId: enrollment.rollNumber || user.studentId,
            ...(academicYear ? { academicYear } : {}),
          };
        }
      } catch {
        // /me is optional; full profile is loaded below.
      }
      user = await enrichUserFromPortal(user, resolvedSchoolId, session.access_token);
    }

    if (user.rollNumber && user.rollNumber !== user.studentId) {
      user = { ...user, studentId: user.rollNumber };
    }

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      schoolId: resolvedSchoolId,
      user,
    } as LoginResponse;
  },
  verifyOtp: async (otp: string) => {
    const { data } = await apiClient.post('/auth/verify-otp', { otp });
    return data;
  },
  resetPassword: async (password: string) => {
    const { data } = await apiClient.post('/auth/reset-password', { password });
    return data;
  },
  forgotPassword: async (payload: { email?: string; phone?: string }) => {
    const { data } = await apiClient.post('/auth/forgot-password', payload);
    return data;
  },
  resendOtp: async (payload: { email?: string; phone?: string }) => {
    const { data } = await apiClient.post('/auth/resend-otp', payload);
    return data;
  },
  saveSession: async (tokens: { accessToken: string; refreshToken: string }, user: User, schoolId?: string | null) => {
    await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.SCHOOL_ID, schoolId?.trim() || 'idpscherukupalli');
  },
  clearSession: async () => {
    await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    await clearMessageCache();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHOOL_ID);
    // SELECTED_BRANCH is intentionally kept so logout returns to the same branch login.
  },
  getStoredUser: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  getStoredSchoolId: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.SCHOOL_ID);
  },
  hasSession: async () => {
    const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },
};

export const dashboardService = {
  get: async (): Promise<DashboardData> => {
    const { dashboard } = await portalGet<{ dashboard?: DashboardData }>('/api/portal/student/dashboard');
    return (
      dashboard ?? {
        studentName: 'Student',
        schoolName: '',
        attendancePercent: 0,
        attendanceStatus: '',
        classesToday: 0,
        nextClass: '',
        gpa: 0,
        feesDue: 0,
        notificationCount: 0,
        announcements: [],
      }
    );
  },
};

export const attendanceService = {
  getSummary: async (): Promise<AttendanceSummary> => {
    const data = await portalGet<{ summary?: AttendanceSummary }>('/api/portal/student/attendance');
    return (
      data.summary ?? {
        overallPercent: 0,
        target: 85,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        className: '',
        month: new Date().toLocaleString('en-US', { month: 'long' }),
      }
    );
  },
  getSubjects: async (): Promise<SubjectAttendance[]> => {
    const data = await portalGet<{ subjects?: SubjectAttendance[] }>('/api/portal/student/attendance');
    return data.subjects ?? [];
  },
  getRecords: async (): Promise<AttendanceRecord[]> => {
    const data = await portalGet<{ records?: AttendanceRecord[] }>('/api/portal/student/attendance');
    return data.records ?? [];
  },
};

export const marksService = {
  getOverview: async (): Promise<MarksOverview> => {
    const data = await portalGet<{ overview: MarksOverview }>('/api/portal/student/marks');
    return data.overview ?? EMPTY_MARKS;
  },
  getSubject: async (id: string): Promise<SubjectMark | undefined> => {
    const data = await portalGet<{ subject?: SubjectMark }>('/api/portal/student/marks', { subjectId: id });
    return data.subject;
  },
  getPerformance: async () => {
    const data = await portalGet<{ overview: MarksOverview }>('/api/portal/student/marks');
    const subjects = data.overview?.subjects ?? [];
    return {
      labels: subjects.map((row) => row.subject),
      barData: subjects.map((row) => row.score),
      lineData: subjects.map((row) =>
        row.maxScore > 0 ? Math.round((row.score / row.maxScore) * 100) : 0
      ),
    };
  },
};

export const assignmentsService = {
  getAll: async (): Promise<Assignment[]> => {
    const data = await portalGet<{ assignments?: Assignment[] }>('/api/portal/student/content', {
      kind: 'assignments',
    });
    return data.assignments ?? [];
  },
  getById: async (id: string): Promise<Assignment | undefined> => {
    const all = await assignmentsService.getAll();
    return all.find((a) => a.id === id);
  },
  upload: async (assignmentId: string, fileUri: string, fileName: string) => {
    const formData = new FormData();
    formData.append('file', { uri: fileUri, name: fileName, type: 'application/octet-stream' } as unknown as Blob);
    const { data } = await apiClient.post(`/assignments/upload/${assignmentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const examsService = {
  getAll: async (): Promise<Exam[]> => {
    const data = await portalGet<{ exams?: Exam[] }>('/api/portal/student/content', { kind: 'exams' });
    return data.exams ?? [];
  },
};

export type StudentSubjectRow = {
  id: string;
  subject: string;
  teacher: string;
  description?: string;
  weeklyPeriods?: number;
};

export const subjectsService = {
  getAll: async (): Promise<StudentSubjectRow[]> => {
    const data = await portalGet<{ subjects?: Array<Record<string, unknown>> }>(
      '/api/portal/student/content',
      { kind: 'subjects' },
    );
    return (data.subjects ?? [])
      .map((row) => {
        const subject = String(row.subject ?? row.name ?? '').trim();
        if (!subject) return null;
        return {
          id: String(row.id ?? subject.toLowerCase().replace(/\s+/g, '-')),
          subject,
          teacher: String(row.teacher ?? '').trim(),
          description: row.description ? String(row.description) : undefined,
          weeklyPeriods: Number(row.weeklyPeriods ?? 0) || 0,
        };
      })
      .filter((row): row is StudentSubjectRow => Boolean(row));
  },
};

export const timetableService = {
  get: async (): Promise<TimetableDay[]> => {
    const data = await portalGet<{ timetable?: Array<{ day?: string; slots?: Array<Record<string, unknown>> }> }>(
      '/api/portal/student/content',
      { kind: 'timetable' },
    );

    return (data.timetable ?? []).map((dayRow) => {
      const dayName = String(dayRow.day ?? 'Day');
      return {
        day: dayName,
        shortDay: dayName.slice(0, 3),
        slots: (dayRow.slots ?? []).map((raw, index) => {
          const time = String(raw.time ?? '');
          const [startTime = '', endTime = ''] = time.split(' - ').map((part) => part.trim());
          const subject = String(raw.subject ?? '');
          return {
            id: String(raw.id ?? `${dayName}-${index}`),
            subject,
            teacher: String(raw.teacher ?? ''),
            startTime,
            endTime,
            room: String(raw.room ?? ''),
            color: String(raw.accentColor ?? '#144835'),
            isBreak: subject.toLowerCase().includes('break'),
          };
        }),
      };
    });
  },
};

export const courseService = {
  getById: async (courseId: string, subjectHint?: string): Promise<CourseDetail> => {
    const subjectName = (subjectHint ?? courseId).trim();
    let teacher = '';
    try {
      const timetable = await timetableService.get();
      for (const day of timetable) {
        for (const slot of day.slots ?? []) {
          const slotSubject = String(slot.subject ?? '').trim();
          if (!slotSubject) continue;
          if (
            slotSubject.toLowerCase() === subjectName.toLowerCase() ||
            slotSubject.toLowerCase().includes(subjectName.toLowerCase()) ||
            subjectName.toLowerCase().includes(slotSubject.toLowerCase())
          ) {
            teacher = String(slot.teacher ?? '').trim() || teacher;
          }
        }
      }
    } catch {
      // Timetable optional for course detail.
    }

    let yourAttendancePercent = 0;
    try {
      const summary = await attendanceService.getSummary();
      yourAttendancePercent = Math.min(100, Math.max(0, Math.round(Number(summary.overallPercent) || 0)));
    } catch {
      yourAttendancePercent = 0;
    }

    return {
      id: courseId,
      code: courseId,
      subject: subjectName || courseId,
      teacher,
      yourAttendancePercent,
      classAveragePercent: 0,
      syllabus: [],
      resources: [],
      timeline: [],
    };
  },
};

function normalizeFeesOverview(raw: Record<string, unknown>): FeesOverview {
  const structure = Array.isArray(raw.structure)
    ? (raw.structure as FeesOverview['structure'])
    : Array.isArray(raw.items)
      ? (raw.items as Array<Record<string, unknown>>).map((item, index) => ({
          label: String(item.label ?? item.name ?? `Fee ${index + 1}`),
          amount: Number(item.amount) || 0,
        }))
      : [];

  const recentPayments = Array.isArray(raw.recentPayments)
    ? (raw.recentPayments as PaymentRecord[])
    : Array.isArray(raw.receipts)
      ? (raw.receipts as Array<Record<string, unknown>>).map((item, index) => ({
          id: String(item.id ?? `receipt-${index}`),
          period: String(item.period ?? item.month ?? item.particular ?? 'Fee payment'),
          paidOn: String(item.paidOn ?? item.date ?? item.dateDisplay ?? '—'),
          amount: Number(item.amount) || 0,
          status: 'success' as const,
          transactionId: item.transactionId ? String(item.transactionId) : undefined,
          receiptNumber: item.receiptNumber ? String(item.receiptNumber) : undefined,
          method: item.method ? String(item.method) : undefined,
          dateTime: item.dateTime ? String(item.dateTime) : undefined,
        }))
      : [];

  const totalFees = Number(raw.totalFees ?? raw.totalAmount ?? 0) || 0;
  const paidAmount = Number(raw.paidAmount ?? 0) || 0;
  const dueAmount =
    Number(raw.dueAmount ?? 0) || Math.max(totalFees - paidAmount, 0);

  return {
    totalFees,
    paidAmount,
    dueAmount,
    dueDate: String(raw.dueDate ?? raw.lastPaymentDate ?? 'Contact school'),
    structure,
    recentPayments,
  };
}

export type RazorpayOrderResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  amountInr: number;
  currency: string;
  checkoutUrl: string;
  checkoutToken: string;
  dueAmount: number;
};

export const feesService = {
  getOverview: async (): Promise<FeesOverview> => {
    const data = await portalGet<Record<string, unknown>>('/api/portal/student/fees');
    return normalizeFeesOverview(data);
  },
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    return [
      { id: 'razorpay', name: 'Razorpay', icon: 'account-balance-wallet', description: 'UPI, cards, net banking' },
      { id: 'upi', name: 'UPI', icon: 'account-balance-wallet', description: 'Google Pay, PhonePe, Paytm' },
      { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card', description: 'Visa, Mastercard, RuPay' },
      { id: 'netbanking', name: 'Net Banking', icon: 'account-balance', description: 'All major banks' },
    ];
  },
  createRazorpayOrder: async (amount?: number): Promise<RazorpayOrderResponse> => {
    return portalPost<RazorpayOrderResponse>('/api/portal/student/payments/create-order', {
      amount,
    });
  },
  makePayment: async (amount: number, _method = 'razorpay') => {
    const Linking = await import('expo-linking');
    const WebBrowser = await import('expo-web-browser');
    const order = await feesService.createRazorpayOrder(amount);
    const redirect = Linking.createURL('pay-callback');
    const sep = order.checkoutUrl.includes('?') ? '&' : '?';
    const checkoutUrl = `${order.checkoutUrl}${sep}redirect=${encodeURIComponent(redirect)}`;
    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirect);
    if (result.type !== 'success' || !('url' in result) || !result.url) {
      throw new Error('Payment cancelled');
    }
    const returned = Linking.parse(result.url);
    const status = String(returned.queryParams?.status ?? '');
    if (status !== 'success') {
      throw new Error(String(returned.queryParams?.error ?? 'Payment failed'));
    }
    return {
      ok: true,
      receiptNo: String(returned.queryParams?.receiptNo ?? ''),
      paymentId: String(returned.queryParams?.paymentId ?? ''),
      orderId: order.orderId,
      amountInr: order.amountInr,
    };
  },
};

async function getReadNotificationIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_READ);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function persistReadNotificationId(id: string): Promise<void> {
  const readIds = await getReadNotificationIds();
  readIds.add(id);
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_READ, JSON.stringify([...readIds]));
}

async function withReadState(notifications: NotificationItem[]): Promise<NotificationItem[]> {
  const readIds = await getReadNotificationIds();
  return notifications.map((n) => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));
}

export const notificationsService = {
  getAll: async (): Promise<NotificationItem[]> => {
    const data = await portalGet<{ notifications?: NotificationItem[] }>('/api/portal/student/content');
    return withReadState(data.notifications ?? []);
  },
  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    await persistReadNotificationId(id);
    return { success: true };
  },
};

export const profileService = {
  get: async (): Promise<User> => {
    const stored = await authService.getStoredUser();
    try {
      const [data, me, selectedYear] = await Promise.all([
        portalGet<{ profile?: User }>('/api/portal/student/profile'),
        portalGet<{ user?: { academicYearName?: string; academicYear?: string } }>('/api/portal/me').catch(
          () => ({ user: undefined }),
        ),
        getSelectedAcademicYear(),
      ]);
      let merged = mergePortalProfile(stored, data.profile);
      const liveYear = pickAcademicYear(data.profile, me.user);
      if (selectedYear) {
        // Settings override drives display + data scope.
        merged = { ...merged, academicYear: selectedYear };
      } else if (liveYear) {
        merged = { ...merged, academicYear: liveYear };
      } else {
        delete merged.academicYear;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
      return merged;
    } catch {
      if (stored) {
        const cleaned = { ...stored };
        if (!isTransportAssigned(cleaned.transport)) delete cleaned.transport;
        const selectedYear = await getSelectedAcademicYear();
        if (selectedYear) cleaned.academicYear = selectedYear;
        return cleaned;
      }
      throw new Error('Failed to load profile');
    }
  },
  updateAvatar: async (uri: string) => {
    const stored = await authService.getStoredUser();
    const updated = { ...(stored as User), avatar: uri };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  },
};

export type AcademicYearOption = {
  name: string;
  isCurrent: boolean;
};

export const academicYearsService = {
  list: async (): Promise<{ years: AcademicYearOption[]; current: string | null }> => {
    const data = await portalGet<{ years?: AcademicYearOption[]; current?: string | null }>(
      '/api/portal/student/academic-years',
    );
    return {
      years: data.years ?? [],
      current: data.current ?? null,
    };
  },
};

export const announcementsService = {
  getAll: async (): Promise<AnnouncementDetail[]> => {
    const data = await portalGet<{ announcements?: AnnouncementDetail[] }>('/api/portal/student/content', {
      kind: 'announcements',
    });
    return data.announcements ?? [];
  },
};

export const calendarService = {
  getAll: async (): Promise<AcademicCalendarEvent[]> => {
    const data = await portalGet<{ events?: AcademicCalendarEvent[] }>('/api/portal/student/content', {
      kind: 'calendar',
    });
    return data.events ?? [];
  },
};
