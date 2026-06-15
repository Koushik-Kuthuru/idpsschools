export interface MessageCardProps {
  name: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  unread: number;
  onPress?: () => void;
}
