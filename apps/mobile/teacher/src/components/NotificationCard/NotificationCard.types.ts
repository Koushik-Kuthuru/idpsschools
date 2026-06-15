export interface NotificationCardProps {
  title: string;
  body: string;
  type: 'academic' | 'urgent' | 'system';
  timestamp: string;
  read: boolean;
  onPress?: () => void;
  onMarkAsRead?: () => void;
}
