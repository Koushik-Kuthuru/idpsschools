export interface DashboardCardProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  accentColor?: string;
  title: string;
  subtitle: string;
  subtitleHighlight?: string;
  badge?: string;
  onPress?: () => void;
}
