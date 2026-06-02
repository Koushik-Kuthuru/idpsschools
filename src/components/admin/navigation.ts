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

// Build nav groups dynamically for any school
export function buildNavGroups(schoolId: string): NavGroup[] {
  const base = `/schools/${schoolId}/admin`;
  return [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      items: [{ name: "Dashboard", href: base, icon: LayoutDashboard }],
    },
    {
      id: "academic",
      name: "Academic",
      icon: GraduationCap,
      items: [
        { name: "Students",   href: `${base}/academic/students`,   icon: GraduationCap },
        { name: "Attendance", href: `${base}/academic/attendance`, icon: Calendar },
        { name: "Marks",      href: `${base}/academic/marks`,      icon: FileText },
        { name: "Subjects",   href: `${base}/academic/subjects`,   icon: BookOpen },
        { name: "Classes",    href: `${base}/academic/classes`,    icon: BookOpen },
        { name: "Timetable",  href: `${base}/academic/timetable`,  icon: Calendar },
        { name: "Calendar",   href: `${base}/academic/calendar`,   icon: CalendarDays },
      ],
    },
    {
      id: "staff_hr",
      name: "Staff & HR",
      icon: Users,
      items: [
        { name: "Teaching Staff",     href: `${base}/hr/teaching-staff`,     icon: Users },
        { name: "Non-Teaching Staff", href: `${base}/hr/non-teaching-staff`, icon: Users },
        { name: "Departments",        href: `${base}/hr/departments`,        icon: ClipboardList },
        { name: "Leaves",             href: `${base}/hr/leaves`,             icon: Calendar },
      ],
    },
    {
      id: "finance",
      name: "Finance",
      icon: Wallet,
      items: [
        { name: "Fees",               href: `${base}/finance/fees`,     icon: Wallet },
        { name: "Invoices",           href: `${base}/finance/invoices`, icon: Receipt },
        { name: "Payments",           href: `${base}/finance/payments`, icon: Wallet },
        { name: "Expenses",           href: `${base}/finance/expenses`, icon: Wallet },
        { name: "Payroll",            href: `${base}/finance/payroll`,  icon: Wallet },
        { name: "Financial Reports",  href: `${base}/finance/reports`,  icon: FileText },
      ],
    },
    {
      id: "inventory",
      name: "Inventory",
      icon: ClipboardList,
      items: [
        { name: "Stock",           href: `${base}/inventory/stock`,           icon: ClipboardList },
        { name: "Purchase Orders", href: `${base}/inventory/purchase-orders`, icon: ClipboardList },
        { name: "Assets",          href: `${base}/inventory/assets`,          icon: ClipboardList },
      ],
    },
    {
      id: "admission",
      name: "Admission",
      icon: ClipboardList,
      items: [
        { name: "Leads",        href: `${base}/admission/leads`,        icon: ClipboardList },
        { name: "Enquiries",    href: `${base}/admission/enquiries`,    icon: ClipboardList },
        { name: "Applications", href: `${base}/admission/applications`, icon: ClipboardList },
      ],
    },
    {
      id: "communication",
      name: "Communication",
      icon: MessageSquare,
      items: [
        { name: "Messages",      href: `${base}/communication/messages`, icon: MessageSquare },
        { name: "Notifications", href: `${base}/notifications`,          icon: FileText },
      ],
    },
    {
      id: "settings",
      name: "Settings",
      icon: Settings,
      items: [
        { name: "Profile",          href: `${base}/profile/settings`, icon: Users },
        { name: "Branch Settings",  href: `${base}/settings`,         icon: Settings },
      ],
    },
  ];
}

// Legacy static export kept for any direct imports — resolves to kalaburagi
export const navGroups: NavGroup[] = buildNavGroups("idpskalaburagi");
export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);
export const allNav = flatNav;
