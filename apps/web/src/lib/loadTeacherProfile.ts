import { supabase, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { buildPath, fetchOne, db } from "@/lib/db-client";
import { mapStaffDoc, type StaffDisplayRecord } from "@/lib/staffRecord";
import { loadTeacherClassKeys } from "@/lib/loadTeacherClassScope";
import { parseClassScopeKey } from "@/lib/teacherClassScope";

export type TeachingLoad = {
  classSection: string;
  subject: string;
  isHomeroom: boolean;
};

export type TeacherProfileData = {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  department: string;
  status: string;
  joinedDate: string;
  qualification: string;
  experienceYears: number | null;
  photoURL: string | null;
  homeroomClasses: string[];
  teachingLoads: TeachingLoad[];
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(raw: string | null | undefined): string {
  const value = String(raw ?? "active").toLowerCase();
  if (value === "active") return "Active";
  if (value === "inactive") return "Inactive";
  if (value === "on leave" || value === "on_leave") return "On Leave";
  return raw ? String(raw) : "Active";
}

async function loadLegacyStaffRecord(
  schoolSlug: string,
  userUid: string,
  userEmail: string | null
): Promise<StaffDisplayRecord | null> {
  for (const col of ["teachers", "teaching_staff", "staff"] as const) {
    const byId = await fetchOne(buildPath(db, "schools", schoolSlug, col, userUid));
    if (byId.exists()) {
      return mapStaffDoc(byId.id, byId.data() as Record<string, unknown>);
    }
  }

  if (!userEmail) return null;
  const normalizedEmail = userEmail.toLowerCase();
  for (const col of ["teachers", "teaching_staff", "staff"] as const) {
    const { data } = await supabase.from(col).select("*").eq("school_id", schoolSlug);
    const match = (data ?? []).find((row) => {
      const record = row as Record<string, unknown>;
      const email = String(record.email ?? record.loginEmail ?? "").toLowerCase();
      const authUid = record.authUid ?? record.auth_uid ?? record.userId ?? record.user_id;
      return email === normalizedEmail || String(authUid ?? "") === userUid;
    });
    if (match) {
      const record = match as Record<string, unknown>;
      return mapStaffDoc(String(record.id ?? userUid), record);
    }
  }

  return null;
}

export async function loadTeacherProfile(
  schoolSlug: string,
  userUid: string,
  userEmail: string | null,
  authDisplayName: string | null,
  authPhone: string | null | undefined,
  authPhotoURL: string | null
): Promise<TeacherProfileData> {
  const classKeys = await loadTeacherClassKeys(schoolSlug, userUid, userEmail);
  const homeroomClasses = classKeys
    .map((key) => {
      const parsed = parseClassScopeKey(key);
      return parsed ? `${parsed.grade}-${parsed.section}` : null;
    })
    .filter(Boolean) as string[];

  const teachingLoads: TeachingLoad[] = [];
  const homeroomSet = new Set(homeroomClasses);

  const schoolUuid = await getSchoolUuidFromSlug(schoolSlug);
  if (schoolUuid) {
    const { data: assignments } = await supabase
      .from("teacher_subject_assignments")
      .select("subjects(name), sections(name, grades(name))")
      .eq("school_id", schoolUuid)
      .eq("teacher_id", userUid);

    (assignments ?? []).forEach((row) => {
      const record = row as {
        subjects?: { name?: string } | { name?: string }[] | null;
        sections?: {
          name?: string;
          grades?: { name?: string } | { name?: string }[] | null;
        } | null;
      };
      const subjectRaw = record.subjects;
      const subject = Array.isArray(subjectRaw)
        ? String(subjectRaw[0]?.name ?? "—")
        : String(subjectRaw?.name ?? "—");
      const section = record.sections;
      const gradeRaw = section?.grades;
      const grade = Array.isArray(gradeRaw)
        ? String(gradeRaw[0]?.name ?? "")
        : String(gradeRaw?.name ?? "");
      const sectionName = String(section?.name ?? "");
      const classSection = grade && sectionName ? `${grade}-${sectionName}` : grade || sectionName || "—";
      teachingLoads.push({
        classSection,
        subject,
        isHomeroom: homeroomSet.has(classSection),
      });
    });
  }

  let profile: TeacherProfileData = {
    name: authDisplayName || "Teacher",
    email: userEmail || "—",
    phone: authPhone || "—",
    employeeId: userUid.slice(0, 8).toUpperCase(),
    designation: "Teacher",
    department: "Academic",
    status: "Active",
    joinedDate: "—",
    qualification: "—",
    experienceYears: null,
    photoURL: authPhotoURL,
    homeroomClasses,
    teachingLoads,
  };

  if (schoolUuid) {
    const { data: staffRow } = await supabase
      .from("staff_profiles")
      .select(`
        employee_id,
        designation,
        department,
        date_of_joining,
        qualification,
        experience_years,
        status,
        users (
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq("school_id", schoolUuid)
      .eq("user_id", userUid)
      .maybeSingle();

    if (staffRow) {
      const users = staffRow.users as
        | { full_name?: string; email?: string; phone?: string; avatar_url?: string }
        | { full_name?: string; email?: string; phone?: string; avatar_url?: string }[]
        | null;
      const userRow = Array.isArray(users) ? users[0] : users;

      profile = {
        ...profile,
        name: userRow?.full_name || authDisplayName || profile.name,
        email: userRow?.email || userEmail || profile.email,
        phone: userRow?.phone || authPhone || profile.phone,
        photoURL: userRow?.avatar_url || authPhotoURL,
        employeeId: staffRow.employee_id || profile.employeeId,
        designation: staffRow.designation || profile.designation,
        department: staffRow.department || profile.department,
        status: statusLabel(staffRow.status),
        joinedDate: formatDate(staffRow.date_of_joining),
        qualification: staffRow.qualification || profile.qualification,
        experienceYears:
          typeof staffRow.experience_years === "number" ? staffRow.experience_years : null,
        homeroomClasses,
        teachingLoads,
      };
    }
  }

  if (teachingLoads.length === 0) {
    const legacy = await loadLegacyStaffRecord(schoolSlug, userUid, userEmail);
    if (legacy) {
      profile = {
        ...profile,
        name: legacy.name !== "Unnamed" ? legacy.name : profile.name,
        email: legacy.email !== "—" ? legacy.email : profile.email,
        phone: legacy.mobile !== "—" ? legacy.mobile : profile.phone,
        employeeId: legacy.employeeId || profile.employeeId,
        designation: legacy.designation || profile.designation,
        department: legacy.department || profile.department,
        status: legacy.status,
        joinedDate: legacy.joinedDate !== "—" ? legacy.joinedDate : profile.joinedDate,
        qualification: legacy.qualifications.length ? legacy.qualifications.join(", ") : profile.qualification,
        teachingLoads: legacy.classLoads.map((load) => ({
          classSection: load.classSection || "—",
          subject: load.subject || "—",
          isHomeroom: homeroomSet.has(load.classSection || ""),
        })),
      };
    }
  }

  if (profile.teachingLoads.length === 0 && homeroomClasses.length > 0) {
    profile.teachingLoads = homeroomClasses.map((classSection) => ({
      classSection,
      subject: "Class Teacher",
      isHomeroom: true,
    }));
  }

  return profile;
}
