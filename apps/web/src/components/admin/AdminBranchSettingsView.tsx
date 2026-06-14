"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBranch } from "@/components/admin/BranchContext";
import SettingsPageShell from "@/components/admin/settings/SettingsPageShell";
import { AdminNotificationsProvider } from "@/contexts/AdminNotificationsContext";
import {
  Bell, Building2, CalendarDays, ChevronRight, GraduationCap,
  IndianRupee, LayoutGrid, Plus, ShieldCheck, SlidersHorizontal, Users,
  ClipboardList, Trash2, Save, RefreshCw, Camera,
  CheckCircle2, Globe, Clock,
} from "lucide-react";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

import { type LucideIcon } from "lucide-react";

type SectionKey = "general" | "academic" | "exams" | "holidays" | "notifications" | "fees" | "staff" | "integrations";
type ViewKey = "home" | SectionKey;

type NavItem = { key: ViewKey; label: string; desc: string; icon: LucideIcon };
type NavCategory = { label: string; items: NavItem[] };
type HomeCategory = { label: string; items: { key: SectionKey; title: string; desc: string; icon: LucideIcon }[] };

const sections: { key: SectionKey; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "general",       label: "General",       desc: "Branch info & branding",     icon: Building2 },
  { key: "academic",      label: "Academic",      desc: "Sessions & grading",          icon: GraduationCap },
  { key: "exams",         label: "Exams",         desc: "Exam schedule types",         icon: ClipboardList },
  { key: "holidays",      label: "Holidays",      desc: "Calendar & leave days",       icon: CalendarDays },
  { key: "notifications", label: "Notifications", desc: "Alerts & digest settings",    icon: Bell },
  { key: "fees",          label: "Fees",          desc: "Billing & reminders",         icon: IndianRupee },
  { key: "staff",         label: "Staff Policy",  desc: "Working hours & leaves",      icon: Users },
  { key: "integrations",  label: "Integrations",  desc: "SMS & WhatsApp API credentials", icon: Globe },
];

const sectionColors: Record<SectionKey, { bg: string; text: string; ring: string }> = {
  general:       { bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200"  },
  academic:      { bg: "bg-blue-50",     text: "text-blue-700",     ring: "ring-blue-200"     },
  exams:         { bg: "bg-purple-50",   text: "text-purple-700",   ring: "ring-purple-200"   },
  holidays:      { bg: "bg-orange-50",   text: "text-orange-600",   ring: "ring-orange-200"   },
  notifications: { bg: "bg-amber-50",    text: "text-amber-600",    ring: "ring-amber-200"    },
  fees:          { bg: "bg-teal-50",     text: "text-teal-700",     ring: "ring-teal-200"     },
  staff:         { bg: "bg-violet-50",   text: "text-violet-700",   ring: "ring-violet-200"   },
  integrations:  { bg: "bg-rose-50",     text: "text-rose-700",     ring: "ring-rose-200"     },
};

const homeCategories: HomeCategory[] = [
  {
    label: "Branch",
    items: [
      { key: "general", title: "General Information", desc: "Branch name, contact details and branding.", icon: Building2 },
    ],
  },
  {
    label: "Academic",
    items: [
      { key: "academic", title: "Academic Settings", desc: "Sessions, grading system and timetable.", icon: GraduationCap },
      { key: "exams", title: "Exam Types", desc: "Define exam schedules and types for this branch.", icon: ClipboardList },
      { key: "holidays", title: "Holidays & Calendar", desc: "Public holidays, festivals and academic breaks.", icon: CalendarDays },
    ],
  },
  {
    label: "Communication",
    items: [
      { key: "notifications", title: "Notification Settings", desc: "Email, SMS, in-app alerts and daily digest.", icon: Bell },
      { key: "integrations", title: "SMS & WhatsApp", desc: "Twilio credentials for automated messaging.", icon: Globe },
    ],
  },
  {
    label: "Finance & HR",
    items: [
      { key: "fees", title: "Fee Configuration", desc: "Currency, late fees, gateway and reminders.", icon: IndianRupee },
      { key: "staff", title: "Staff Policies", desc: "Working hours, leave rules and weekly schedule.", icon: Users },
    ],
  },
];

function buildNavCategories(): NavCategory[] {
  const sectionMap = Object.fromEntries(sections.map((s) => [s.key, s])) as Record<SectionKey, (typeof sections)[number]>;
  return [
    {
      label: "Overview",
      items: [{ key: "home", label: "Settings Home", desc: "Browse all configuration areas", icon: LayoutGrid }],
    },
    {
      label: "Branch",
      items: [
        {
          key: "general",
          label: sectionMap.general.label,
          desc: sectionMap.general.desc,
          icon: sectionMap.general.icon,
        },
      ],
    },
    {
      label: "Academic",
      items: [sectionMap.academic, sectionMap.exams, sectionMap.holidays].map((s) => ({
        key: s.key as ViewKey,
        label: s.label,
        desc: s.desc,
        icon: s.icon,
      })),
    },
    {
      label: "Communication",
      items: [sectionMap.notifications, sectionMap.integrations].map((s) => ({
        key: s.key as ViewKey,
        label: s.label,
        desc: s.desc,
        icon: s.icon,
      })),
    },
    {
      label: "Finance & HR",
      items: [sectionMap.fees, sectionMap.staff].map((s) => ({
        key: s.key as ViewKey,
        label: s.label,
        desc: s.desc,
        icon: s.icon,
      })),
    },
  ];
}

function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-[#144835]/20 hover:shadow-[0_4px_12px_rgba(20,72,53,0.06)] transition-all">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
        checked ? "bg-[#144835]" : "bg-gray-200"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

function SectionHeader({ sectionKey, title, subtitle, onSave, saving }: {
  sectionKey: SectionKey; title: string; subtitle: string;
  onSave?: () => void; saving?: boolean;
}) {
  const c = sectionColors[sectionKey];
  const Icon = sections.find(s => s.key === sectionKey)!.icon as LucideIcon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center ring-4", c.bg, c.text, c.ring)}>
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {onSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className="h-9 px-5 inline-flex items-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-lg shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-60"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          Save Changes
        </button>
      )}
    </div>
  );
}

