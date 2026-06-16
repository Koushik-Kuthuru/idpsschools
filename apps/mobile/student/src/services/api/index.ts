import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, fbAuth } from '@/lib/firebase';
import apiClient from './client';
import { setSecureItem, getSecureItem, deleteSecureItem } from '@/utils/storage';
import { mockApi } from './mockData';
import { applyFeesPayment } from './feesState';
import { STORAGE_KEYS } from '@/constants/config';
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
  SubjectAttendance,
  SubjectMark,
  TimetableDay,
  User,
  CourseDetail,
  AcademicCalendarEvent,
  AcademicCalendarEventType,
} from '@/types';

import { collection, doc, query, where, getDocs } from 'firebase/firestore';

const useMock = false;

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return mockApi.auth.login(email, password);
    
    const identifier = email.trim();
    const SCHOOL_BRANCHES = ['idpscherukupalli', 'idpskalaburagi'];
    
    let studentDoc: any = null;
    let foundSchoolId: string | null = null;
    
    for (const sch of SCHOOL_BRANCHES) {
      try {
        const usernames = Array.from(new Set([identifier.toLowerCase(), identifier]));
        const studentColl = collection(db, 'schools', sch, 'students');
        const q = query(
          studentColl,
          where('username', 'in', usernames),
          where('portalPassword', '==', password)
        );
        const snap = await getDocs(q);
          
        if (!snap.empty) {
          studentDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          foundSchoolId = sch;
          break;
        }
      } catch (err) {
        console.error(`Error searching student credentials in ${sch}:`, err);
      }
    }
    
    if (studentDoc && foundSchoolId) {
      return {
        accessToken: 'legacy_token',
        refreshToken: 'legacy_token',
        schoolId: foundSchoolId,
        user: {
          id: studentDoc.id,
          name: studentDoc.studentName || studentDoc.username,
          email: studentDoc.email || `${studentDoc.username}@${foundSchoolId}.student.idps`,
          role: 'student',
          avatar: studentDoc.photo || null,
        } as unknown as User
      } as any;
    }
    
    throw new Error('Invalid email or password.');
  },
  verifyOtp: async (otp: string) => {
    if (useMock) return mockApi.auth.verifyOtp(otp);
    const { data } = await apiClient.post('/auth/verify-otp', { otp });
    return data;
  },
  resetPassword: async (password: string) => {
    if (useMock) return mockApi.auth.resetPassword();
    const { data } = await apiClient.post('/auth/reset-password', { password });
    return data;
  },
  forgotPassword: async (payload: { email?: string; phone?: string }) => {
    if (useMock) return mockApi.auth.forgotPassword(payload);
    const { data } = await apiClient.post('/auth/forgot-password', payload);
    return data;
  },
  resendOtp: async (payload: { email?: string; phone?: string }) => {
    if (useMock) return mockApi.auth.forgotPassword(payload);
    const { data } = await apiClient.post('/auth/resend-otp', payload);
    return data;
  },
  saveSession: async (tokens: { accessToken: string; refreshToken: string }, user: User, schoolId?: string | null) => {
    await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (schoolId) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCHOOL_ID, schoolId);
    }
  },
  clearSession: async () => {
    await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
    await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHOOL_ID);
  },
  getStoredUser: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
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
    if (useMock) return mockApi.dashboard();
    const stored = await authService.getStoredUser();
    const dashboard = await mockApi.dashboard();
    if (stored) {
      dashboard.studentName = stored.name?.split(' ')[0] || stored.name || 'Student';
      dashboard.schoolName = stored.schoolName || dashboard.schoolName;
    }
    return dashboard;
  },
};

export const attendanceService = {
  getSummary: async (): Promise<AttendanceSummary> => {
    if (useMock) return mockApi.attendance.summary();
    try {
      const { data } = await apiClient.get<AttendanceSummary>('/attendance');
      return data;
    } catch {
      return mockApi.attendance.summary();
    }
  },
  getSubjects: async (): Promise<SubjectAttendance[]> => {
    if (useMock) return mockApi.attendance.subjects();
    try {
      const { data } = await apiClient.get<SubjectAttendance[]>('/attendance/subjects');
      return data;
    } catch {
      return mockApi.attendance.subjects();
    }
  },
  getRecords: async (): Promise<AttendanceRecord[]> => {
    if (useMock) return mockApi.attendance.records();
    try {
      const { data } = await apiClient.get<AttendanceRecord[]>('/attendance/records');
      return data;
    } catch {
      return mockApi.attendance.records();
    }
  },
};

