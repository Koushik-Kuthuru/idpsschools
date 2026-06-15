export interface DashboardStatCardProps {
  value: string;
  label: string;
  valueColor?: string;
  progressPercent?: number;
  footerText?: string;
  footerTextColor?: string;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
}
