export { apiClient } from './client';
export * from './mockData';
import { mockApi as originalMockApi } from './mockApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCurrentUserEmail } from './userProfile';
import { buildPath, fetchMany, buildQuery, upsertData, db } from '@/lib/db-client';
import type { AttendanceStatus } from '@/types';

const useMock = false;

export const authService = {
  login: async (email: string, password: string) => {
    return originalMockApi.auth.login(email, password);
  },
  logout: async () => {
    if (useMock) return originalMockApi.auth.logout();
    await AsyncStorage.removeItem('auth_token');
    await clearCurrentUserEmail();
  },
  verifyOtp: originalMockApi.auth.verifyOtp,
  verifyResetOtp: originalMockApi.auth.verifyResetOtp,
  resetPassword: originalMockApi.auth.resetPassword,
  sendChangePasswordOtp: originalMockApi.auth.sendChangePasswordOtp,
  changePasswordWithOtp: originalMockApi.auth.changePasswordWithOtp,
};

export const mockApi = {
  ...originalMockApi,
  auth: authService,
  attendance: {
    ...originalMockApi.attendance,
    getSession: async () => {
      try {
        const q = buildQuery(buildPath(db, "schools", "idpscherukupalli", "students"));
        const snap = await fetchMany(q);
        return snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          const date = new Date().toISOString().split('T')[0];
          let status: AttendanceStatus = 'present';
          if (data.attendance?.absentDates?.includes(date)) {
            status = 'absent';
          } else if (data.attendance?.lateDates?.includes(date)) {
            status = 'late';
          }
          return {
            id: docSnap.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.username || 'Unnamed',
            rollNo: String(data.rollNumber || '-'),
            className: data.classId || '10-A',
            avatarUrl: data.photo || null,
            attendancePercent: 90,
            status
          };
        });
      } catch (err) {
        console.error("Error getting live attendance session:", err);
        return originalMockApi.attendance.getSession();
      }
    },
    submit: async (records: { studentId: string; status: AttendanceStatus }[], classId?: string) => {
      try {
        const date = new Date().toISOString().split('T')[0];
        const studentDoc = await fetchMany(buildQuery(buildPath(db, "schools", "idpscherukupalli", "students")));
        
        const promises = records.map(async (record) => {
          const studentRef = buildPath(db, "schools", "idpscherukupalli", "students", record.studentId);
          const docSnapshot = studentDoc.docs.find((d) => d.id === record.studentId);
          if (!docSnapshot) return;
          const data = docSnapshot.data() as Record<string, any>;
          
          let presentDates: string[] = data.attendance?.presentDates || [];
          let absentDates: string[] = data.attendance?.absentDates || [];
          let lateDates: string[] = data.attendance?.lateDates || [];
          
          presentDates = presentDates.filter(d => d !== date);
          absentDates = absentDates.filter(d => d !== date);
          lateDates = lateDates.filter(d => d !== date);
          
          if (record.status === 'present') {
            presentDates.push(date);
          } else if (record.status === 'absent') {
            absentDates.push(date);
          } else if (record.status === 'late') {
            lateDates.push(date);
          }
          
          await upsertData(studentRef, {
            attendance: {
              ...(data.attendance as Record<string, unknown>),
              presentDates,
              absentDates,
              lateDates,
              lastUpdated: new Date().toISOString(),
            },
          });
        });
        
        await Promise.all(promises);
        return { success: true };
      } catch (err) {
        console.error("Error submitting live attendance:", err);
        return originalMockApi.attendance.submit(records, classId);
      }
    }
  }
};
