import { buildNavGroups } from "@/components/admin/navigation";

export type SearchResultCategory =
  | "pages"
  | "students"
  | "staff"
  | "admission"
  | "academic"
  | "finance"
  | "inventory"
  | "settings";

export type SearchScope =
  | "students"
  | "teachers"
  | "staff"
  | "attendance"
  | "marks"
  | "subjects"
  | "classes"
  | "timetable"
  | "fees"
  | "invoices"
  | "payments"
  | "expenses"
  | "payroll"
  | "leads"
  | "enquiries"
  | "applications"
  | "departments"
  | "leaves"
  | "stock"
  | "assets"
  | "messages"
  | "notifications"
  | "settings";

export type AdminSearchResult = {
  id: string;
  category: SearchResultCategory;
  scopes: SearchScope[];
  title: string;
  subtitle?: string;
  href: string;
  searchText: string;
};

export type AdminSearchGroup = {
  category: SearchResultCategory;
  label: string;
  items: AdminSearchResult[];
};

const CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  pages: "Pages",
  students: "Students",
  staff: "Staff",
  admission: "Admission",
  academic: "Academic",
  finance: "Finance",
  inventory: "Inventory",
  settings: "Settings",
};

const PAGE_KEYWORDS: Record<string, string> = {
  Dashboard: "home overview summary",
  Students: "student enrollment pupil learner roll class",
  Attendance: "attendance present absent roster daily",
  Marks: "marks grades results exam score",
  Subjects: "subject syllabus curriculum",
  Classes: "class grade section room",
  Timetable: "timetable schedule period",
  Calendar: "calendar events holidays",
  "Teaching Staff": "teacher faculty employee hr",
  "Non-Teaching Staff": "staff employee admin support",
  Departments: "department hr organization",
  Leaves: "leave vacation holiday absence",
  Fees: "fee payment tuition billing collection",
  Invoices: "invoice bill payment receipt",
  Payments: "payment transaction receipt",
  Expenses: "expense spending cost",
  Payroll: "payroll salary wages",
  "Financial Reports": "finance report analytics",
  Stock: "stock inventory supply",
  "Purchase Orders": "purchase order procurement",
  Assets: "asset equipment property",
  Leads: "lead admission prospect inquiry",
  Enquiries: "enquiry inquiry admission question",
  Applications: "application admission form enroll",
  Messages: "message communication chat sms",
  Notifications: "notification alert update",
  "Help Center": "help support guide faq",
  Profile: "profile account user me",
  "Branch Settings": "settings configuration branch school",
};

export type SearchScopeFilter = "all" | SearchScope;

export const SEARCH_SCOPE_OPTIONS: { value: SearchScopeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "teachers", label: "Teachers" },
  { value: "staff", label: "Staff" },
  { value: "attendance", label: "Attendance" },
  { value: "marks", label: "Marks" },
  { value: "classes", label: "Classes" },
  { value: "subjects", label: "Subjects" },
  { value: "timetable", label: "Timetable" },
  { value: "fees", label: "Fees" },
  { value: "invoices", label: "Invoices" },
  { value: "payments", label: "Payments" },
  { value: "expenses", label: "Expenses" },
  { value: "payroll", label: "Payroll" },
  { value: "leads", label: "Leads" },
  { value: "enquiries", label: "Enquiries" },
  { value: "applications", label: "Applications" },
  { value: "departments", label: "Departments" },
  { value: "leaves", label: "Leaves" },
  { value: "stock", label: "Stock" },
  { value: "assets", label: "Assets" },
  { value: "messages", label: "Messages" },
  { value: "notifications", label: "Notifications" },
  { value: "settings", label: "Settings" },
];

const PAGE_SCOPES: Record<string, SearchScope[]> = {
  Dashboard: ["settings"],
  Students: ["students"],
  Attendance: ["attendance"],
  Marks: ["marks"],
  Subjects: ["subjects"],
  Classes: ["classes"],
  Timetable: ["timetable"],
  Calendar: ["classes"],
  "Teaching Staff": ["teachers"],
  "Non-Teaching Staff": ["staff"],
  Departments: ["departments"],
  Leaves: ["leaves"],
  Fees: ["fees"],
  Invoices: ["invoices"],
  Payments: ["payments"],
  Expenses: ["expenses"],
  Payroll: ["payroll"],
  "Financial Reports": ["fees", "invoices"],
  Stock: ["stock"],
  "Purchase Orders": ["stock"],
  Assets: ["assets"],
  Leads: ["leads"],
  Enquiries: ["enquiries"],
  Applications: ["applications"],
  Messages: ["messages"],
  Notifications: ["notifications"],
  "Help Center": ["settings"],
  Profile: ["settings"],
  "Branch Settings": ["settings"],
};

