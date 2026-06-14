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
  status: StaffStatus;
  employmentType: string;
  joinedDate: string;
  qualifications: string[];
  reportsTo: string;
  baseSalaryMonthlyInr: number;
};

export function parseClassLoads(data: Record<string, unknown>): ClassLoad[] {
  if (Array.isArray(data.classLoads)) {
    return data.classLoads as ClassLoad[];
  }

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
  const { classes, subjects } = summarizeClassLoads(classLoads);

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
    status: (String(data.status ?? "Active") as StaffStatus) || "Active",
    employmentType: String(data.employmentType ?? "Full-Time"),
    joinedDate,
    qualifications,
    reportsTo: String(data.reportsTo ?? data.reportingManager ?? "—"),
    baseSalaryMonthlyInr: Number(data.baseSalaryMonthlyInr ?? data.baseSalary ?? 0),
  };
}