export const marksService = {
  getOverview: async (): Promise<MarksOverview> => {
    if (useMock) return mockApi.marks.overview();
    try {
      const { data } = await apiClient.get<MarksOverview>('/marks');
      return data;
    } catch {
      return mockApi.marks.overview();
    }
  },
  getSubject: async (id: string): Promise<SubjectMark | undefined> => {
    if (useMock) return mockApi.marks.subject(id);
    try {
      const { data } = await apiClient.get<SubjectMark>(`/marks/subject/${id}`);
      return data;
    } catch {
      return mockApi.marks.subject(id);
    }
  },
  getPerformance: async () => {
    if (useMock) return mockApi.marks.performance();
    try {
      const { data } = await apiClient.get('/marks/performance');
      return data;
    } catch {
      return mockApi.marks.performance();
    }
  },
};

export const assignmentsService = {
  getAll: async (): Promise<Assignment[]> => {
    if (useMock) return mockApi.assignments();
    try {
      const { data } = await apiClient.get<Assignment[]>('/assignments');
      return data;
    } catch {
      return mockApi.assignments();
    }
  },
  getById: async (id: string): Promise<Assignment | undefined> => {
    const all = await assignmentsService.getAll();
    return all.find((a) => a.id === id);
  },
  upload: async (assignmentId: string, fileUri: string, fileName: string) => {
    if (useMock) {
      const key = `submission_${assignmentId}`;
      await AsyncStorage.setItem(key, JSON.stringify({ fileUri, fileName, submittedAt: new Date().toISOString() }));
      return { success: true };
    }
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
    if (useMock) return mockApi.exams();
    try {
      const { data } = await apiClient.get<Exam[]>('/exams');
      return data;
    } catch {
      return mockApi.exams();
    }
  },
};

export const timetableService = {
  get: async (): Promise<TimetableDay[]> => {
    if (useMock) return mockApi.timetable();
    try {
      const { data } = await apiClient.get<TimetableDay[]>('/timetable');
      return data;
    } catch {
      return mockApi.timetable();
    }
  },
};

export const courseService = {
  getById: async (courseId: string, subjectHint?: string): Promise<CourseDetail> => {
    if (useMock) return mockApi.courseDetail(courseId, subjectHint);
    try {
      const { data } = await apiClient.get<CourseDetail>(`/courses/${courseId}`);
      return data;
    } catch {
      return mockApi.courseDetail(courseId, subjectHint);
    }
  },
};

export const feesService = {
  getOverview: async (): Promise<FeesOverview> => {
    if (useMock) return mockApi.fees();
    try {
      const { data } = await apiClient.get<FeesOverview>('/fees');
      return data;
    } catch {
      return mockApi.fees();
    }
  },
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    if (useMock) return mockApi.paymentMethods();
    try {
      const { data } = await apiClient.get<PaymentMethod[]>('/payments/methods');
      return data;
    } catch {
      return mockApi.paymentMethods();
    }
  },
  makePayment: async (amount: number, method: string) => {
    if (useMock) {
      const { state, payment } = await applyFeesPayment(amount, method);
      const now = new Date();
      return {
        success: true,
        transactionId: `TXN${Date.now()}`,
        amount: payment.amount,
        method,
        date: payment.paidOn,
        dateTime: `${payment.paidOn} | ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
        receiptNumber: `RCP-${now.getFullYear()}-${String(now.getTime()).slice(-4)}`,
        feeCategory: 'Tuition & Activities',
        nextDueDate: state.dueAmount > 0 ? 'Feb 15, 2026' : 'No dues pending',
        remainingDues: state.dueAmount,
        status: 'Completed',
      };
    }
    const { data } = await apiClient.post('/payments', { amount, method });
    return data;
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
    if (useMock) return withReadState(await mockApi.notifications());
    const { data } = await apiClient.get<NotificationItem[]>('/notifications');
    return withReadState(data);
  },
  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    if (useMock) {
      await persistReadNotificationId(id);
      return { success: true };
    }
    const { data } = await apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`);
    await persistReadNotificationId(id);
    return data;
  },
};