export default function AdminBranchSettingsView() {
  const { activeBranch } = useBranch();
  const schoolId = activeBranch.id;

  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const sidebarExpanded = isSidebarOpen || mobileNavOpen;

  const navCategories = useMemo(() => buildNavCategories(), []);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNavCategories = useMemo(() => {
    if (!normalizedQuery) return navCategories;
    return navCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedQuery) ||
            item.desc.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [navCategories, normalizedQuery]);

  const filteredHomeCategories = useMemo(() => {
    if (!normalizedQuery) return homeCategories;
    return homeCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.desc.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [normalizedQuery]);

  const openView = (key: ViewKey) => {
    setActiveView(key);
    setMobileNavOpen(false);
  };

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // ── General ─────────────────────────────────────────────────────────────────
  const [branchDetails, setBranchDetails] = useState({
    name: activeBranch.name || "", code: "", principal: "",
    phone: "", email: "", address: activeBranch.city || "", logo: "", status: "Active",
  });
  const [savingGeneral, setSavingGeneral] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Exams ────────────────────────────────────────────────────────────────────
  const [exams, setExams] = useState<{ id: string; name: string; startDate?: string; endDate?: string }[]>([]);
  const [newExamName, setNewExamName] = useState("");
  const [newExamStart, setNewExamStart] = useState("");
  const [newExamEnd, setNewExamEnd] = useState("");
  const [savingExams, setSavingExams] = useState(false);

  // ── Sessions ─────────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<{ id: string; year: string; isActive: boolean }[]>([]);
  const [newSessionYear, setNewSessionYear] = useState("");

  // ── Holidays ─────────────────────────────────────────────────────────────────
  const [holidays, setHolidays] = useState<{ id: string; name: string; date: string; type: string }[]>([]);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayEnd, setNewHolidayEnd] = useState("");
  const [newHolidayType, setNewHolidayType] = useState("Public Holiday");

  // ── Notifications toggles ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({ email: true, sms: false, inApp: true, digest: true });

  // ── Twilio Credentials ────────────────────────────────────────────────────────
  const [twilioCreds, setTwilioCreds] = useState({
    accountSid: "",
    authToken: "",
    fromSms: "",
    fromWhatsapp: "whatsapp:+14155238886",
    testPhone: "",
  });

  // ── Persist ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return;
    const load = (key: string, setter: (v: any) => void) => {
      const raw = localStorage.getItem(`${key}_${schoolId}`);
      if (raw) try { setter(JSON.parse(raw)); } catch {}
    };
    load("branchDetails", setBranchDetails);
    load("exams", setExams);
    load("sessions", setSessions);
    load("holidays", setHolidays);
    load("notifs", setNotifs);
    load("twilioCreds", setTwilioCreds);
  }, [schoolId]);

  useEffect(() => { localStorage.setItem(`branchDetails_${schoolId}`, JSON.stringify(branchDetails)); }, [branchDetails, schoolId]);
  useEffect(() => { localStorage.setItem(`exams_${schoolId}`, JSON.stringify(exams)); }, [exams, schoolId]);
  useEffect(() => { localStorage.setItem(`sessions_${schoolId}`, JSON.stringify(sessions)); }, [sessions, schoolId]);
  useEffect(() => { localStorage.setItem(`holidays_${schoolId}`, JSON.stringify(holidays)); }, [holidays, schoolId]);
  useEffect(() => { localStorage.setItem(`notifs_${schoolId}`, JSON.stringify(notifs)); }, [notifs, schoolId]);
  useEffect(() => { localStorage.setItem(`twilioCreds_${schoolId}`, JSON.stringify(twilioCreds)); }, [twilioCreds, schoolId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveGeneral = () => {
    setSavingGeneral(true);
    setTimeout(() => { setSavingGeneral(false); showSaved(); }, 600);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBranchDetails(p => ({ ...p, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAddExam = () => {
    if (!newExamName.trim() || !newExamStart) return;
    setSavingExams(true);
    setExams(p => [...p, {
      id: Date.now().toString(), name: newExamName.trim(),
      startDate: newExamStart, endDate: newExamEnd || newExamStart,
    }]);
    setNewExamName(""); setNewExamStart(""); setNewExamEnd("");
    setTimeout(() => setSavingExams(false), 300);
  };

  const handleAddSession = () => {
    const y = newSessionYear.trim();
    if (!y) return;
    setSessions(p => [...p, { id: Date.now().toString(), year: y, isActive: false }].sort((a, b) => a.year.localeCompare(b.year)));
    setNewSessionYear("");
  };

  const handleToggleSession = (id: string, next: boolean) => {
    setSessions(p => p.map(s =>
      next ? { ...s, isActive: s.id === id } : s.id === id ? { ...s, isActive: false } : s
    ));
  };

  const handleAddHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    const start = new Date(`${newHolidayDate}T00:00:00`);
    const end = new Date(`${newHolidayEnd || newHolidayDate}T00:00:00`);
    const days: typeof holidays = [];
    for (const c = new Date(start <= end ? start : end); c <= (start <= end ? end : start); c.setDate(c.getDate() + 1)) {
      days.push({ id: Date.now() + Math.random() + "", name: newHolidayName.trim(), date: c.toISOString().slice(0, 10), type: newHolidayType });
    }
    setHolidays(p => [...p, ...days].sort((a, b) => a.date.localeCompare(b.date)));
    setNewHolidayName(""); setNewHolidayDate(""); setNewHolidayEnd("");
  };

  const activeSessionYears = useMemo(() => sessions.filter(s => s.isActive).map(s => s.year), [sessions]);

  const inputCls = "w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm transition-all placeholder:text-gray-400";
  const selectCls = "w-full h-9 appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] shadow-sm cursor-pointer";


  const settingsSidebar = (
    <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3" aria-label="Settings navigation">
      {filteredNavCategories.map((category) => (
        <div key={category.label}>
          {sidebarExpanded ? (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {category.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {category.items.map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => openView(item.key)}
                  title={!sidebarExpanded ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center rounded-lg text-[13px] font-medium transition-colors",
                    sidebarExpanded ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
                    active
                      ? "bg-[#144835]/8 text-[#144835]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    size={16}
                    className={cn("shrink-0", active ? "text-[#144835]" : "text-gray-400")}
                  />
                  {sidebarExpanded ? <span className="truncate text-left">{item.label}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <AdminNotificationsProvider>
      <SettingsPageShell
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        saved={saved}
        sidebar={settingsSidebar}
      >
          {activeView === "home" ? (
            <div className="px-6 py-8 sm:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Setup Home</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
                  Configure your {activeBranch.name} workspace — branch details, academics, communication, fees and staff policies.
                </p>
              </div>

              {filteredHomeCategories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <p className="text-sm font-semibold text-gray-700">No settings match your search</p>
                  <p className="mt-1 text-xs text-gray-400">Try a different keyword</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {filteredHomeCategories.map((category) => (
                    <section key={category.label}>
                      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {category.label}
                      </h2>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {category.items.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => openView(item.key)}
                            className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 text-left transition-all hover:border-[#144835]/25 hover:shadow-[0_4px_20px_rgba(20,72,53,0.08)]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#144835]/10 text-[#144835]">
                              <item.icon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.desc}</p>
                            </div>
                            <ChevronRight
                              size={16}
                              className="shrink-0 text-gray-300 transition-colors group-hover:text-[#144835]"
                            />
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-8 sm:px-8">
              <button
                type="button"
                onClick={() => openView("home")}
                className="mb-5 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-[#144835]"
              >
                <ChevronRight size={14} className="rotate-180" />
                Settings Home
              </button>
              <div className="rounded-xl border border-gray-200/80 bg-white p-6 min-h-[500px] shadow-sm sm:p-8">

            {/* ════ GENERAL ════ */}
            {activeView === "general" && (
              <div>
                <SectionHeader sectionKey="general" title="General Information"
                  subtitle="Branch name, contact details and branding"
                  onSave={handleSaveGeneral} saving={savingGeneral} />

                {/* Logo upload */}
                <div className="flex items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-dashed border-gray-200 mb-6">
                  <div className="relative group shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-white border-2 border-gray-100 shadow-md flex items-center justify-center overflow-hidden">
                      {branchDetails.logo
                        ? <img src={branchDetails.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                        : <Building2 size={28} className="text-gray-300" />}
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} type="button"
                      className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-[#144835] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera size={12} />
                    </button>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Branch Logo</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-xs">Upload a high-resolution PNG or JPG. Displayed in the sidebar, reports, and invoices.</p>
                    <button onClick={() => logoInputRef.current?.click()} type="button"
                      className="mt-2.5 text-xs font-bold text-[#144835] hover:underline">
                      Change Image
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { label: "Branch Name",  key: "name",      type: "text",  placeholder: "e.g. IDPS Kalaburagi" },
                    { label: "Branch Code",  key: "code",      type: "text",  placeholder: "e.g. IDPS-KLB" },
                    { label: "Principal",    key: "principal", type: "text",  placeholder: "Full name" },
                    { label: "Phone",        key: "phone",     type: "tel",   placeholder: "+91 98765 43210" },
                    { label: "Email",        key: "email",     type: "email", placeholder: "branch@school.edu" },
                    { label: "Address",      key: "address",   type: "text",  placeholder: "Street, City, State" },
                  ] as const).map((f) => (
                    <FieldCard key={f.key} label={f.label}>
                      <input
                        type={f.type}
                        value={(branchDetails as any)[f.key]}
                        placeholder={f.placeholder}
                        onChange={e => setBranchDetails(p => ({ ...p, [f.key]: e.target.value }))}
                        className={inputCls}
                      />
                    </FieldCard>
                  ))}

                  <div className="md:col-span-2">
                    <FieldCard label="Branch Status">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{branchDetails.status}</p>
                            <p className="text-xs text-gray-500">Branch is live and accepting data</p>
                          </div>
                        </div>
                        <button type="button" className="h-8 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                          <SlidersHorizontal size={13} /> Advanced
                        </button>
                      </div>
                    </FieldCard>
                  </div>
                </div>
              </div>
            )}


            {/* ════ ACADEMIC ════ */}
            {activeView === "academic" && (
              <div>
                <SectionHeader sectionKey="academic" title="Academic Settings"
                  subtitle="Session management, grading and timetable" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left — form fields */}
                  <div className="space-y-4">
                    <FieldCard label="Default Session">
                      <div className="relative">
                        <select className={selectCls}>
                          {activeSessionYears.length > 0
                            ? activeSessionYears.map(y => <option key={y}>{y}</option>)
                            : <option>No active session</option>}
                        </select>
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                      </div>
                    </FieldCard>
                    <FieldCard label="Grading System">
                      <div className="relative">
                        <select className={selectCls}>
                          <option>GPA (10 Point)</option>
                          <option>Percentage</option>
                          <option>CBSE Grades</option>
                        </select>
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                      </div>
                    </FieldCard>
                    <FieldCard label="Attendance Threshold">
                      <input className={inputCls} defaultValue="80%" />
                    </FieldCard>
                    <FieldCard label="Timetable Version">
                      <input className={inputCls} defaultValue="2025-T1" />
                    </FieldCard>
                  </div>

                  {/* Right — sessions table */}
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-3">Academic Year Sessions</p>
                    <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                      <div className="bg-[#144835]/5 border-b border-[#144835]/10 px-4 py-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#144835]">Sessions</p>
                      </div>
                      {sessions.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">No sessions added yet</div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50/60">
                            <tr>
                              <th className="px-4 py-2 text-xs font-bold text-gray-500 text-left">#</th>
                              <th className="px-4 py-2 text-xs font-bold text-gray-500 text-left">Year</th>
                              <th className="px-4 py-2 text-xs font-bold text-gray-500 text-left">Status</th>
                              <th className="px-4 py-2 text-xs font-bold text-gray-500 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {sessions.map((s, i) => (
                              <tr key={s.id} className="bg-white hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-2.5 text-xs text-gray-400 font-bold">{i + 1}</td>
                                <td className="px-4 py-2.5 text-xs font-bold text-gray-900">{s.year}</td>
                                <td className="px-4 py-2.5">
                                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                                    s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                                    {s.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <Toggle checked={s.isActive} onChange={(v) => handleToggleSession(s.id, v)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={newSessionYear}
                        onChange={e => setNewSessionYear(e.target.value)}
                        placeholder="e.g. 2026-2027"
                        className={cn(inputCls, "flex-1")}
                        onKeyDown={e => e.key === "Enter" && handleAddSession()}
                      />
                      <button onClick={handleAddSession}
                        className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#144835]/90 shadow-md shadow-[#144835]/20 transition-all flex items-center gap-1.5 shrink-0">
                        <Plus size={13} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ EXAMS ════ */}
            {activeView === "exams" && (
              <div>
                <SectionHeader sectionKey="exams" title="Exam Types"
                  subtitle="Define exam schedules and types for this branch" />

                <div className="flex flex-col sm:flex-row gap-2 mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)}
                    placeholder="Exam name, e.g. Final Exams 2025"
                    className={cn(inputCls, "flex-1")} />
                  <input type="date" value={newExamStart} onChange={e => setNewExamStart(e.target.value)}
                    className={cn(inputCls, "sm:w-36")} />
                  <input type="date" value={newExamEnd} onChange={e => setNewExamEnd(e.target.value)}
                    className={cn(inputCls, "sm:w-36")} />
                  <button onClick={handleAddExam} disabled={savingExams}
                    className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#144835]/90 shadow-md shadow-[#144835]/20 disabled:opacity-60 transition-all flex items-center gap-1.5 shrink-0">
                    {savingExams ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />} Add Exam
                  </button>
                </div>

                {exams.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                      <ClipboardList size={20} className="text-purple-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">No exam types yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first exam type above</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exams.map(exam => (
                      <div key={exam.id} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-[#144835]/20 hover:bg-white hover:shadow-[0_4px_16px_rgba(20,72,53,0.06)] transition-all">
                        <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <ClipboardList size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{exam.name}</p>
                          {exam.startDate && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {exam.startDate}{exam.endDate && exam.endDate !== exam.startDate ? ` → ${exam.endDate}` : ""}
                            </p>
                          )}
                        </div>
                        <button onClick={() => setExams(p => p.filter(e => e.id !== exam.id))}
                          className="h-7 w-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ════ HOLIDAYS ════ */}
            {activeView === "holidays" && (
              <div>
                <SectionHeader sectionKey="holidays" title="Holidays & Calendar"
                  subtitle="Add public holidays, festivals and academic breaks" />

                <div className="flex flex-col sm:flex-row gap-2 mb-6 p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex-wrap">
                  <input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)}
                    placeholder="Holiday name" className={cn(inputCls, "flex-1 min-w-[160px]")} />
                  <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)}
                    className={cn(inputCls, "sm:w-36")} />
                  <input type="date" value={newHolidayEnd} onChange={e => setNewHolidayEnd(e.target.value)}
                    placeholder="End date (optional)" className={cn(inputCls, "sm:w-36")} />
                  <div className="relative sm:w-40">
                    <select value={newHolidayType} onChange={e => setNewHolidayType(e.target.value)} className={selectCls}>
                      {["Public Holiday", "Festival", "Academic Break", "Other"].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                  </div>
                  <button onClick={handleAddHoliday}
                    className="h-9 px-4 rounded-lg bg-[#144835] text-white text-xs font-bold hover:bg-[#144835]/90 shadow-md shadow-[#144835]/20 transition-all flex items-center gap-1.5 shrink-0">
                    <Plus size={13} /> Add
                  </button>
                </div>

                {holidays.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                      <CalendarDays size={20} className="text-orange-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">No holidays added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first holiday above</p>
                  </div>
                ) : (
                  <div className="space-y-1 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    {holidays.map((h, i) => {
                      const typeColors: Record<string, string> = {
                        "Public Holiday": "bg-emerald-50 text-emerald-700",
                        "Festival":       "bg-amber-50 text-amber-700",
                        "Academic Break": "bg-blue-50 text-blue-700",
                        "Other":          "bg-gray-100 text-gray-600",
                      };
                      return (
                        <div key={h.id} className={cn("group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors", i !== 0 && "border-t border-gray-50")}>
                          <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                            <CalendarDays size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{h.name}</p>
                            <p className="text-xs text-gray-500">{h.date}</p>
                          </div>
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", typeColors[h.type] ?? "bg-gray-100 text-gray-600")}>
                            {h.type}
                          </span>
                          <button onClick={() => setHolidays(p => p.filter(x => x.id !== h.id))}
                            className="h-7 w-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════ NOTIFICATIONS ════ */}
            {activeView === "notifications" && (
              <div>
                <SectionHeader sectionKey="notifications" title="Notification Settings"
                  subtitle="Control how and when alerts are sent"
                  onSave={() => showSaved()} />

                <div className="space-y-3">
                  {([
                    { key: "email" as const,  label: "Email Notifications",  desc: "Send alerts to admin email group",                icon: Globe },
                    { key: "sms"   as const,  label: "SMS Alerts",           desc: "Critical events sent to branch phone number",     icon: Bell },
                    { key: "inApp" as const,  label: "In-App Notifications", desc: "Notify admins in real time inside the dashboard", icon: CheckCircle2 },
                    { key: "digest" as const, label: "Daily Digest",         desc: "One summarised email at the end of each day",     icon: Clock },
                  ]).map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-[#144835]/20 hover:shadow-[0_4px_12px_rgba(20,72,53,0.04)] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <Toggle checked={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════ FEES ════ */}
            {activeView === "fees" && (
              <div>
                <SectionHeader sectionKey="fees" title="Fee Configuration"
                  subtitle="Currency, late fees, payment gateway and reminders"
                  onSave={() => showSaved()} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {([
                    { label: "Currency",           defaultValue: "INR (₹)" },
                    { label: "Late Fee (per day)",  defaultValue: "₹25" },
                    { label: "Payment Gateway",     defaultValue: "Razorpay" },
                    { label: "Receipt Prefix",      defaultValue: "IDPS-FEE" },
                  ]).map(f => (
                    <FieldCard key={f.label} label={f.label}>
                      <input className={inputCls} defaultValue={f.defaultValue} />
                    </FieldCard>
                  ))}
                </div>

                <FieldCard label="Auto Reminders">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    {[
                      { label: "7 days before due", on: true },
                      { label: "1 day before due",  on: true },
                      { label: "After due date",     on: false },
                    ].map((r, i) => (
                      <label key={i} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer hover:border-[#144835]/20 hover:bg-white transition-all">
                        <span className="text-xs font-bold text-gray-800">{r.label}</span>
                        <input type="checkbox" defaultChecked={r.on}
                          className="h-4 w-4 rounded border-gray-300 accent-[#144835] cursor-pointer" />
                      </label>
                    ))}
                  </div>
                </FieldCard>
              </div>
            )}

            {/* ════ STAFF POLICY ════ */}
            {activeView === "staff" && (
              <div>
                <SectionHeader sectionKey="staff" title="Staff Policies"
                  subtitle="Working hours, leave rules and weekly schedule"
                  onSave={() => showSaved()} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FieldCard label="Weekly Off Days">
                    <div className="relative mt-0.5">
                      <select className={selectCls}>
                        <option>Sunday</option>
                        <option>Saturday & Sunday</option>
                      </select>
                      <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </FieldCard>
                  <FieldCard label="Working Hours">
                    <input className={inputCls} defaultValue="09:00 AM - 04:00 PM" />
                  </FieldCard>
                  <FieldCard label="Annual Leave Quota">
                    <input className={inputCls} defaultValue="24 days" />
                  </FieldCard>
                  <FieldCard label="Casual Leave Quota">
                    <input className={inputCls} defaultValue="12 days" />
                  </FieldCard>
                </div>

                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-violet-900">Policy Enforcement</p>
                      <p className="text-xs text-violet-600 mt-0.5">Configure sign-in requirements, biometric rules and leave approval flows.</p>
                    </div>
                  </div>
                  <button type="button"
                    className="h-9 inline-flex items-center gap-2 rounded-xl bg-violet-600 text-white px-4 text-xs font-bold hover:bg-violet-700 shadow-md shadow-violet-200 transition-all shrink-0">
                    <ShieldCheck size={14} /> Configure
                  </button>
                </div>
              </div>
            )}

            {/* ════ INTEGRATIONS ════ */}
            {activeView === "integrations" && (
              <div>
                <SectionHeader sectionKey="integrations" title="SMS & WhatsApp Integrations"
                  subtitle="Configure your Twilio credentials to enable sending real SMS and WhatsApp messages"
                  onSave={() => showSaved()} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FieldCard label="Twilio Account SID">
                    <input
                      value={twilioCreds.accountSid}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      onChange={e => setTwilioCreds(p => ({ ...p, accountSid: e.target.value }))}
                      className={inputCls}
                    />
                  </FieldCard>
                  <FieldCard label="Twilio Auth Token">
                    <input
                      type="password"
                      value={twilioCreds.authToken}
                      placeholder="Your Twilio Auth Token"
                      onChange={e => setTwilioCreds(p => ({ ...p, authToken: e.target.value }))}
                      className={inputCls}
                    />
                  </FieldCard>
                  <FieldCard label="Twilio SMS From Number">
                    <input
                      value={twilioCreds.fromSms}
                      placeholder="+1234567890"
                      onChange={e => setTwilioCreds(p => ({ ...p, fromSms: e.target.value }))}
                      className={inputCls}
                    />
                  </FieldCard>
                  <FieldCard label="Twilio WhatsApp Sender Number">
                    <input
                      value={twilioCreds.fromWhatsapp}
                      placeholder="whatsapp:+14155238886"
                      onChange={e => setTwilioCreds(p => ({ ...p, fromWhatsapp: e.target.value }))}
                      className={inputCls}
                    />
                  </FieldCard>
                  <div className="md:col-span-2">
                    <FieldCard label="Test Recipient Number">
                      <input
                        value={twilioCreds.testPhone}
                        placeholder="+919876543210"
                        onChange={e => setTwilioCreds(p => ({ ...p, testPhone: e.target.value }))}
                        className={inputCls}
                      />
                    </FieldCard>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                  <p className="text-xs font-bold text-rose-900">Integration Guidelines</p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                    1. Direct WhatsApp Web sending is free and requires no configuration. Just select the channel when composing.<br />
                    2. Automated SMS and WhatsApp Business messaging requires a Twilio developer account. Input your credentials above.<br />
                    3. Credentials are saved locally in this browser's secure context.
                  </p>
                </div>
              </div>
            )}

              </div>
            </div>
          )}
      </SettingsPageShell>
    </AdminNotificationsProvider>
  );
}
