import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  ClipboardList, 
  Clock, 
  Wallet, 
  MessageSquare,
  FolderOpen
} from "lucide-react";

export const buildNavigation = (schoolId: string) => [
  { name: "Dashboard", href: `/schools/${schoolId}/students`, icon: LayoutDashboard },
  { name: "Profile", href: `/schools/${schoolId}/students/profile`, icon: User },
  { name: "Attendance", href: `/schools/${schoolId}/students/attendance`, icon: Calendar },
  { name: "Marks", href: `/schools/${schoolId}/students/marks`, icon: ClipboardList },
  { name: "Timetable", href: `/schools/${schoolId}/students/timetable`, icon: Clock },
  { name: "Fees", href: `/schools/${schoolId}/students/fees`, icon: Wallet },
  { name: "Documents", href: `/schools/${schoolId}/students/documents`, icon: FolderOpen },
  { name: "Messages", href: `/schools/${schoolId}/students/messages`, icon: MessageSquare },
];