export const profileService = {
  get: async (): Promise<User> => {
    if (useMock) return mockApi.profile();
    try {
      const stored = await authService.getStoredUser();
      if (stored) return { ...(await mockApi.profile()), ...stored };
      const { data } = await apiClient.get<User>('/profile');
      return data;
    } catch {
      return mockApi.profile();
    }
  },
  updateAvatar: async (uri: string) => {
    if (useMock) {
      const stored = await authService.getStoredUser();
      const base = stored ?? (await mockApi.profile());
      const updated = { ...base, avatar: uri };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    }
    const formData = new FormData();
    formData.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
    const { data } = await apiClient.post('/profile/avatar', formData);
    return data;
  },
};

export const announcementsService = {
  getAll: async (): Promise<AnnouncementDetail[]> => {
    if (useMock) return mockApi.announcements();
    try {
      const { data } = await apiClient.get<AnnouncementDetail[]>('/announcements');
      return data;
    } catch {
      return mockApi.announcements();
    }
  },
};

const CALENDAR_EVENT_TYPES: AcademicCalendarEventType[] = ['academic', 'holiday', 'exam', 'event', 'meeting'];

function normalizeCalendarType(value: unknown): AcademicCalendarEventType {
  return CALENDAR_EVENT_TYPES.includes(value as AcademicCalendarEventType)
    ? (value as AcademicCalendarEventType)
    : 'event';
}

function mapFirestoreCalendarDoc(
  id: string,
  data: Record<string, unknown>,
  fallbackType: AcademicCalendarEventType,
): AcademicCalendarEvent | null {
  const date = String(data.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const title = String(data.title ?? data.subject ?? data.name ?? '').trim();
  if (!title) return null;

  return {
    id,
    title,
    date,
    type: normalizeCalendarType(data.type ?? fallbackType),
    description: String(data.description ?? data.notes ?? '').trim() || undefined,
    location: String(data.location ?? data.hallNumber ?? data.venue ?? '').trim() || undefined,
    time: String(data.time ?? data.startTime ?? '').trim() || undefined,
  };
}

async function fetchFirestoreCalendarEvents(schoolId: string): Promise<AcademicCalendarEvent[]> {
  const [eventsSnap, holidaysSnap, examsSnap] = await Promise.all([
    getDocs(collection(db, 'schools', schoolId, 'events')),
    getDocs(collection(db, 'schools', schoolId, 'holidays')),
    getDocs(collection(db, 'schools', schoolId, 'exams')),
  ]);

  const items: AcademicCalendarEvent[] = [
    ...eventsSnap.docs
      .map((docSnap) => mapFirestoreCalendarDoc(docSnap.id, docSnap.data() as Record<string, unknown>, 'event'))
      .filter((item): item is AcademicCalendarEvent => item !== null),
    ...holidaysSnap.docs
      .map((docSnap) => mapFirestoreCalendarDoc(docSnap.id, docSnap.data() as Record<string, unknown>, 'holiday'))
      .filter((item): item is AcademicCalendarEvent => item !== null),
    ...examsSnap.docs
      .map((docSnap) => mapFirestoreCalendarDoc(docSnap.id, docSnap.data() as Record<string, unknown>, 'exam'))
      .filter((item): item is AcademicCalendarEvent => item !== null),
  ];

  const deduped = new Map<string, AcademicCalendarEvent>();
  for (const item of items) {
    const key = `${item.type}|${item.date}|${item.title.toLowerCase()}`;
    if (!deduped.has(key)) deduped.set(key, item);
  }

  return Array.from(deduped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export const calendarService = {
  getAll: async (): Promise<AcademicCalendarEvent[]> => {
    try {
      const schoolId = await authService.getStoredSchoolId();
      if (schoolId) {
        const remote = await fetchFirestoreCalendarEvents(schoolId);
        if (remote.length) return remote;
      }
    } catch {
      // Fall back to mock calendar data.
    }
    return mockApi.calendar();
  },
};
