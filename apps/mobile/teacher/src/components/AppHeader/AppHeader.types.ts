export type AppHeaderVariant = 'identity' | 'back' | 'title';

export interface AppHeaderProps {
  variant?: AppHeaderVariant;
  title?: string;
  subtitle?: string;
  chipLabel?: string;
  showNotification?: boolean;
  notificationCount?: number;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
  rightIcon?: string;
  onBackPress?: () => void;
  onNotificationPress?: () => void;
  avatarUrl?: string;
  greeting?: string;
  /** Shown below the time-based greeting on identity headers */
  name?: string;
}
