import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Clock,
  Wallet,
  MessageSquare,
  FolderOpen,
  BookOpen,
  FileStack,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export type StudentNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export function getStudentNavigation(schoolId: string): StudentNavItem[] {
  const base = `/schools/${schoolId}/students`;
  return [
    { name: "Dashboard", href: base, icon: LayoutDashboard },
    { name: "Attendance", href: `${base}/attendance`, icon: Calendar },
    { name: "Homework", href: `${base}/homework`, icon: BookOpen },
    { name: "Study Materials", href: `${base}/materials`, icon: FileStack },
    { name: "Marks", href: `${base}/marks`, icon: ClipboardList },
    { name: "Calendar", href: `${base}/calendar`, icon: CalendarDays },
    { name: "Timetable", href: `${base}/timetable`, icon: Clock },
    { name: "Fees", href: `${base}/fees`, icon: Wallet },
    { name: "Documents", href: `${base}/documents`, icon: FolderOpen },
    { name: "Messages", href: `${base}/messages`, icon: MessageSquare },
  ];
}

/** @deprecated Use getStudentNavigation(schoolId) */
export const buildNavigation = getStudentNavigation;
