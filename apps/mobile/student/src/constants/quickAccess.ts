import type { MaterialIcons } from '@expo/vector-icons';

export interface QuickAccessItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route: '/assignments' | '/exams/schedule' | '/timetable' | '/(tabs)/notice-board' | '/notifications' | '/marks/performance' | '/profile' | '/settings';
}

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  { icon: 'assignment', label: 'Projects', route: '/assignments' },
  { icon: 'event', label: 'Exams', route: '/exams/schedule' },
  { icon: 'schedule', label: 'Class timetable', route: '/timetable' },
  { icon: 'campaign', label: 'Notice board', route: '/(tabs)/notice-board' },
  { icon: 'notifications', label: 'Notifications', route: '/notifications' },
  { icon: 'insights', label: 'Performance', route: '/marks/performance' },
  { icon: 'person', label: 'Profile', route: '/profile' },
  { icon: 'settings', label: 'Settings', route: '/settings' },
];
