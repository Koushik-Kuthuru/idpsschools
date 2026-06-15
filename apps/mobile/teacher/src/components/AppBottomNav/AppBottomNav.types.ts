/** Faculty app bottom tabs per facultyapp.md */
export type BottomNavTab = 'home' | 'classes' | 'attendance' | 'marks' | 'profile';

export interface AppBottomNavProps {
  /** @deprecated Kept for API compat */
  variant?: 'dashboard' | 'standard' | 'alternate';
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
}
