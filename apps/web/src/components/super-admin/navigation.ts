import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  FileText, 
  Megaphone, 
  BarChart3,
  HelpCircle
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { name: "Branches", href: "/super-admin/branches", icon: Building2 },
  { name: "Users", href: "/super-admin/users", icon: Users },
  { name: "Announcements", href: "/super-admin/announcements", icon: Megaphone },
  { name: "Audit Logs", href: "/super-admin/audit-logs", icon: FileText },
  { name: "Settings", href: "/super-admin/settings", icon: Settings },
];

export const secondaryNav = [
  { name: "Reports", href: "/super-admin/reports", icon: BarChart3 },
  { name: "Help Center", href: "/super-admin/help", icon: HelpCircle },
];
