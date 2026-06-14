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
  { name: "Dashboard", href: "/schools/idpscherukupalli/teachers", icon: LayoutDashboard },
  { name: "Students", href: "/schools/idpscherukupalli/teachers/students", icon: GraduationCap },
  { name: "Employees", href: "/schools/idpscherukupalli/teachers/employees", icon: Users },
  { name: "Classes", href: "/schools/idpscherukupalli/teachers/classes", icon: BookOpen },
  { name: "Attendance", href: "/schools/idpscherukupalli/teachers/attendance", icon: Calendar },
  { name: "Marks", href: "/schools/idpscherukupalli/teachers/marks", icon: ClipboardList },
  { name: "Calendar", href: "/schools/idpscherukupalli/teachers/academic/calendar", icon: CalendarDays },
  { name: "Timetable", href: "/schools/idpscherukupalli/teachers/academic/timetable", icon: Clock },
  { name: "Finance", href: "/schools/idpscherukupalli/teachers/finance/fees", icon: Wallet },
  { name: "Leaves", href: "/schools/idpscherukupalli/teachers/hr/leaves", icon: FileText },
  { name: "Inventory", href: "/schools/idpscherukupalli/teachers/inventory/assets", icon: Package },
  { name: "Messages", href: "/schools/idpscherukupalli/teachers/communication/messages", icon: MessageSquare },
  { name: "Reports", href: "/schools/idpscherukupalli/teachers/reports", icon: FileText },
  { name: "Settings", href: "/schools/idpscherukupalli/teachers/settings", icon: Settings },
];
