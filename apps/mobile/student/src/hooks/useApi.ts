import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardService,
  attendanceService,
  marksService,
  assignmentsService,
  examsService,
  timetableService,
  courseService,
  feesService,
  notificationsService,
  profileService,
  announcementsService,
  calendarService,
} from '@/services/api';
import { useAuthStore } from '@/store';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  attendance: ['attendance'] as const,
  attendanceSubjects: ['attendance', 'subjects'] as const,
  attendanceRecords: ['attendance', 'records'] as const,
  marks: ['marks'] as const,
  marksSubject: (id: string) => ['marks', 'subject', id] as const,
  marksPerformance: ['marks', 'performance'] as const,
  assignments: ['assignments'] as const,
  assignment: (id: string) => ['assignments', id] as const,
  exams: ['exams'] as const,
  timetable: ['timetable'] as const,
  course: (id: string) => ['course', id] as const,
  fees: ['fees'] as const,
  paymentMethods: ['paymentMethods'] as const,
  notifications: ['notifications'] as const,
  profile: ['profile'] as const,
  announcements: ['announcements'] as const,
  calendar: ['calendar'] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: dashboardService.get });
}

export function useAttendanceSummary() {
  return useQuery({ queryKey: queryKeys.attendance, queryFn: attendanceService.getSummary });
}

export function useAttendanceSubjects() {
  return useQuery({ queryKey: queryKeys.attendanceSubjects, queryFn: attendanceService.getSubjects });
}

export function useAttendanceRecords() {
  return useQuery({ queryKey: queryKeys.attendanceRecords, queryFn: attendanceService.getRecords });
}

export function useMarksOverview() {
  return useQuery({ queryKey: queryKeys.marks, queryFn: marksService.getOverview });
}

export function useSubjectMarks(id: string) {
  return useQuery({ queryKey: queryKeys.marksSubject(id), queryFn: () => marksService.getSubject(id), enabled: !!id });
}

export function usePerformanceAnalysis() {
  return useQuery({ queryKey: queryKeys.marksPerformance, queryFn: marksService.getPerformance });
}

export function useAssignments() {
  return useQuery({ queryKey: queryKeys.assignments, queryFn: assignmentsService.getAll, refetchOnMount: 'always' });
}

export function useAssignment(id: string) {
  return useQuery({ queryKey: queryKeys.assignment(id), queryFn: () => assignmentsService.getById(id), enabled: !!id });
}

export function useExams() {
  return useQuery({ queryKey: queryKeys.exams, queryFn: examsService.getAll, refetchOnMount: 'always' });
}

export function useTimetable() {
  return useQuery({ queryKey: queryKeys.timetable, queryFn: timetableService.get, refetchOnMount: 'always' });
}

export function useCourseDetail(courseId: string, subjectHint?: string) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => courseService.getById(courseId, subjectHint),
    enabled: !!courseId,
  });
}

export function useFees() {
  return useQuery({ queryKey: queryKeys.fees, queryFn: feesService.getOverview });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: feesService.getPaymentMethods });
}

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: notificationsService.getAll });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: profileService.get });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: announcementsService.getAll,
    refetchOnMount: 'always',
  });
}

export function useAcademicCalendar() {
  return useQuery({
    queryKey: queryKeys.calendar,
    queryFn: calendarService.getAll,
    refetchOnMount: 'always',
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, uri, name }: { id: string; uri: string; name: string }) =>
      assignmentsService.upload(id, uri, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.assignments }),
  });
}

export function useMakePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, method }: { amount: number; method: string }) =>
      feesService.makePayment(amount, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fees });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uri: string) => profileService.updateAvatar(uri),
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
      qc.setQueryData(queryKeys.profile, updatedUser);
    },
  });
}

