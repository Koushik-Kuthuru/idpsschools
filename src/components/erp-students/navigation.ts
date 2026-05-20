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
  { name: "Dashboard", href: "/idpscherukupalli/students", icon: LayoutDashboard },
  { name: "Students", href: "/idpscherukupalli/students/students", icon: GraduationCap },
  { name: "Employees", href: "/idpscherukupalli/students/employees", icon: Users },
  { name: "Classes", href: "/idpscherukupalli/students/classes", icon: BookOpen },
  { name: "Attendance", href: "/idpscherukupalli/students/attendance", icon: Calendar },
  { name: "Marks", href: "/idpscherukupalli/students/marks", icon: ClipboardList },
  { name: "Calendar", href: "/idpscherukupalli/students/academic/calendar", icon: CalendarDays },
  { name: "Timetable", href: "/idpscherukupalli/students/academic/timetable", icon: Clock },
  { name: "Finance", href: "/idpscherukupalli/students/finance/fees", icon: Wallet },
  { name: "Leaves", href: "/idpscherukupalli/students/hr/leaves", icon: FileText },
  { name: "Inventory", href: "/idpscherukupalli/students/inventory/assets", icon: Package },
  { name: "Messages", href: "/idpscherukupalli/students/communication/messages", icon: MessageSquare },
  { name: "Reports", href: "/idpscherukupalli/students/reports", icon: FileText },
  { name: "Settings", href: "/idpscherukupalli/students/settings", icon: Settings },
];