export function filterResultsByScope(results: AdminSearchResult[], scope: SearchScopeFilter): AdminSearchResult[] {
  if (scope === "all") return results;
  return results.filter((result) => result.scopes.includes(scope));
}

export function getSearchPlaceholder(scope: SearchScopeFilter) {
  if (scope === "all") return "Search students, teachers, marks...";
  const label = SEARCH_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? "items";
  return `Search ${label.toLowerCase()}...`;
}

const CATEGORY_ORDER: SearchResultCategory[] = [
  "pages",
  "students",
  "staff",
  "admission",
  "academic",
  "finance",
  "inventory",
  "settings",
];

export function buildPageSearchIndex(schoolId: string): AdminSearchResult[] {
  const base = `/schools/${schoolId}/admin`;
  const groups = buildNavGroups(schoolId);

  return groups.flatMap((group) =>
    group.items.map((item) => {
      const category: SearchResultCategory =
        group.id === "dashboard"
          ? "pages"
          : group.id === "academic"
            ? "pages"
            : group.id === "staff_hr"
              ? "pages"
              : group.id === "finance"
                ? "pages"
                : group.id === "inventory"
                  ? "pages"
                  : group.id === "admission"
                    ? "pages"
                    : group.id === "communication"
                      ? "pages"
                      : "settings";

      const keywords = PAGE_KEYWORDS[item.name] ?? "";
      const scopes = PAGE_SCOPES[item.name] ?? ["settings"];
      return {
        id: `page-${item.href}`,
        category,
        scopes,
        title: item.name,
        subtitle: group.name,
        href: item.href,
        searchText: `${item.name} ${group.name} ${keywords} ${scopes.join(" ")} ${item.href}`.toLowerCase(),
      };
    })
  );
}

export function normalizeSearchQuery(query: string) {
  return query.trim().toLowerCase();
}

export function matchesSearch(result: AdminSearchResult, query: string) {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return result.searchText.includes(q);
}

export function groupSearchResults(results: AdminSearchResult[], limitPerGroup = 5): AdminSearchGroup[] {
  const grouped = new Map<SearchResultCategory, AdminSearchResult[]>();

  for (const result of results) {
    const bucket = grouped.get(result.category) ?? [];
    if (bucket.length < limitPerGroup) {
      bucket.push(result);
      grouped.set(result.category, bucket);
    }
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    items: grouped.get(category) ?? [],
  })).filter((group) => group.items.length > 0);
}

export function getDefaultQuickResults(schoolId: string): AdminSearchResult[] {
  const base = `/schools/${schoolId}/admin`;
  const picks = [
    { title: "Students", subtitle: "Academic", href: `${base}/academic/students` },
    { title: "Attendance", subtitle: "Academic", href: `${base}/academic/attendance` },
    { title: "Fees", subtitle: "Finance", href: `${base}/finance/fees` },
    { title: "Teaching Staff", subtitle: "Staff & HR", href: `${base}/hr/teaching-staff` },
    { title: "Leads", subtitle: "Admission", href: `${base}/admission/leads` },
    { title: "Notifications", subtitle: "Communication", href: `${base}/notifications` },
  ];

  return picks.map((item) => ({
    id: `quick-${item.href}`,
    category: "pages" as const,
    scopes: (PAGE_SCOPES[item.title] ?? ["settings"]) as SearchScope[],
    title: item.title,
    subtitle: item.subtitle,
    href: item.href,
    searchText: `${item.title} ${item.subtitle}`.toLowerCase(),
  }));
}

export function buildStudentResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unnamed student";
  const className = String(data.classId || "-");
  const section = String(data.section || "-");
  const roll = String(data.rollNumber || "-");
  const admission = String(data.admissionNo || data.registrationNo || data.formNo || "");

  return {
    id: `student-${id}`,
    category: "students",
    scopes: ["students"],
    title: name,
    subtitle: `Class ${className}-${section} · Roll ${roll}`,
    href: `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(id)}/profile`,
    searchText: `${name} ${roll} ${admission} ${className} ${section} student`.toLowerCase(),
  };
}

