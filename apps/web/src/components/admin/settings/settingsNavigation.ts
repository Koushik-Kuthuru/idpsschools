import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  Globe,
  GraduationCap,
  LayoutGrid,
  ListTree,
  PlusCircle,
  Receipt,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export type InPageSectionKey =
  | "general"
  | "academic"
  | "exams"
  | "holidays"
  | "notifications"
  | "fee-heads"
  | "fee-types"
  | "class-fees"
  | "extra-fees"
  | "fee-receipt"
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
          key: "fee-heads",
          label: "Fee Head Master",
          desc: "Group fee items under academic, hostel & activity heads",
          icon: ListTree,
          href: `${base}?view=fee-heads`,
        },
        {
          key: "fee-types",
          label: "Standard Fee Items",
          desc: "Admission, tuition, hostel and other recurring fee lines",
          icon: Tags,
          href: `${base}?view=fee-types`,
        },
        {
          key: "class-fees",
          label: "Class Fee Structure",
          desc: "Month-wise default fees for each class or grade",
          icon: GraduationCap,
          href: `${base}?view=class-fees`,
        },
        {
          key: "extra-fees",
          label: "Additional Fees",
          desc: "Late fee per day, exam fee and other optional charges",
          icon: PlusCircle,
          href: `${base}?view=extra-fees`,
        },
        {
          key: "fee-receipt",
          label: "Receipt & Billing",
          desc: "Reminders and fee receipt letterhead template",
          icon: Receipt,
          href: `${base}?view=fee-receipt`,
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
          key: "fee-heads",
          title: "Fee Head Master",
          desc: "Organise fee items under heads such as Academic, Hostel and Activities.",
          icon: ListTree,
          href: `${base}?view=fee-heads`,
        },
        {
          key: "fee-types",
          title: "Standard Fee Items",
          desc: "Configure admission, tuition, hostel, laundry, Co-Spark and other standard lines.",
          icon: Tags,
          href: `${base}?view=fee-types`,
        },
        {
          key: "class-fees",
          title: "Class Fee Structure",
          desc: "Set month-wise default fee amounts for each class — applied to all students in that grade.",
          icon: GraduationCap,
          href: `${base}?view=class-fees`,
        },
        {
          key: "extra-fees",
          title: "Additional Fees",
          desc: "Late fee per day on the Late Fee row, plus exam fee and other optional charges.",
          icon: PlusCircle,
          href: `${base}?view=extra-fees`,
        },
        {
          key: "fee-receipt",
          title: "Receipt & Billing",
          desc: "Fee receipt letterhead, reminders and print preview.",
          icon: Receipt,
          href: `${base}?view=fee-receipt`,
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
  "fee-heads",
  "fee-types",
  "class-fees",
  "extra-fees",
  "fee-receipt",
  "staff",
  "integrations",
];

export function parseSettingsViewParam(view: string | null): ViewKey {
  if (!view || view === "home") return "home";
  if (view === "academic-years") return "home";
  if (view === "fees") return "fee-receipt";
  if (IN_PAGE_SECTION_KEYS.includes(view as InPageSectionKey)) return view as InPageSectionKey;
  return "home";
}

export type ViewKey = "home" | InPageSectionKey;

/** Settings views that need maximum horizontal space — inner sidebar starts minimized. */
const SETTINGS_SIDEBAR_COLLAPSED_VIEWS: InPageSectionKey[] = ["class-fees"];

export function shouldCollapseSettingsSidebar(view: ViewKey): boolean {
  return view !== "home" && SETTINGS_SIDEBAR_COLLAPSED_VIEWS.includes(view);
}
