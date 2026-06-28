export interface TransportInfo {
  routeNo: string;
  pickupPoint: string;
  vehicleNo?: string;
  inchargeNumber: string;
  driverName: string;
  driverNumber: string;
  destinationAddress: string;
  captainName: string;
  trackingLink: string;
}

export interface HostelInfo {
  block: string;
  roomNo: string;
  bedNo: string;
  wardenName: string;
  wardenPhone: string;
  messTimings?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  grade: string;
  rollNumber: string;
  className: string;
  schoolName: string;
  avatar?: string;
  /** Admin-generated ID card image URL (Supabase Storage / CDN). */
  idCardImageUrl?: string;
  idCardAcademicYear?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  bloodGroup?: string;
  parentName?: string;
  parentPhone?: string;
  transport?: TransportInfo;
  hostel?: HostelInfo;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface DashboardData {
  studentName: string;
  schoolName: string;
  attendancePercent: number;
  attendanceStatus: string;
  classesToday: number;
  nextClass: string;
  gpa: number;
  feesDue: number;
  announcements: Announcement[];
  notificationCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  isNew: boolean;
}

export type AnnouncementCategory = 'important' | 'holiday' | 'events' | 'general';

export interface AnnouncementDetail extends Announcement {
  category: AnnouncementCategory;
  postedAt: string;
  postedBy?: string;
  dateTime?: string;
  priority?: string;
  attachments?: number;
  attachmentFiles?: string[];
  imageUrl?: string;
  content?: string;
}

export type AcademicTerm = 'term1' | 'term2' | 'term3' | 'annual';

export interface AttendanceSummary {
  overallPercent: number;
  target: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  month: string;
  className: string;
}

export interface SubjectAttendance {
  id: string;
  subject: string;
  percent: number;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  subject?: string;
}

export interface MarksOverview {
  gpa: number;
  grade: string;
  rank: string;
  totalPercent: number;
  lastUpdated: string;
  teacherInCharge: string;
  subjects: SubjectMark[];
  terms: Record<AcademicTerm, { gpa: number; grade: string; rank: string; totalPercent: number; subjects: SubjectMark[] }>;
}

export interface SubjectMark {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  grade: string;
  icon: string;
  internalMarks?: number;
  externalMarks?: number;
}

export type WorkItemType = 'homework' | 'assignment' | 'project' | 'task' | 'assessment' | 'classwork';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  type: WorkItemType;
  description: string;
  dueDate: string;
  dueAt: string;
  assignedAt: string;
  teacher: string;
  status: 'pending' | 'submitted' | 'overdue';
  attachments?: string[];
}

export interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
  hallNumber: string;
}

export type AcademicCalendarEventType = 'academic' | 'holiday' | 'exam' | 'event' | 'meeting';

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  date: string;
  type: AcademicCalendarEventType;
  description?: string;
  location?: string;
  time?: string;
}

export interface TimetableSlot {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
  color: string;
  isLive?: boolean;
  isBreak?: boolean;
  courseId?: string;
}

export interface CourseTimelineEntry {
  id: string;
  date: string;
  timeRange: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  topic?: string;
}

export interface CourseTopicAttachment {
  id: string;
  title: string;
  type: 'pdf' | 'notes' | 'link' | 'video';
  fileName?: string;
  size?: string;
}

export interface CourseSyllabusTopic {
  id: string;
  title: string;
  attachments?: CourseTopicAttachment[];
}

export interface CourseSyllabusChapter {
  id: string;
  unitNumber?: number;
  title: string;
  topics: CourseSyllabusTopic[];
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'book' | 'pdf' | 'link';
  author?: string;
  subtitle?: string;
}

export interface CourseDetail {
  id: string;
  code: string;
  subject: string;
  teacher: string;
  yourAttendancePercent: number;
  classAveragePercent: number;
  syllabus: CourseSyllabusChapter[];
  resources: CourseResource[];
  timeline: CourseTimelineEntry[];
}

export interface TimetableDay {
  day: string;
  shortDay?: string;
  date?: number;
  month?: number;
  year?: number;
  fullDate?: string;
  isToday?: boolean;
  slots: TimetableSlot[];
}

export interface FeesOverview {
  totalFees: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  structure: { label: string; amount: number }[];
  recentPayments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  period: string;
  paidOn: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  transactionId?: string;
  receiptNumber?: string;
  method?: string;
  dateTime?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Message {
  id: string;
  sender: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'notice' | 'assignment' | 'exam' | 'fee';
  time: string;
  read: boolean;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: string;
  privacyAnalytics: boolean;
}
