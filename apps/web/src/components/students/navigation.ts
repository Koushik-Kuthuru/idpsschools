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
  { name: "Dashboard", href: "/schools/idpskalaburagi/students", icon: LayoutDashboard },
  { name: "Students", href: "/schools/idpskalaburagi/students/academic/students", icon: GraduationCap },
  { name: "Teaching Staff", href: "/schools/idpskalaburagi/students/hr/teaching-staff", icon: Users },
  { name: "Finance", href: "/schools/idpskalaburagi/students/finance/fees", icon: Wallet },
  { name: "Reports", href: "/schools/idpskalaburagi/students/reports/analytics", icon: FileText },
];

export const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [{ name: "Dashboard", href: "/schools/idpskalaburagi/students", icon: LayoutDashboard }],
  },
  {
    id: "academic",
    name: "Academic",
    icon: GraduationCap,
    items: [
      { name: "Students", href: "/schools/idpskalaburagi/students/academic/students", icon: GraduationCap },
      { name: "Attendance", href: "/schools/idpskalaburagi/students/academic/attendance", icon: Calendar },
      { name: "Marks", href: "/schools/idpskalaburagi/students/academic/marks", icon: FileText },
      { name: "Subjects", href: "/schools/idpskalaburagi/students/academic/subjects", icon: BookOpen },
      { name: "Classes", href: "/schools/idpskalaburagi/students/academic/classes", icon: BookOpen },
      { name: "Timetable", href: "/schools/idpskalaburagi/students/academic/timetable", icon: Calendar },
      { name: "Calendar", href: "/schools/idpskalaburagi/students/academic/calendar", icon: CalendarDays },
    ],
  },
  {
    id: "staff_hr",
    name: "Staff & HR",
    icon: Users,
    items: [
      { name: "Teaching Staff", href: "/schools/idpskalaburagi/students/hr/teaching-staff", icon: Users },
      { name: "Non-Teaching Staff", href: "/schools/idpskalaburagi/students/hr/non-teaching-staff", icon: Users },
      { name: "Departments", href: "/schools/idpskalaburagi/students/hr/departments", icon: ClipboardList },
      { name: "Leaves", href: "/schools/idpskalaburagi/students/hr/leaves", icon: Calendar },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: Wallet,
    items: [
      { name: "Fees", href: "/schools/idpskalaburagi/students/finance/fees", icon: Wallet },
      { name: "Invoices", href: "/schools/idpskalaburagi/students/finance/invoices", icon: Receipt },
      { name: "Payments", href: "/schools/idpskalaburagi/students/finance/payments", icon: Wallet },
      { name: "Expenses", href: "/schools/idpskalaburagi/students/finance/expenses", icon: Wallet },
      { name: "Payroll", href: "/schools/idpskalaburagi/students/finance/payroll", icon: Wallet },
      { name: "Financial Reports", href: "/schools/idpskalaburagi/students/finance/reports", icon: FileText },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: ClipboardList,
    items: [
      { name: "Stock", href: "/schools/idpskalaburagi/students/inventory/stock", icon: ClipboardList },
      { name: "Purchase Orders", href: "/schools/idpskalaburagi/students/inventory/purchase-orders", icon: ClipboardList },
      { name: "Assets", href: "/schools/idpskalaburagi/students/inventory/assets", icon: ClipboardList },
    ],
  },
  {
    id: "admission",
    name: "Admission",
    icon: ClipboardList,
    items: [
      { name: "Leads", href: "/schools/idpskalaburagi/students/admission/leads", icon: ClipboardList },
      { name: "Enquiries", href: "/schools/idpskalaburagi/students/admission/enquiries", icon: ClipboardList },
      { name: "Applications", href: "/schools/idpskalaburagi/students/admission/applications", icon: ClipboardList },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    items: [
      { name: "Messages", href: "/schools/idpskalaburagi/students/communication/messages", icon: MessageSquare },
      { name: "Notifications", href: "/schools/idpskalaburagi/students/notifications", icon: FileText },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    items: [
      { name: "Profile", href: "/schools/idpskalaburagi/students/profile/settings", icon: Users },
      { name: "Branch Settings", href: "/schools/idpskalaburagi/students/settings", icon: Settings },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);

export const allNav = flatNav;
