import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings,
  FileText,
  Wallet,
  Clock,
  ClipboardList,
  Package,
  MessageSquare,
  CalendarDays
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/idpscherukupalli/teachers", icon: LayoutDashboard },
  { name: "Students", href: "/idpscherukupalli/teachers/students", icon: GraduationCap },
  { name: "Employees", href: "/idpscherukupalli/teachers/employees", icon: Users },
  { name: "Classes", href: "/idpscherukupalli/teachers/classes", icon: BookOpen },
  { name: "Attendance", href: "/idpscherukupalli/teachers/attendance", icon: Calendar },
  { name: "Marks", href: "/idpscherukupalli/teachers/marks", icon: ClipboardList },
  { name: "Calendar", href: "/idpscherukupalli/teachers/academic/calendar", icon: CalendarDays },
  { name: "Timetable", href: "/idpscherukupalli/teachers/academic/timetable", icon: Clock },
  { name: "Finance", href: "/idpscherukupalli/teachers/finance/fees", icon: Wallet },
  { name: "Leaves", href: "/idpscherukupalli/teachers/hr/leaves", icon: FileText },
  { name: "Inventory", href: "/idpscherukupalli/teachers/inventory/assets", icon: Package },
  { name: "Messages", href: "/idpscherukupalli/teachers/communication/messages", icon: MessageSquare },
  { name: "Reports", href: "/idpscherukupalli/teachers/reports", icon: FileText },
  { name: "Settings", href: "/idpscherukupalli/teachers/settings", icon: Settings },
];
