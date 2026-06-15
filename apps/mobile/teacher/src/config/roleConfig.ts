import type { BottomNavTab } from '@/components/AppBottomNav/AppBottomNav.types';
import type { StaffRole } from '@/types';

export type FacultyMenuRoute =
  | 'AssignmentsList'
  | 'LeaveManagement'
  | 'SalaryOverview'
  | 'MessagesList'
  | 'ClassTimetable'
  | 'AnnouncementsManagement'
  | 'TeachingPerformance'
  | 'SyncQueue'
  | 'TeacherSettings';

export interface RoleConfig {
  label: string;
  tabs: BottomNavTab[];
  menuRoutes: FacultyMenuRoute[];
  showClassSubtitle: boolean;
  profileSettingsRoutes: ('ChangePassword' | 'LeaveBalance' | 'SalaryOverview' | 'TeacherSettings')[];
}

const ALL_MENU: FacultyMenuRoute[] = [
  'AssignmentsList',
  'LeaveManagement',
  'SalaryOverview',
  'MessagesList',
  'ClassTimetable',
  'AnnouncementsManagement',
  'TeachingPerformance',
  'SyncQueue',
  'TeacherSettings',
];

export const ROLE_CONFIG: Record<StaffRole, RoleConfig> = {
  teacher: {
    label: 'Teacher',
    tabs: ['home', 'classes', 'attendance', 'marks', 'profile'],
    menuRoutes: ALL_MENU,
    showClassSubtitle: true,
    profileSettingsRoutes: ['ChangePassword', 'LeaveBalance', 'SalaryOverview', 'TeacherSettings'],
  },
  principal: {
    label: 'Principal',
    tabs: ['home', 'profile'],
    menuRoutes: [
      'LeaveManagement',
      'MessagesList',
      'ClassTimetable',
      'AnnouncementsManagement',
      'TeachingPerformance',
      'TeacherSettings',
    ],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'LeaveBalance', 'TeacherSettings'],
  },
  vice_principal: {
    label: 'Vice Principal',
    tabs: ['home', 'classes', 'profile'],
    menuRoutes: [
      'LeaveManagement',
      'MessagesList',
      'ClassTimetable',
      'AnnouncementsManagement',
      'TeachingPerformance',
      'TeacherSettings',
    ],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'LeaveBalance', 'TeacherSettings'],
  },
  coordinator: {
    label: 'Academic Coordinator',
    tabs: ['home', 'classes', 'attendance', 'marks', 'profile'],
    menuRoutes: [
      'AssignmentsList',
      'LeaveManagement',
      'MessagesList',
      'ClassTimetable',
      'AnnouncementsManagement',
      'TeachingPerformance',
      'TeacherSettings',
    ],
    showClassSubtitle: true,
    profileSettingsRoutes: ['ChangePassword', 'LeaveBalance', 'TeacherSettings'],
  },
  admin: {
    label: 'Administrator',
    tabs: ['home', 'profile'],
    menuRoutes: [
      'MessagesList',
      'AnnouncementsManagement',
      'SyncQueue',
      'TeacherSettings',
    ],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'TeacherSettings'],
  },
  manager: {
    label: 'Manager',
    tabs: ['home', 'profile'],
    menuRoutes: [
      'LeaveManagement',
      'MessagesList',
      'AnnouncementsManagement',
      'TeachingPerformance',
      'TeacherSettings',
    ],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'TeacherSettings'],
  },
  academic_director: {
    label: 'Academic Director',
    tabs: ['home', 'profile'],
    menuRoutes: [],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'TeacherSettings'],
  },
  academic_manager: {
    label: 'Academic Administration Manager',
    tabs: ['home', 'profile'],
    menuRoutes: [],
    showClassSubtitle: false,
    profileSettingsRoutes: ['ChangePassword', 'TeacherSettings'],
  },
};

export function getRoleConfig(designation: StaffRole): RoleConfig {
  return ROLE_CONFIG[designation];
}

export function getBottomTabsForRole(designation: StaffRole): BottomNavTab[] {
  return ROLE_CONFIG[designation].tabs;
}

export function isTabAllowedForRole(designation: StaffRole, tab: BottomNavTab): boolean {
  return ROLE_CONFIG[designation].tabs.includes(tab);
}
