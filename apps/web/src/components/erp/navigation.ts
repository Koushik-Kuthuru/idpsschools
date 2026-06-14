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
  { name: "Dashboard", href: "/schools/idpscherukupalli/admin", icon: LayoutDashboard },
  { name: "Students", href: "/schools/idpscherukupalli/admin/students", icon: GraduationCap },
  { name: "Employees", href: "/schools/idpscherukupalli/admin/employees", icon: Users },
  { name: "Classes", href: "/schools/idpscherukupalli/admin/classes", icon: BookOpen },
  { name: "Attendance", href: "/schools/idpscherukupalli/admin/attendance", icon: Calendar },
  { name: "Marks", href: "/schools/idpscherukupalli/admin/marks", icon: ClipboardList },
  { name: "Calendar", href: "/schools/idpscherukupalli/admin/academic/calendar", icon: CalendarDays },
  { name: "Timetable", href: "/schools/idpscherukupalli/admin/academic/timetable", icon: Clock },
  { name: "Finance", href: "/schools/idpscherukupalli/admin/finance/fees", icon: Wallet },
  { name: "Leaves", href: "/schools/idpscherukupalli/hr/leaves", icon: FileText },
  { name: "Inventory", href: "/schools/idpscherukupalli/admin/inventory/assets", icon: Package },
  { name: "Messages", href: "/schools/idpscherukupalli/admin/communication/messages", icon: MessageSquare },
  { name: "Reports", href: "/schools/idpscherukupalli/admin/reports", icon: FileText },
  { name: "Settings", href: "/schools/idpscherukupalli/admin/settings", icon: Settings },
];
