import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  MessageSquare,
  CalendarDays,
  BookOpen,
  FileStack,
  type LucideIcon,
} from "lucide-react";
import { getTeacherNavIdsForDesignation, type TeacherNavId } from "@/lib/auth/roles";
import type { StaffPermissionContext } from "@/lib/resolveStaffPortalPermissions";
import { filterTeacherNavigationByPermissions } from "@/lib/resolveStaffPortalPermissions";

export type TeacherNavItem = {
  id: TeacherNavId;
  name: string;
  href: string;
  icon: LucideIcon;
};

const NAV_BUILDERS: Record<TeacherNavId, (base: string) => Omit<TeacherNavItem, "id">> = {
  dashboard: (base) => ({ name: "Dashboard", href: base, icon: LayoutDashboard }),
  students: (base) => ({ name: "Students", href: `${base}/students`, icon: GraduationCap }),
  attendance: (base) => ({ name: "Attendance", href: `${base}/attendance`, icon: Calendar }),
  homework: (base) => ({ name: "Homework", href: `${base}/homework`, icon: BookOpen }),
  materials: (base) => ({ name: "Study Materials", href: `${base}/materials`, icon: FileStack }),
  marks: (base) => ({ name: "Marks", href: `${base}/marks`, icon: ClipboardList }),
  calendar: (base) => ({ name: "Calendar", href: `${base}/calendar`, icon: CalendarDays }),
  timetable: (base) => ({ name: "Timetable", href: `${base}/timetable`, icon: Clock }),
  leaves: (base) => ({ name: "Leaves", href: `${base}/leaves`, icon: FileText }),
  messages: (base) => ({ name: "Messages", href: `${base}/messages`, icon: MessageSquare }),
};

export function getTeacherNavigation(
  schoolId: string,
  designation?: string | null,
  permissionContext?: StaffPermissionContext | null
): TeacherNavItem[] {
  const base = `/schools/${schoolId}/teachers`;
  const allowed = getTeacherNavIdsForDesignation(designation);
  const ids = allowed ?? (Object.keys(NAV_BUILDERS) as TeacherNavId[]);
  const items = ids.map((id) => ({ id, ...NAV_BUILDERS[id](base) }));

  if (permissionContext) {
    return filterTeacherNavigationByPermissions(items, permissionContext);
  }

  return items;
}

/** @deprecated Use getTeacherNavigation(schoolId) */
export const navigation = getTeacherNavigation("idpscherukupalli");
