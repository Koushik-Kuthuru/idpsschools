/**
 * Maps every Stitch HTML screen → Expo Router route.
 * `_with_navigation` variants use bottom tabs; standalone variants use stack routes.
 */
export const STITCH_SCREEN_ROUTES = {
  splash_screen: '/(auth)/splash',
  login_screen: '/(auth)/login',
  verify_otp: '/(auth)/otp',
  reset_password: '/(auth)/reset-password',
  reset_success: '/(auth)/reset-success',
  forgot_password: '/(auth)/forgot-password',

  dashboard_with_navigation: '/(tabs)',
  refined_dashboard: '/profile/refined-dashboard',

  attendance_overview_with_navigation: '/(tabs)/attendance',
  attendance_overview: '/attendance/overview',
  attendance_detailed_view: '/attendance/detailed',
  attendance_by_subject: '/attendance/by-subject',

  marks_overview_with_navigation: '/(tabs)/marks',
  marks_overview: '/marks/overview',
  subject_detailed_marks: '/marks/subject/1',
  performance_analysis: '/marks/performance',

  assignments_homework_1: '/assignments',
  assignments_homework_2: '/assignments/browse',
  assignment_details_submission: '/assignments/1',

  exam_schedule: '/exams/schedule',
  class_timetable: '/exams/timetable',

  fees_overview_with_navigation: '/(tabs)/fees',
  fees_payments_overview: '/fees/payments-overview',
  payment_options: '/fees/payment-options',
  make_payment: '/fees/make-payment',
  payment_confirmation: '/fees/confirmation',
  fee_receipt: '/fees/receipt',

  notifications_alerts: '/notifications',
  full_announcements: '/announcements',

  student_profile_with_navigation: '/(tabs)/profile',
  student_profile: '/profile',
  settings: '/settings',
  change_password: '/settings/change-password',
  offline_mode_indicator: '/offline',
} as const;

export type StitchScreenId = keyof typeof STITCH_SCREEN_ROUTES;

export const STITCH_SCREEN_LIST: { id: StitchScreenId; label: string; route: string }[] = [
  { id: 'splash_screen', label: 'Splash Screen', route: STITCH_SCREEN_ROUTES.splash_screen },
  { id: 'login_screen', label: 'Login', route: STITCH_SCREEN_ROUTES.login_screen },
  { id: 'verify_otp', label: 'OTP Verification', route: STITCH_SCREEN_ROUTES.verify_otp },
  { id: 'reset_password', label: 'Reset Password', route: STITCH_SCREEN_ROUTES.reset_password },
  { id: 'reset_success', label: 'Reset Success', route: STITCH_SCREEN_ROUTES.reset_success },
  { id: 'forgot_password', label: 'Forgot Password', route: STITCH_SCREEN_ROUTES.forgot_password },
  { id: 'dashboard_with_navigation', label: 'Dashboard', route: STITCH_SCREEN_ROUTES.dashboard_with_navigation },
  { id: 'refined_dashboard', label: 'Refined Dashboard', route: STITCH_SCREEN_ROUTES.refined_dashboard },
  { id: 'attendance_overview_with_navigation', label: 'Attendance (Tab)', route: STITCH_SCREEN_ROUTES.attendance_overview_with_navigation },
  { id: 'attendance_overview', label: 'Attendance Overview', route: STITCH_SCREEN_ROUTES.attendance_overview },
  { id: 'attendance_detailed_view', label: 'Attendance Detailed', route: STITCH_SCREEN_ROUTES.attendance_detailed_view },
  { id: 'attendance_by_subject', label: 'Attendance By Subject', route: STITCH_SCREEN_ROUTES.attendance_by_subject },
  { id: 'marks_overview_with_navigation', label: 'Marks (Tab)', route: STITCH_SCREEN_ROUTES.marks_overview_with_navigation },
  { id: 'marks_overview', label: 'Marks Overview', route: STITCH_SCREEN_ROUTES.marks_overview },
  { id: 'subject_detailed_marks', label: 'Subject Marks', route: STITCH_SCREEN_ROUTES.subject_detailed_marks },
  { id: 'performance_analysis', label: 'Performance Analysis', route: STITCH_SCREEN_ROUTES.performance_analysis },
  { id: 'assignments_homework_1', label: 'Assignments List', route: STITCH_SCREEN_ROUTES.assignments_homework_1 },
  { id: 'assignments_homework_2', label: 'Assignments Browse', route: STITCH_SCREEN_ROUTES.assignments_homework_2 },
  { id: 'assignment_details_submission', label: 'Assignment Detail', route: STITCH_SCREEN_ROUTES.assignment_details_submission },
  { id: 'exam_schedule', label: 'Exam Schedule', route: STITCH_SCREEN_ROUTES.exam_schedule },
  { id: 'class_timetable', label: 'Class Timetable', route: STITCH_SCREEN_ROUTES.class_timetable },
  { id: 'fees_overview_with_navigation', label: 'Fees (Tab)', route: STITCH_SCREEN_ROUTES.fees_overview_with_navigation },
  { id: 'fees_payments_overview', label: 'Fees & Payments', route: STITCH_SCREEN_ROUTES.fees_payments_overview },
  { id: 'payment_options', label: 'Payment Options', route: STITCH_SCREEN_ROUTES.payment_options },
  { id: 'make_payment', label: 'Make Payment', route: STITCH_SCREEN_ROUTES.make_payment },
  { id: 'payment_confirmation', label: 'Payment Confirmation', route: STITCH_SCREEN_ROUTES.payment_confirmation },
  { id: 'fee_receipt', label: 'Fee Receipt', route: STITCH_SCREEN_ROUTES.fee_receipt },
  { id: 'notifications_alerts', label: 'Notifications', route: STITCH_SCREEN_ROUTES.notifications_alerts },
  { id: 'full_announcements', label: 'Announcements', route: STITCH_SCREEN_ROUTES.full_announcements },
  { id: 'student_profile_with_navigation', label: 'Profile (Tab)', route: STITCH_SCREEN_ROUTES.student_profile_with_navigation },
  { id: 'student_profile', label: 'Student Profile', route: STITCH_SCREEN_ROUTES.student_profile },
  { id: 'settings', label: 'Settings', route: STITCH_SCREEN_ROUTES.settings },
  { id: 'change_password', label: 'Change Password', route: STITCH_SCREEN_ROUTES.change_password },
  { id: 'offline_mode_indicator', label: 'Offline Mode', route: STITCH_SCREEN_ROUTES.offline_mode_indicator },
];