export function buildTeacherResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unnamed staff";
  const designation = String(data.designation || "Teacher");
  const department = String(data.departmentId || data.department || "General");

  return {
    id: `teacher-${id}`,
    category: "staff",
    scopes: ["teachers"],
    title: name,
    subtitle: `${designation} · ${department}`,
    href: `/schools/${schoolId}/admin/hr/teaching-staff/${encodeURIComponent(id)}/profile`,
    searchText: `${name} ${designation} ${department} teacher teachers staff`.toLowerCase(),
  };
}

export function buildStaffResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unnamed staff";
  const designation = String(data.designation || "Staff");
  const department = String(data.departmentId || data.department || "General");

  return {
    id: `staff-${id}`,
    category: "staff",
    scopes: ["staff"],
    title: name,
    subtitle: `${designation} · ${department}`,
    href: `/schools/${schoolId}/admin/hr/non-teaching-staff/${encodeURIComponent(id)}/profile`,
    searchText: `${name} ${designation} ${department} staff`.toLowerCase(),
  };
}

export function buildEnquiryResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = String(data.studentName || data.name || data.parentName || "Enquiry");
  const phone = String(data.phone || "");
  const email = String(data.email || "");
  const grade = String(data.grade || data.classApplied || "");

  return {
    id: `enquiry-${id}`,
    category: "admission",
    scopes: ["enquiries"],
    title: name,
    subtitle: grade ? `Grade ${grade}` : phone || email || "Admission enquiry",
    href: `/schools/${schoolId}/admin/admission/enquiries`,
    searchText: `${name} ${phone} ${email} ${grade} enquiry admission`.toLowerCase(),
  };
}

export function buildLeadResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const studentName = String(data.studentName || data.name || "Lead");
  const parentName = String(data.parentName || "");
  const phone = String(data.phone || "");
  const email = String(data.email || "");

  return {
    id: `lead-${id}`,
    category: "admission",
    scopes: ["leads"],
    title: studentName,
    subtitle: parentName ? `Parent: ${parentName}` : phone || email || "Admission lead",
    href: `/schools/${schoolId}/admin/admission/leads`,
    searchText: `${studentName} ${parentName} ${phone} ${email} lead admission`.toLowerCase(),
  };
}

export function buildApplicationResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = String(data.studentName || data.applicantName || data.name || "Application");
  const grade = String(data.grade || data.classApplied || "");
  const status = String(data.status || "Pending");

  return {
    id: `application-${id}`,
    category: "admission",
    scopes: ["applications"],
    title: name,
    subtitle: grade ? `Grade ${grade} · ${status}` : status,
    href: `/schools/${schoolId}/admin/admission/applications`,
    searchText: `${name} ${grade} ${status} application admission`.toLowerCase(),
  };
}

export function buildClassResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const grade = String(data.grade || data.name || "Class");
  const section = String(data.section || "");
  const room = String(data.room || "");

  return {
    id: `class-${id}`,
    category: "academic",
    scopes: ["classes"],
    title: section ? `Class ${grade}-${section}` : `Class ${grade}`,
    subtitle: room ? `Room ${room}` : "Classroom",
    href: `/schools/${schoolId}/admin/academic/classes`,
    searchText: `${grade} ${section} ${room} class`.toLowerCase(),
  };
}

export function buildSubjectResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const name = String(data.name || "Subject");
  const code = String(data.code || "");

  return {
    id: `subject-${id}`,
    category: "academic",
    scopes: ["subjects"],
    title: name,
    subtitle: code ? `Code ${code}` : "Subject",
    href: `/schools/${schoolId}/admin/academic/subjects`,
    searchText: `${name} ${code} subject`.toLowerCase(),
  };
}

export function buildInvoiceResult(schoolId: string, id: string, data: Record<string, unknown>): AdminSearchResult {
  const student = String(data.studentName || data.studentId || "Invoice");
  const amount = data.amount != null ? `₹${data.amount}` : "";
  const status = String(data.status || "");

  return {
    id: `invoice-${id}`,
    category: "finance",
    scopes: ["invoices"],
    title: `Invoice · ${student}`,
    subtitle: [amount, status].filter(Boolean).join(" · ") || "Finance",
    href: `/schools/${schoolId}/admin/finance/invoices`,
    searchText: `${student} ${amount} ${status} invoice finance`.toLowerCase(),
  };
}
