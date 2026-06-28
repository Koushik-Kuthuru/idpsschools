import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  MessageSquare,
  CalendarDays,
  BookOpen,
  FileStack,
  type LucideIcon,
} from "lucide-react";

export type TeacherNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export function getTeacherNavigation(schoolId: string): TeacherNavItem[] {
  const base = `/schools/${schoolId}/teachers`;
  return [
    { name: "Dashboard", href: base, icon: LayoutDashboard },
    { name: "Students", href: `${base}/students`, icon: GraduationCap },
    { name: "Attendance", href: `${base}/attendance`, icon: Calendar },
    { name: "Homework", href: `${base}/homework`, icon: BookOpen },
    { name: "Study Materials", href: `${base}/materials`, icon: FileStack },
    { name: "Marks", href: `${base}/marks`, icon: ClipboardList },
    { name: "Calendar", href: `${base}/calendar`, icon: CalendarDays },
    { name: "Timetable", href: `${base}/timetable`, icon: Clock },
    { name: "Leaves", href: `${base}/leaves`, icon: FileText },
    { name: "Messages", href: `${base}/messages`, icon: MessageSquare },
  ];
}

/** @deprecated Use getTeacherNavigation(schoolId) */
export const navigation = getTeacherNavigation("idpscherukupalli");
