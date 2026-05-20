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
  { name: "Dashboard", href: "/idpskalaburagi/teachers", icon: LayoutDashboard },
  { name: "Students", href: "/idpskalaburagi/teachers/academic/students", icon: GraduationCap },
  { name: "Teaching Staff", href: "/idpskalaburagi/teachers/hr/teaching-staff", icon: Users },
  { name: "Finance", href: "/idpskalaburagi/teachers/finance/fees", icon: Wallet },
  { name: "Reports", href: "/idpskalaburagi/teachers/reports/analytics", icon: FileText },
];

export const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [{ name: "Dashboard", href: "/idpskalaburagi/teachers", icon: LayoutDashboard }],
  },
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    items: [
      { name: "Students", href: "/idpskalaburagi/teachers/academic/students", icon: GraduationCap },
      { name: "Attendance", href: "/idpskalaburagi/teachers/academic/attendance", icon: Calendar },
      { name: "Marks", href: "/idpskalaburagi/teachers/academic/marks", icon: FileText },
      { name: "Subjects", href: "/idpskalaburagi/teachers/academic/subjects", icon: BookOpen },
      { name: "Classes", href: "/idpskalaburagi/teachers/academic/classes", icon: BookOpen },
      { name: "Timetable", href: "/idpskalaburagi/teachers/academic/timetable", icon: Calendar },
      { name: "Calendar", href: "/idpskalaburagi/teachers/academic/calendar", icon: CalendarDays },
    ],
  },
  {
    id: "staff_hr",
    name: "Staff & HR",
    icon: Users,
    items: [
      { name: "Teaching Staff", href: "/idpskalaburagi/teachers/hr/teaching-staff", icon: Users },
      { name: "Non-Teaching Staff", href: "/idpskalaburagi/teachers/hr/non-teaching-staff", icon: Users },
      { name: "Departments", href: "/idpskalaburagi/teachers/hr/departments", icon: ClipboardList },
      { name: "Leaves", href: "/idpskalaburagi/teachers/hr/leaves", icon: Calendar },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Fees", href: "/idpskalaburagi/teachers/finance/fees", icon: Wallet },
      { name: "Invoices", href: "/idpskalaburagi/teachers/finance/invoices", icon: Receipt },
      { name: "Payments", href: "/idpskalaburagi/teachers/finance/payments", icon: Wallet },
      { name: "Expenses", href: "/idpskalaburagi/teachers/finance/expenses", icon: Wallet },
      { name: "Payroll", href: "/idpskalaburagi/teachers/finance/payroll", icon: Wallet },
      { name: "Financial Reports", href: "/idpskalaburagi/teachers/finance/reports", icon: FileText },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: ClipboardList,
    items: [
      { name: "Stock", href: "/idpskalaburagi/teachers/inventory/stock", icon: ClipboardList },
      { name: "Purchase Orders", href: "/idpskalaburagi/teachers/inventory/purchase-orders", icon: ClipboardList },
      { name: "Assets", href: "/idpskalaburagi/teachers/inventory/assets", icon: ClipboardList },
    ],
  },
  {
    id: "admission",
    name: "Admission",
    icon: ClipboardList,
    items: [
      { name: "Leads", href: "/idpskalaburagi/teachers/admission/leads", icon: ClipboardList },
      { name: "Enquiries", href: "/idpskalaburagi/teachers/admission/enquiries", icon: ClipboardList },
      { name: "Applications", href: "/idpskalaburagi/teachers/admission/applications", icon: ClipboardList },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    items: [
      { name: "Messages", href: "/idpskalaburagi/teachers/communication/messages", icon: MessageSquare },
      { name: "Notifications", href: "/idpskalaburagi/teachers/notifications", icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    items: [
      { name: "Profile", href: "/idpskalaburagi/teachers/profile/settings", icon: Users },
      { name: "Branch Settings", href: "/idpskalaburagi/teachers/settings", icon: Settings },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const allNav = flatNav;
