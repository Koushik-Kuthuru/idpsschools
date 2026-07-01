export type StaffStatus = "Active" | "Inactive" | "On Leave";

export type ClassLoad = {
  classSection?: string;
  subject?: string;
  students?: number;
  capacity?: number;
  weeklyHours?: number;
};

export type StaffDisplayRecord = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  mobile: string;
  email: string;
  classes: string;
  subjects: string;
  classLoads: ClassLoad[];
  classTeacher: string;
  status: StaffStatus;
  employmentType: string;
  joinedDate: string;
  qualifications: string[];
  reportsTo: string;
  baseSalaryMonthlyInr: number;
  username?: string;
  portalPassword?: string;
};

function splitCsv(value: unknown): string[] {
  return String(value ?? "")
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseClassLoadsFromStrings(
  classesValue: unknown,
  subjectsValue: unknown,
  classTeacherValue?: unknown
): ClassLoad[] {
  const classTeacherSections = splitCsv(classTeacherValue).filter((item) => item !== "-");
  const classList = splitCsv(classesValue);
  const subjectList = Array.isArray(subjectsValue)
    ? subjectsValue.map((item) => String(item).trim()).filter(Boolean)
    : splitCsv(subjectsValue);

  const loads: ClassLoad[] = [];

  for (const section of classTeacherSections) {
    loads.push({
      classSection: section,
      subject: "Class Teacher",
    });
  }

  if (classList.length) {
    const subjectLabel = subjectList.length ? subjectList.join(", ") : "—";
    for (const className of classList) {
      loads.push({ classSection: className, subject: subjectLabel });
    }
    return loads;
  }

  if (subjectList.length) {
    return subjectList.map((subject) => ({ classSection: "—", subject }));
  }

  return loads;
}

export function parseClassLoads(data: Record<string, unknown>): ClassLoad[] {
  if (Array.isArray(data.classLoads)) {
    return data.classLoads as ClassLoad[];
  }

  const fromStrings = parseClassLoadsFromStrings(data.classes, data.subjects, data.classTeacher);
  if (fromStrings.length) return fromStrings;

  const legacySubjects = Array.isArray(data.subjects) ? data.subjects : [];
  if (legacySubjects.length > 0) {
    return legacySubjects.map((row) => {
      const item = row as Record<string, unknown>;
      const grade = String(item.class ?? item.grade ?? "").trim();
      const section = String(item.section ?? "").trim();
      const classSection = grade && section ? `${grade}-${section}` : grade || section;
      return {
        classSection: classSection || "—",
        subject: String(item.name ?? item.subject ?? "—"),
        students: Number(item.students) || 0,
        capacity: Number(item.capacity) || 0,
        weeklyHours: Number(item.weeklyHours) || 0,
      };
    });
  }

  const subject = data.subject ?? data.subjects;
  const grade = data.grade ?? data.classId;
  const section = data.section;
  if (subject || grade || section) {
    const classSection =
      grade && section ? `${grade}-${section}` : String(grade ?? section ?? "—");
    const subjectLabel = Array.isArray(subject)
      ? subject.map(String).join(", ")
      : String(subject ?? "—");
    return [{ classSection, subject: subjectLabel }];
  }

  return [];
}

export function summarizeClassLoads(classLoads: ClassLoad[]): { classes: string; subjects: string } {
  if (!classLoads.length) return { classes: "—", subjects: "—" };
  const classList = [
    ...new Set(classLoads.map((c) => String(c.classSection ?? "").trim()).filter((v) => v && v !== "—")),
  ];
  const subjectList = [
    ...new Set(classLoads.map((c) => String(c.subject ?? "").trim()).filter(Boolean)),
  ];
  return {
    classes: classList.length ? classList.join(", ") : "—",
    subjects: subjectList.length ? subjectList.join(", ") : "—",
  };
}

export function mapStaffDoc(docId: string, data: Record<string, unknown>): StaffDisplayRecord {
  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const name = `${firstName} ${lastName}`.trim() || String(data.name ?? "").trim() || "Unnamed";
  const employeeId = String(data.employeeId ?? data.id ?? docId);
  const department = String(data.departmentId ?? data.department ?? "General");
  const designation = String(data.designation ?? data.roleTitle ?? data.position ?? data.role ?? "Staff");
  const mobile = String(data.phone ?? data.mobile ?? data.contactNumber ?? "").trim() || "—";
  const email = String(data.email ?? "").trim() || "—";
  const classLoads = parseClassLoads(data);
  const summarized = summarizeClassLoads(classLoads);
  const classes =
    summarized.classes !== "—"
      ? summarized.classes
      : String(data.classes ?? "").trim() || "—";
  const subjects =
    summarized.subjects !== "—"
      ? summarized.subjects
      : Array.isArray(data.subjects)
        ? data.subjects.map(String).filter(Boolean).join(", ")
        : String(data.subjects ?? data.subject ?? "").trim() || "—";

  const qualifications = Array.isArray(data.qualifications)
    ? data.qualifications.map(String).filter(Boolean)
    : data.qualification
      ? [String(data.qualification)]
      : [];

  const joinedRaw = data.joiningDate ?? data.joinedDate ?? data.joinDate;
  let joinedDate = "—";
  if (joinedRaw) {
    const parsed = new Date(joinedRaw as string | number);
    joinedDate = Number.isNaN(parsed.getTime())
      ? String(joinedRaw)
      : parsed.toLocaleDateString("en-IN");
  }

  return {
    id: docId,
    employeeId,
    name,
    department,
    designation,
    mobile,
    email,
    classes,
    subjects,
    classLoads,
    classTeacher: String(data.classTeacher ?? "").trim(),
    status: (String(data.status ?? "Active") as StaffStatus) || "Active",
    employmentType: String(data.employmentType ?? data.employmentStatus ?? "Full-Time"),
    joinedDate,
    qualifications,
    reportsTo: String(data.reportsTo ?? data.reportingManager ?? "—"),
    baseSalaryMonthlyInr: Number(data.baseSalaryMonthlyInr ?? data.baseSalary ?? 0),
    username: String(data.username || ""),
    portalPassword: String(data.portalPassword || ""),
  };
}
