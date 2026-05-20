import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  name: string;
  href: string;
  icon: any;
};

export type NavGroup = {
  id: string;
  name: string;
  icon: any;
  items: NavItem[];
};

export const topNav = [
  { name: "Dashboard", href: "/idpskalaburagi/students", icon: LayoutDashboard },
  { name: "Students", href: "/idpskalaburagi/students/academic/students", icon: GraduationCap },
  { name: "Teaching Staff", href: "/idpskalaburagi/students/hr/teaching-staff", icon: Users },
  { name: "Finance", href: "/idpskalaburagi/students/finance/fees", icon: Wallet },
  { name: "Reports", href: "/idpskalaburagi/students/reports/analytics", icon: FileText },
];

export const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [{ name: "Dashboard", href: "/idpskalaburagi/students", icon: LayoutDashboard }],
  },
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    items: [
      { name: "Students", href: "/idpskalaburagi/students/academic/students", icon: GraduationCap },
      { name: "Attendance", href: "/idpskalaburagi/students/academic/attendance", icon: Calendar },
      { name: "Marks", href: "/idpskalaburagi/students/academic/marks", icon: FileText },
      { name: "Subjects", href: "/idpskalaburagi/students/academic/subjects", icon: BookOpen },
      { name: "Classes", href: "/idpskalaburagi/students/academic/classes", icon: BookOpen },
      { name: "Timetable", href: "/idpskalaburagi/students/academic/timetable", icon: Calendar },
      { name: "Calendar", href: "/idpskalaburagi/students/academic/calendar", icon: CalendarDays },
    ],
  },
  {
    id: "staff_hr",
    name: "Staff & HR",
    icon: Users,
    items: [
      { name: "Teaching Staff", href: "/idpskalaburagi/students/hr/teaching-staff", icon: Users },
      { name: "Non-Teaching Staff", href: "/idpskalaburagi/students/hr/non-teaching-staff", icon: Users },
      { name: "Departments", href: "/idpskalaburagi/students/hr/departments", icon: ClipboardList },
      { name: "Leaves", href: "/idpskalaburagi/students/hr/leaves", icon: Calendar },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Fees", href: "/idpskalaburagi/students/finance/fees", icon: Wallet },
      { name: "Invoices", href: "/idpskalaburagi/students/finance/invoices", icon: Receipt },
      { name: "Payments", href: "/idpskalaburagi/students/finance/payments", icon: Wallet },
      { name: "Expenses", href: "/idpskalaburagi/students/finance/expenses", icon: Wallet },
      { name: "Payroll", href: "/idpskalaburagi/students/finance/payroll", icon: Wallet },
      { name: "Financial Reports", href: "/idpskalaburagi/students/finance/reports", icon: FileText },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: ClipboardList,
    items: [
      { name: "Stock", href: "/idpskalaburagi/students/inventory/stock", icon: ClipboardList },
      { name: "Purchase Orders", href: "/idpskalaburagi/students/inventory/purchase-orders", icon: ClipboardList },
      { name: "Assets", href: "/idpskalaburagi/students/inventory/assets", icon: ClipboardList },
    ],
  },
  {
    id: "admission",
    name: "Admission",
    icon: ClipboardList,
    items: [
      { name: "Leads", href: "/idpskalaburagi/students/admission/leads", icon: ClipboardList },
      { name: "Enquiries", href: "/idpskalaburagi/students/admission/enquiries", icon: ClipboardList },
      { name: "Applications", href: "/idpskalaburagi/students/admission/applications", icon: ClipboardList },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    items: [
      { name: "Messages", href: "/idpskalaburagi/students/communication/messages", icon: MessageSquare },
      { name: "Notifications", href: "/idpskalaburagi/students/notifications", icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    items: [
      { name: "Profile", href: "/idpskalaburagi/students/profile/settings", icon: Users },
      { name: "Branch Settings", href: "/idpskalaburagi/students/settings", icon: Settings },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const allNav = flatNav;
