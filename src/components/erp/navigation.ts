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
  { name: "Dashboard", href: "/idpscherukupalli/admin", icon: LayoutDashboard },
  { name: "Students", href: "/idpscherukupalli/admin/students", icon: GraduationCap },
  { name: "Employees", href: "/idpscherukupalli/admin/employees", icon: Users },
  { name: "Classes", href: "/idpscherukupalli/admin/classes", icon: BookOpen },
  { name: "Attendance", href: "/idpscherukupalli/admin/attendance", icon: Calendar },
  { name: "Marks", href: "/idpscherukupalli/admin/marks", icon: ClipboardList },
  { name: "Calendar", href: "/idpscherukupalli/admin/academic/calendar", icon: CalendarDays },
  { name: "Timetable", href: "/idpscherukupalli/admin/academic/timetable", icon: Clock },
  { name: "Finance", href: "/idpscherukupalli/admin/finance/fees", icon: Wallet },
  { name: "Leaves", href: "/idpscherukupalli/admin/hr/leaves", icon: FileText },
  { name: "Inventory", href: "/idpscherukupalli/admin/inventory/assets", icon: Package },
  { name: "Messages", href: "/idpscherukupalli/admin/communication/messages", icon: MessageSquare },
  { name: "Reports", href: "/idpscherukupalli/admin/reports", icon: FileText },
  { name: "Settings", href: "/idpscherukupalli/admin/settings", icon: Settings },
];
