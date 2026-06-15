export interface StudentCardProps {
  name: string;
  rollNo: string;
  className: string;
  avatarUrl: string;
  attendancePercent: number;
  onPress?: () => void;
}
