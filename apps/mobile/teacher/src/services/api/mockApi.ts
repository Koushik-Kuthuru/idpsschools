import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  mockAnnouncements,
  mockAssignments,
  mockAttendanceHistory,
  mockExamDuties,
  mockExams,
  getUnreadNotificationCount,
  getPendingAttendanceClassCount,
  getSubmittedClassAttendance,
  markClassAttendanceComplete,
  mockFacultyClasses,
  mockStudents,
  saveSubmittedClassAttendance,
  mockLeaveBalance,
  mockLeaveRequests,
  mockMarksExams,
  mockMarksHistory,
  mockMessages,
  mockNotifications,
  mockSalaryHistory,
  mockSalarySummary,
  mockSyncHistory,
  mockSyncQueue,
  getMockAccountByEmail,
  mockTeachingPerformance,
  mockTimetable,
  monthlyAttendance,
} from './mockData';
import type { AttendanceStatus, StaffRole } from '@/types';
import {
  clearCurrentUserEmail,
  getMergedProfileForSession,
  getUserPassword,
  saveUserProfile,
  setCurrentUserEmail,
  updateUserAvatar,
  updateUserName,
  updateUserPassword,
} from './userProfile';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(800);
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      const account = getMockAccountByEmail(normalizedEmail);
      if (!account) throw new Error('Invalid credentials');
      const expectedPassword = await getUserPassword(normalizedEmail);
      if (normalizedPassword !== expectedPassword) throw new Error('Invalid credentials');
      await AsyncStorage.setItem('auth_token', 'mock-jwt-token');
      await setCurrentUserEmail(normalizedEmail);
      return { token: 'mock-jwt-token', requiresOtp: true };
    },
    verifyOtp: async (otp: string) => {
      await delay(600);
      if (otp.length < 6) throw new Error('Invalid OTP');
      const user = await getMergedProfileForSession();
      await saveUserProfile(user);
      return { success: true, user };
    },
    verifyResetOtp: async (otp: string) => {
      await delay(600);
      if (otp.length < 6) throw new Error('Invalid OTP');
      return { success: true };
    },
    resetPassword: async (email: string, password: string) => {
      await delay(500);
      if (password.trim().length < 8) throw new Error('Password must be at least 8 characters');
      const normalizedEmail = email.trim().toLowerCase();
      if (!getMockAccountByEmail(normalizedEmail)) throw new Error('Account not found');
      await updateUserPassword(normalizedEmail, password.trim());
      await AsyncStorage.removeItem('auth_token');
      await clearCurrentUserEmail();
      return { success: true };
    },
    sendChangePasswordOtp: async () => {
      await delay(500);
      const user = await getMergedProfileForSession();
      return { success: true, sentTo: user.email };
    },
    changePasswordWithOtp: async (otp: string, password: string) => {
      await delay(600);
      if (otp.length < 6) throw new Error('Invalid OTP');
      if (password.trim().length < 8) throw new Error('Password must be at least 8 characters');
      const user = await getMergedProfileForSession();
      await updateUserPassword(user.email, password.trim());
      return { success: true };
    },
    logout: async () => {
      await AsyncStorage.removeItem('auth_token');
      await clearCurrentUserEmail();
    },
  },
  user: {
    getProfile: async () => {
      await delay();
      return getMergedProfileForSession();
    },
    updateAvatar: async (uri: string) => {
      await delay(300);
      const current = await getMergedProfileForSession();
      return updateUserAvatar(current.email, uri);
    },
    updateName: async (name: string) => {
      await delay(200);
      const current = await getMergedProfileForSession();
      return updateUserName(current.email, name);
    },
  },
  /** @deprecated Use mockApi.user */
  teacher: {
    getProfile: async () => {
      await delay();
      return getMergedProfileForSession();
    },
    updateAvatar: async (uri: string) => {
      await delay(300);
      const current = await getMergedProfileForSession();
      return updateUserAvatar(current.email, uri);
    },
  },
  dashboard: {
    getOverview: async () => {
      await delay();
      return {
        classesToday: 6,
        nextClass: 'Mathematics (9:00 AM) — Room 102',
        absentToday: 3,
        assignmentsToReview: 12,
        avgClassScore: 74,
        unreadAlerts: getUnreadNotificationCount(),
        upcomingExams: 2,
        announcements: mockAnnouncements.slice(0, 2),
      };
    },
  },
  attendance: {
    getOverview: async () => {
      await delay();
      return { overallPercent: 88, target: 95, monthly: monthlyAttendance, students: mockStudents };
    },
    getSession: async () => {
      await delay();
      return mockStudents.map((s) => ({ ...s, status: 'present' as AttendanceStatus }));
    },
    submit: async (
      records: { studentId: string; status: AttendanceStatus }[],
      classId?: string,
    ) => {
      await delay(500);
      const resolvedClassId =
        classId ?? mockFacultyClasses.find((c) => c.attendanceStatus === 'pending')?.id;
      if (resolvedClassId) {
        const cls = markClassAttendanceComplete(resolvedClassId);
        const students = records.map((record) => {
          const student = mockStudents.find((s) => s.id === record.studentId);
          return {
            id: record.studentId,
            name: student?.name ?? 'Student',
            rollNo: student?.rollNo ?? '—',
            className: student?.className ?? cls?.name.replace('CLASS ', '') ?? '',
            status: record.status,
          };
        });
        saveSubmittedClassAttendance({
          classId: resolvedClassId,
          className: cls?.name.replace('CLASS ', '') ?? '',
          subject: cls?.subject ?? '',
          submittedAt: 'Today',
          students,
        });
      }
      return { success: true };
    },
    getSubmitted: async (classId: string) => {
      await delay();
      return getSubmittedClassAttendance(classId) ?? null;
    },
  },
  students: {
    list: async () => {
      await delay();
      return mockStudents;
    },
    getById: async (id: string) => {
      await delay();
      const student = mockStudents.find((s) => s.id === id);
      if (!student) throw new Error('Student not found');
      return student;
    },
  },
  assignments: {
    list: async () => {
      await delay();
      return [...mockAssignments];
    },
    create: async (data: {
      title: string;
      subject: string;
      dueDate: string;
      description?: string;
    }) => {
      await delay(500);
      const assignment = {
        id: `a${Date.now()}`,
        title: data.title,
        subject: data.subject,
        className: '10-A',
        dueDate: data.dueDate,
        status: 'published' as const,
        submissionsCount: 0,
        totalStudents: 42,
      };
      mockAssignments.unshift(assignment);
      return assignment;
    },
    getSubmissions: async (assignmentId: string) => {
      await delay();
      return mockStudents.slice(0, 4).map((s, i) => ({
        student: s,
        marks: i < 2 ? 85 + i * 5 : null,
        submitted: i < 3,
      }));
    },
  },
  marks: {
    getOverview: async () => {
      await delay();
      return { classAverage: 74, topPerformers: mockStudents.slice(0, 3), subjects: [{ name: 'Mathematics', avg: 78 }, { name: 'Science', avg: 72 }] };
    },
  },
  announcements: {
    list: async () => {
      await delay();
      return [...mockAnnouncements];
    },
    create: async (data: { title: string; category?: 'academic' | 'urgent' | 'general' }) => {
      await delay(400);
      const category = data.category ?? 'general';
      const announcement = {
        id: `an${Date.now()}`,
        title: data.title,
        category,
        timestamp: 'Just now',
        borderColor: category === 'urgent' ? ('error' as const) : ('primary' as const),
      };
      mockAnnouncements.unshift(announcement);
      return announcement;
    },
  },
  messages: {
    list: async () => {
      await delay();
      return mockMessages;
    },
    getConversation: async (id: string) => {
      await delay();
      const thread = mockMessages.find((m) => m.id === id);
      return {
        thread,
        messages: [
          { id: 'm1', text: 'Hello Mrs. Sarah, I wanted to check on Alex\'s progress.', sent: false, time: '10:20 AM' },
          { id: 'm2', text: 'Good morning! Alex is doing well. His latest test score was 88%.', sent: true, time: '10:22 AM' },
          { id: 'm3', text: 'Thank you for the update on marks.', sent: false, time: '10:24 AM' },
        ],
      };
    },
  },
  notifications: {
    list: async () => {
      await delay();
      return mockNotifications.map((n) => ({ ...n }));
    },
    markAsRead: async (id: string) => {
      await delay(200);
      const item = mockNotifications.find((n) => n.id === id);
      if (item) item.read = true;
      return { success: true };
    },
    markAllAsRead: async () => {
      await delay(300);
      mockNotifications.forEach((n) => {
        n.read = true;
      });
      return { success: true };
    },
  },
  exams: {
    list: async () => {
      await delay();
      return mockExams;
    },
  },
  timetable: {
    get: async () => {
      await delay();
      return mockTimetable;
    },
  },
  faculty: {
    getClasses: async () => {
      await delay();
      return [...mockFacultyClasses];
    },
    getMarksExams: async () => {
      await delay();
      return [...mockMarksExams];
    },
    getAttendanceHistory: async () => {
      await delay();
      return [...mockAttendanceHistory];
    },
    getMarksHistory: async () => {
      await delay();
      return [...mockMarksHistory];
    },
    getLeaves: async () => {
      await delay();
      return [...mockLeaveRequests];
    },
    applyLeave: async (data: {
      type: import('@/types').LeaveType;
      fromDate: string;
      toDate: string;
      reason: string;
      description?: string;
    }) => {
      await delay(500);
      const item = {
        ...data,
        id: `l${Date.now()}`,
        status: 'pending' as const,
        appliedOn: 'Just now',
      };
      mockLeaveRequests.unshift(item);
      return item;
    },
    getLeaveBalance: async () => {
      await delay();
      return mockLeaveBalance;
    },
    getSalarySummary: async () => {
      await delay();
      return mockSalarySummary;
    },
    getSalaryHistory: async () => {
      await delay();
      return [...mockSalaryHistory];
    },
    getSyncQueue: async () => {
      await delay();
      return { queue: [...mockSyncQueue], history: [...mockSyncHistory] };
    },
    getExamDuties: async () => {
      await delay();
      return [...mockExamDuties];
    },
    getPerformance: async () => {
      await delay();
      return mockTeachingPerformance;
    },
    getPendingTasks: async () => {
      await delay();
      const user = await getMergedProfileForSession();
      const designation = user.designation as StaffRole;
      const pendingAttendance = getPendingAttendanceClassCount();

      if (designation === 'principal' || designation === 'vice_principal') {
        return [
          {
            id: 't3',
            icon: 'event_busy',
            title: 'Leave Approval',
            subtitle: '3 pending requests',
            action: 'LeaveManagement' as const,
          },
          {
            id: 't4',
            icon: 'campaign',
            title: 'Review Announcements',
            subtitle: '2 drafts awaiting publish',
            action: 'AnnouncementsManagement' as const,
          },
        ];
      }

      if (designation === 'admin') {
        return [
          {
            id: 't5',
            icon: 'sync',
            title: 'Sync Queue',
            subtitle: '4 records pending upload',
            action: 'SyncQueue' as const,
          },
          {
            id: 't4',
            icon: 'campaign',
            title: 'Announcements',
            subtitle: 'Manage school notices',
            action: 'AnnouncementsManagement' as const,
          },
        ];
      }

      const tasks = [
        {
          id: 't1',
          icon: 'fact_check',
          title: 'Mark Attendance',
          subtitle: `${pendingAttendance} class${pendingAttendance === 1 ? '' : 'es'} pending`,
          action: 'AttendanceClasses' as const,
        },
        {
          id: 't2',
          icon: 'grade',
          title: 'Enter Marks',
          subtitle: `${user.className ?? '10-A'} Final Exam`,
          action: 'MarksClasses' as const,
        },
        {
          id: 't3',
          icon: 'event_busy',
          title: 'Leave Requests',
          subtitle: 'View your leave status',
          action: 'LeaveManagement' as const,
        },
      ];

      if (designation === 'coordinator') {
        return tasks.filter((t) => t.id !== 't3');
      }

      return pendingAttendance > 0 ? tasks : tasks.filter((t) => t.id !== 't1');
    },
  },
};
