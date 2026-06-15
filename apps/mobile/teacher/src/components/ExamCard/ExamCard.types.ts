export interface ExamCardProps {
  subject: string;
  date: string;
  time: string;
  room: string;
  status: 'upcoming' | 'past';
  syllabusPercent?: number;
  onPress?: () => void;
}
