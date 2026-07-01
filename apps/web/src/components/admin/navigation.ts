import { ROLE_NAV_GROUPS, type UserRole } from "@/lib/auth/roles";
import {
  BedDouble,
  BookOpen,
  Bus,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  User,
  UserCheck,
  Users,
  UtensilsCrossed,
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
      id: "transport",
      name: "Transport",
      icon: Bus,
      items: [
        { name: "Buses & Routes", href: `${base}/transport`, icon: Bus },
        { name: "Student List", href: `${base}/transport/students`, icon: Users },
        { name: "Drivers", href: `${base}/transport/drivers`, icon: User },
        { name: "Student Attendance", href: `${base}/transport/attendance`, icon: CalendarCheck },
      ],
    },
    {
      id: "hostel",
      name: "Hostel",
      icon: BedDouble,
      items: [
        { name: "Residents", href: `${base}/hostel/residents`, icon: Users },
        { name: "Rooms & Blocks", href: `${base}/hostel/rooms`, icon: Building2 },
        { name: "Attendance", href: `${base}/hostel/attendance`, icon: CalendarCheck },
        { name: "Visitors", href: `${base}/hostel/visitors`, icon: UserCheck },
        { name: "Fee Status", href: `${base}/hostel/fees`, icon: Wallet },
      ],
    },
    {
      id: "mess",
      name: "Mess",
      icon: UtensilsCrossed,
      items: [
        { name: "Menu", href: `${base}/mess/menu`, icon: CalendarDays },
        { name: "Meal Attendance", href: `${base}/mess/attendance`, icon: ClipboardList },
        { name: "Billing", href: `${base}/mess/billing`, icon: Receipt },
        { name: "Feedback", href: `${base}/mess/feedback`, icon: MessageSquare },
      ],
    },
    {
      id: "staff_hr",
      name: "Staff & HR",
      icon: Users,
      items: [
        { name: "Teaching Staff",     href: `${base}/hr/teaching-staff`,     icon: Users },
        { name: "Non-Teaching Staff", href: `${base}/hr/non-teaching-staff`, icon: Users },
        { name: "Attendance",         href: `${base}/hr/attendance`,         icon: CalendarCheck },
        { name: "Departments",        href: `${base}/hr/departments`,        icon: ClipboardList },
        { name: "Leaves",             href: `${base}/hr/leaves`,             icon: Calendar },
      ],
    },
    {
      id: "finance",
      name: "Finance",
      icon: Wallet,
      items: [
        { name: "Fees",               href: `${base}/finance/fees`,          icon: Wallet },
        { name: "Expenses",           href: `${base}/finance/expenses`,      icon: Wallet },
        { name: "Payroll",            href: `${base}/finance/payroll`,       icon: Wallet },
        { name: "Financial Reports",  href: `${base}/finance/reports`,       icon: FileText },
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
  ];
}

function isNavItemActive(pathname: string, href: string, dashboardHref: string) {
  return pathname === href || (href !== dashboardHref && pathname.startsWith(href));
}

export function getActiveNavGroup(pathname: string, schoolId: string): NavGroup | null {
  const groups = buildNavGroups(schoolId);
  const dashboardHref = `/schools/${schoolId}/admin`;
  return (
    groups.find((group) =>
      group.items.some((item) => isNavItemActive(pathname, item.href, dashboardHref))
    ) ?? null
  );
}

export function getNavGroupsForRole(schoolId: string, role: string | null): NavGroup[] {
  const all = buildNavGroups(schoolId);
  if (!role || role === "admin" || role === "super_admin") return all;

  const allowed = ROLE_NAV_GROUPS[role as UserRole];
  if (!allowed?.length) return all.filter((g) => g.id === "dashboard");

  return all.filter((g) => allowed.includes(g.id));
}

// Legacy static export kept for any direct imports — resolves to kalaburagi
export const navGroups: NavGroup[] = buildNavGroups("idpskalaburagi");
export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);
export const allNav = flatNav;
