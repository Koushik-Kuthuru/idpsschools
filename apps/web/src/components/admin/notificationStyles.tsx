import {
  Bell,
  ClipboardList,
  GraduationCap,
  Settings2,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NotificationCategory } from "@/lib/adminNotifications";

export function notificationIcon(category: NotificationCategory): LucideIcon {
  if (category === "Finance") return Wallet;
  if (category === "Admission") return ClipboardList;
  if (category === "HR") return Users;
  if (category === "Academic") return GraduationCap;
  if (category === "Attendance") return ShieldAlert;
  if (category === "Settings") return Settings2;
  if (category === "Admin") return Users;
  return Bell;
}

export function notificationIconStyles(category: NotificationCategory) {
  if (category === "Finance") {
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  }
  if (category === "Admission") {
    return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", badge: "bg-blue-50 text-blue-700 border-blue-100" };
  }
  if (category === "HR" || category === "Admin") {
    return { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", badge: "bg-violet-50 text-violet-700 border-violet-100" };
  }
  if (category === "Academic") {
    return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", badge: "bg-sky-50 text-sky-700 border-sky-100" };
  }
  if (category === "Attendance") {
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", badge: "bg-amber-50 text-amber-800 border-amber-100" };
  }
  if (category === "Settings") {
    return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", badge: "bg-gray-50 text-gray-700 border-gray-200" };
  }
  return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", badge: "bg-slate-100 text-slate-700 border-slate-200" };
}
