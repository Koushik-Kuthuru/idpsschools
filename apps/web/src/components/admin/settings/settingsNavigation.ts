import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  Globe,
  GraduationCap,
  IndianRupee,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react";

export type InPageSectionKey =
  | "general"
  | "academic"
  | "exams"
  | "holidays"
  | "notifications"
  | "fees"
  | "staff"
  | "integrations";

export type SettingsNavKey = "home" | "academic-years" | InPageSectionKey;

export type SettingsNavItem = {
  key: SettingsNavKey;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** When set, navigates to this route instead of in-page view. */
  href?: string;
};

export type SettingsNavCategory = {
  label: string;
  items: SettingsNavItem[];
};

export type SettingsHomeItem = {
  key: SettingsNavKey;
  title: string;
  desc: string;
  icon: LucideIcon;
  href?: string;
};

export function settingsBasePath(schoolSlug: string) {
  return `/schools/${schoolSlug}/admin/settings`;
}

export function academicYearsPath(schoolSlug: string) {
  return `${settingsBasePath(schoolSlug)}/academic-years`;
}

export function buildSettingsNavCategories(schoolSlug: string): SettingsNavCategory[] {
  const base = settingsBasePath(schoolSlug);
  return [
    {
      label: "Overview",
      items: [
        {
          key: "home",
          label: "Settings Home",
          desc: "Browse all configuration areas",
          icon: LayoutGrid,
          href: base,
        },
      ],
    },
    {
      label: "Branch",
      items: [
        {
          key: "general",
          label: "General",
          desc: "Branch info & branding",
          icon: Building2,
          href: `${base}?view=general`,
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          key: "academic-years",
          label: "Academic Years",
          desc: "Create years & set active session",
          icon: Clock,
          href: academicYearsPath(schoolSlug),
        },
        {
          key: "academic",
          label: "Academic Settings",
          desc: "Grading system and timetable",
          icon: GraduationCap,
          href: `${base}?view=academic`,
        },
        {
          key: "exams",
          label: "Exams",
          desc: "Exam schedule types",
          icon: ClipboardList,
          href: `${base}?view=exams`,
        },
        {
          key: "holidays",
          label: "Holidays",
          desc: "Calendar & leave days",
          icon: CalendarDays,
          href: `${base}?view=holidays`,
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          key: "notifications",
          label: "Notifications",
          desc: "Alerts & digest settings",
          icon: Bell,
          href: `${base}?view=notifications`,
        },
        {
          key: "integrations",
          label: "Integrations",
          desc: "SMS & WhatsApp API credentials",
          icon: Globe,
          href: `${base}?view=integrations`,
        },
      ],
    },
    {
      label: "Finance & HR",
      items: [
        {
          key: "fees",
          label: "Fees",
          desc: "Billing & reminders",
          icon: IndianRupee,
          href: `${base}?view=fees`,
        },
        {
          key: "staff",
          label: "Staff Policy",
          desc: "Working hours & leaves",
          icon: Users,
          href: `${base}?view=staff`,
        },
      ],
    },
  ];
}

export function buildSettingsHomeCategories(schoolSlug: string): { label: string; items: SettingsHomeItem[] }[] {
  const yearsHref = academicYearsPath(schoolSlug);
  const base = settingsBasePath(schoolSlug);
  return [
    {
      label: "Branch",
      items: [
        {
          key: "general",
          title: "General Information",
          desc: "Branch name, contact details and branding.",
          icon: Building2,
          href: `${base}?view=general`,
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          key: "academic-years",
          title: "Academic Years",
          desc: "Create academic years and choose which session is active for this branch.",
          icon: Clock,
          href: yearsHref,
        },
        {
          key: "academic",
          title: "Academic Settings",
          desc: "Grading system, attendance threshold and timetable.",
          icon: GraduationCap,
          href: `${base}?view=academic`,
        },
        {
          key: "exams",
          title: "Exam Types",
          desc: "Define exam schedules and types for this branch.",
          icon: ClipboardList,
          href: `${base}?view=exams`,
        },
        {
          key: "holidays",
          title: "Holidays & Calendar",
          desc: "Public holidays, festivals and academic breaks.",
          icon: CalendarDays,
          href: `${base}?view=holidays`,
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          key: "notifications",
          title: "Notification Settings",
          desc: "Email, SMS, in-app alerts and daily digest.",
          icon: Bell,
          href: `${base}?view=notifications`,
        },
        {
          key: "integrations",
          title: "SMS & WhatsApp",
          desc: "Twilio credentials for automated messaging.",
          icon: Globe,
          href: `${base}?view=integrations`,
        },
      ],
    },
    {
      label: "Finance & HR",
      items: [
        {
          key: "fees",
          title: "Fee Configuration",
          desc: "Currency, late fees, gateway and reminders.",
          icon: IndianRupee,
          href: `${base}?view=fees`,
        },
        {
          key: "staff",
          title: "Staff Policies",
          desc: "Working hours, leave rules and weekly schedule.",
          icon: Users,
          href: `${base}?view=staff`,
        },
      ],
    },
  ];
}

export const IN_PAGE_SECTION_KEYS: InPageSectionKey[] = [
  "general",
  "academic",
  "exams",
  "holidays",
  "notifications",
  "fees",
  "staff",
  "integrations",
];

export function parseSettingsViewParam(view: string | null): ViewKey {
  if (!view || view === "home") return "home";
  if (view === "academic-years") return "home";
  if (IN_PAGE_SECTION_KEYS.includes(view as InPageSectionKey)) return view as InPageSectionKey;
  return "home";
}

export type ViewKey = "home" | InPageSectionKey;
