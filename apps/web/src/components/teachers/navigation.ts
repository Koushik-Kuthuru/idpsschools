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
  { name: "Dashboard", href: "/schools/idpskalaburagi/teachers", icon: LayoutDashboard },
  { name: "Students", href: "/schools/idpskalaburagi/teachers/academic/students", icon: GraduationCap },
  { name: "Teaching Staff", href: "/schools/idpskalaburagi/teachers/hr/teaching-staff", icon: Users },
  { name: "Finance", href: "/schools/idpskalaburagi/teachers/finance/fees", icon: Wallet },
  { name: "Reports", href: "/schools/idpskalaburagi/teachers/reports/analytics", icon: FileText },
];

export const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [{ name: "Dashboard", href: "/schools/idpskalaburagi/teachers", icon: LayoutDashboard }],
  },
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    items: [
      { name: "Students", href: "/schools/idpskalaburagi/teachers/academic/students", icon: GraduationCap },
      { name: "Attendance", href: "/schools/idpskalaburagi/teachers/academic/attendance", icon: Calendar },
      { name: "Marks", href: "/schools/idpskalaburagi/teachers/academic/marks", icon: FileText },
      { name: "Subjects", href: "/schools/idpskalaburagi/teachers/academic/subjects", icon: BookOpen },
      { name: "Classes", href: "/schools/idpskalaburagi/teachers/academic/classes", icon: BookOpen },
      { name: "Timetable", href: "/schools/idpskalaburagi/teachers/academic/timetable", icon: Calendar },
      { name: "Calendar", href: "/schools/idpskalaburagi/teachers/academic/calendar", icon: CalendarDays },
    ],
  },
  {
    id: "staff_hr",
    name: "Staff & HR",
    icon: Users,
    items: [
      { name: "Teaching Staff", href: "/schools/idpskalaburagi/teachers/hr/teaching-staff", icon: Users },
      { name: "Non-Teaching Staff", href: "/schools/idpskalaburagi/teachers/hr/non-teaching-staff", icon: Users },
      { name: "Departments", href: "/schools/idpskalaburagi/teachers/hr/departments", icon: ClipboardList },
      { name: "Leaves", href: "/schools/idpskalaburagi/teachers/hr/leaves", icon: Calendar },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Fees", href: "/schools/idpskalaburagi/teachers/finance/fees", icon: Wallet },
      { name: "Invoices", href: "/schools/idpskalaburagi/teachers/finance/invoices", icon: Receipt },
      { name: "Payments", href: "/schools/idpskalaburagi/teachers/finance/payments", icon: Wallet },
      { name: "Expenses", href: "/schools/idpskalaburagi/teachers/finance/expenses", icon: Wallet },
      { name: "Payroll", href: "/schools/idpskalaburagi/teachers/finance/payroll", icon: Wallet },
      { name: "Financial Reports", href: "/schools/idpskalaburagi/teachers/finance/reports", icon: FileText },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: ClipboardList,
    items: [
      { name: "Stock", href: "/schools/idpskalaburagi/teachers/inventory/stock", icon: ClipboardList },
      { name: "Purchase Orders", href: "/schools/idpskalaburagi/teachers/inventory/purchase-orders", icon: ClipboardList },
      { name: "Assets", href: "/schools/idpskalaburagi/teachers/inventory/assets", icon: ClipboardList },
    ],
  },
  {
    id: "admission",
    name: "Admission",
    icon: ClipboardList,
    items: [
      { name: "Leads", href: "/schools/idpskalaburagi/teachers/admission/leads", icon: ClipboardList },
      { name: "Enquiries", href: "/schools/idpskalaburagi/teachers/admission/enquiries", icon: ClipboardList },
      { name: "Applications", href: "/schools/idpskalaburagi/teachers/admission/applications", icon: ClipboardList },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    items: [
      { name: "Messages", href: "/schools/idpskalaburagi/teachers/communication/messages", icon: MessageSquare },
      { name: "Notifications", href: "/schools/idpskalaburagi/teachers/notifications", icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    items: [
      { name: "Profile", href: "/schools/idpskalaburagi/teachers/profile/settings", icon: Users },
      { name: "Branch Settings", href: "/schools/idpskalaburagi/teachers/settings", icon: Settings },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const allNav = flatNav;
