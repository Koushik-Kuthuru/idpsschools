import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dashboardService,
  attendanceService,
  marksService,
  assignmentsService,
  examsService,
  timetableService,
  subjectsService,
  courseService,
  feesService,
  notificationsService,
  profileService,
  announcementsService,
  calendarService,
  academicYearsService,
} from '@/services/api';
import { useAuthStore, useSettingsStore } from '@/store';

function usePortalEnabled() {
  return useAuthStore((s) => s.isAuthenticated);
}

/** Cache-scopes all portal data by selected academic year. */
function useYearScope() {
  return useSettingsStore((s) => s.selectedAcademicYear) ?? 'school-current';
}

export const queryKeys = {
  dashboard: (year: string) => ['dashboard', year] as const,
  attendance: (year: string) => ['attendance', year] as const,
  attendanceSubjects: (year: string) => ['attendance', 'subjects', year] as const,
  attendanceRecords: (year: string) => ['attendance', 'records', year] as const,
  marks: (year: string) => ['marks', year] as const,
  marksSubject: (id: string, year: string) => ['marks', 'subject', id, year] as const,
  marksPerformance: (year: string) => ['marks', 'performance', year] as const,
  assignments: (year: string) => ['assignments', year] as const,
  assignment: (id: string, year: string) => ['assignments', id, year] as const,
  exams: (year: string) => ['exams', year] as const,
  timetable: (year: string) => ['timetable', year] as const,
  subjects: (year: string) => ['subjects', year] as const,
  course: (id: string, year: string) => ['course', id, year] as const,
  fees: (year: string) => ['fees', year] as const,
  paymentMethods: ['paymentMethods'] as const,
  notifications: (year: string) => ['notifications', year] as const,
  profile: (year: string) => ['profile', year] as const,
  announcements: (year: string) => ['announcements', year] as const,
  calendar: (year: string) => ['calendar', year] as const,
  academicYears: ['academicYears'] as const,
};

export function useDashboard() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({ queryKey: queryKeys.dashboard(year), queryFn: dashboardService.get, enabled });
}

export function useAttendanceSummary() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({ queryKey: queryKeys.attendance(year), queryFn: attendanceService.getSummary, enabled });
}

export function useAttendanceSubjects() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.attendanceSubjects(year),
    queryFn: attendanceService.getSubjects,
    enabled,
  });
}

export function useAttendanceRecords() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.attendanceRecords(year),
    queryFn: attendanceService.getRecords,
    enabled,
  });
}

export function useMarksOverview() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({ queryKey: queryKeys.marks(year), queryFn: marksService.getOverview, enabled });
}

export function useSubjectMarks(id: string) {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.marksSubject(id, year),
    queryFn: () => marksService.getSubject(id),
    enabled: enabled && !!id,
  });
}

export function usePerformanceAnalysis() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.marksPerformance(year),
    queryFn: marksService.getPerformance,
    enabled,
  });
}

export function useAssignments() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.assignments(year),
    queryFn: assignmentsService.getAll,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useAssignment(id: string) {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.assignment(id, year),
    queryFn: () => assignmentsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useExams() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.exams(year),
    queryFn: examsService.getAll,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useTimetable() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.timetable(year),
    queryFn: timetableService.get,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useSubjects() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.subjects(year),
    queryFn: subjectsService.getAll,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useCourseDetail(courseId: string, subjectHint?: string) {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.course(courseId, year),
    queryFn: () => courseService.getById(courseId, subjectHint),
    enabled: enabled && !!courseId,
  });
}

export function useFees() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({ queryKey: queryKeys.fees(year), queryFn: feesService.getOverview, enabled });
}

export function usePaymentMethods() {
  return useQuery({ queryKey: queryKeys.paymentMethods, queryFn: feesService.getPaymentMethods });
}

export function useNotifications() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.notifications(year),
    queryFn: notificationsService.getAll,
    enabled,
  });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const year = useYearScope();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications(year) }),
  });
}

export function useProfile() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.profile(year),
    queryFn: profileService.get,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useAnnouncements() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.announcements(year),
    queryFn: announcementsService.getAll,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useAcademicCalendar() {
  const enabled = usePortalEnabled();
  const year = useYearScope();
  return useQuery({
    queryKey: queryKeys.calendar(year),
    queryFn: calendarService.getAll,
    refetchOnMount: 'always',
    enabled,
  });
}

export function useAcademicYears() {
  const enabled = usePortalEnabled();
  return useQuery({
    queryKey: queryKeys.academicYears,
    queryFn: academicYearsService.list,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  const year = useYearScope();
  return useMutation({
    mutationFn: ({ id, uri, name }: { id: string; uri: string; name: string }) =>
      assignmentsService.upload(id, uri, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.assignments(year) }),
  });
}

export function useMakePayment() {
  const qc = useQueryClient();
  const year = useYearScope();
  return useMutation({
    mutationFn: ({ amount, method }: { amount: number; method: string }) =>
      feesService.makePayment(amount, method),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fees(year) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(year) });
    },
  });
}

export function useUpdateAvatar() {
  const qc = useQueryClient();
  const year = useYearScope();
  return useMutation({
    mutationFn: (uri: string) => profileService.updateAvatar(uri),
    onSuccess: (updatedUser) => {
      useAuthStore.setState({ user: updatedUser });
      qc.setQueryData(queryKeys.profile(year), updatedUser);
    },
  });
}
