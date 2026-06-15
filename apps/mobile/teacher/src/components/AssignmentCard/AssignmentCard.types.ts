export interface AssignmentCardProps {
  title: string;
  subject: string;
  dueDate: string;
  status: 'draft' | 'published' | 'closed';
  submissionsCount: number;
  totalStudents: number;
  onPress?: () => void;
}
