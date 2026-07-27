import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolCodeFromSlug, getSchoolUuidFromSlug } from "@/lib/supabase/client";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  parseClassTeacherLabel,
  splitClassTeacherLabels,
} from "@/lib/classTeacherAssignments";
import { resolveStaffSessionForPortal } from "@/lib/auth/resolve-staff-session";
import {
  loadStaffProfileData,
} from "@/lib/loadBranchStaff";
import {
  resolveStaffYearProfile,
  type StaffProfileData,
} from "@/lib/staffProfileStore";
import { classScopeKey, teacherKeysFromDoc } from "@/lib/teacherClassScope";

export type StaffScopeMode = "unrestricted" | "class" | "transport" | "none";

export type StaffDataScope = {
  mode: StaffScopeMode;
  classKeys: string[];
  busNos: string[];
  routes: string[];
  designation: string | null;
  department: string | null;
};

export type ScopedStudentLike = {
  classId?: string;
  grade?: string;
  className?: string;
  section?: string;
  busNo?: string;
  route?: string;
};

function normalizeToken(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function isLeadershipDesignation(designation: string): boolean {
  const title = String(designation ?? "").trim().toLowerCase();
  if (!title) return false;
  return (
    title.includes("principal") ||
    (title.includes("vice") && title.includes("principal")) ||
    title.includes("academic director") ||
    (title.includes("academic") && title.includes("manager"))
  );
}

function isTransportStaff(
  designation: string,
  department: string,
  profile: StaffProfileData
): boolean {
  const title = String(designation ?? "").trim().toLowerCase();
  const dept = String(department ?? "").trim().toLowerCase();
  if (title.includes("driver") || title.includes("conductor") || dept.includes("transport")) {
    return true;
  }
  const busNo = String(profile.busNo ?? "").trim();
  return Boolean(busNo);
}

function classKeysFromClassLoads(yearProfile: StaffProfileData): Set<string> {
  const keys = new Set<string>();
  const loads = yearProfile.classLoads;
  if (!Array.isArray(loads)) return keys;

  for (const load of loads) {
    const sectionLabel = String((load as { classSection?: string }).classSection ?? "").trim();
    const parsed = parseClassTeacherLabel(sectionLabel);
    if (parsed) keys.add(classScopeKey(parsed.grade, parsed.section));
  }

  return keys;
}

function classKeysFromStaffProfile(
  profile: StaffProfileData,
  yearProfile: StaffProfileData
): Set<string> {
  const keys = new Set<string>();
  const merged = { ...profile, ...yearProfile };

  for (const label of splitClassTeacherLabels(
    yearProfile.classTeacher ?? profile.classTeacher ?? merged.classTeacher
  )) {
    const parsed = parseClassTeacherLabel(label);
    if (parsed) keys.add(classScopeKey(parsed.grade, parsed.section));
  }

  for (const part of String(yearProfile.classes ?? profile.classes ?? "")
    .split(/[,;\n]+/)
    .map((value) => value.trim())
    .filter(Boolean)) {
    const parsed = parseClassTeacherLabel(part);
    if (parsed) keys.add(classScopeKey(parsed.grade, parsed.section));
  }

  classKeysFromClassLoads(yearProfile).forEach((key) => keys.add(key));

  teacherKeysFromDoc(merged as Record<string, unknown>).forEach((key) => keys.add(key));

  return keys;
}

function transportScopeFromProfile(profile: StaffProfileData, yearProfile: StaffProfileData) {
  const merged = { ...profile, ...yearProfile };
  const busNos = new Set<string>();
  const routes = new Set<string>();

  const busNo = normalizeToken(String(merged.busNo ?? ""));
  const route = String(merged.route ?? "").trim();
  if (busNo) busNos.add(busNo);
  if (route && route !== "—") routes.add(route);

  return { busNos: Array.from(busNos), routes: Array.from(routes) };
}

async function loadClassKeysFromSchema(
  admin: SupabaseClient<any>,
  schoolUuid: string,
  userUid: string,
  academicYearId?: string | null
): Promise<Set<string>> {
  const keys = new Set<string>();

  let homeroomQuery = admin
    .from("sections")
    .select("name, grades(name)")
    .eq("school_id", schoolUuid)
    .eq("class_teacher_id", userUid);
  if (academicYearId) homeroomQuery = homeroomQuery.eq("academic_year_id", academicYearId);
  const { data: homeroom } = await homeroomQuery;
  homeroom?.forEach((row) => addSectionRowKey(keys, row));

  let assignQuery = admin
    .from("teacher_subject_assignments")
    .select("sections(name, grades(name))")
    .eq("school_id", schoolUuid)
    .eq("teacher_id", userUid);
  if (academicYearId) assignQuery = assignQuery.eq("academic_year_id", academicYearId);
  const { data: assignments } = await assignQuery;
  assignments?.forEach((row) => {
    const section = row.sections as
      | { name?: string; grades?: { name?: string } | { name?: string }[] | null }
      | null;
    addSectionRowKey(keys, section);
  });

  return keys;
}

function addSectionRowKey(
  keys: Set<string>,
  section: { name?: string | null; grades?: { name?: string | null } | { name?: string | null }[] | null } | null
) {
  if (!section) return;
  const grades = section.grades;
  const grade = Array.isArray(grades) ? grades[0]?.name : grades?.name;
  const sectionName = section.name;
  if (grade && sectionName) keys.add(classScopeKey(String(grade), String(sectionName)));
}

export async function resolveStaffDataScope(
  admin: SupabaseClient<any>,
  params: {
    schoolSlug: string;
    authId: string;
    email?: string | null;
    role?: string | null;
  }
): Promise<StaffDataScope> {
  const role = String(params.role ?? "").trim();
  const staffSession = await resolveStaffSessionForPortal({
    admin,
    authId: params.authId,
    email: params.email ?? null,
    schoolSlug: params.schoolSlug,
  });

  if (role === "super_admin" || role === "admin" || staffSession?.role === "admin") {
    return { mode: "unrestricted", classKeys: [], busNos: [], routes: [], designation: null, department: null };
  }

  const designation = staffSession?.designation ?? "";
  const department = staffSession?.department ?? "";

  if (isLeadershipDesignation(designation)) {
    return {
      mode: "unrestricted",
      classKeys: [],
      busNos: [],
      routes: [],
      designation,
      department,
    };
  }

  const branchId = await resolveBranchUuid(admin, params.schoolSlug);
  let profile: StaffProfileData = {};
  let yearProfile: StaffProfileData = {};

  if (branchId && staffSession?.recordId) {
    profile = await loadStaffProfileData(admin, branchId, staffSession.recordId);
    const years = await listBranchAcademicYears(admin, branchId);
    const yearName = years.find((y) => y.is_current)?.name ?? years[0]?.name ?? null;
    yearProfile = resolveStaffYearProfile(profile, yearName ?? "") ?? {};
  }

  const transport = transportScopeFromProfile(profile, yearProfile);
  if (isTransportStaff(designation, department, { ...profile, ...yearProfile })) {
    if (transport.busNos.length || transport.routes.length) {
      return {
        mode: "transport",
        classKeys: [],
        busNos: transport.busNos,
        routes: transport.routes,
        designation,
        department,
      };
    }
  }

  const classKeys = classKeysFromStaffProfile(profile, yearProfile);

  const schoolUuid = await getSchoolUuidFromSlug(params.schoolSlug);
  if (schoolUuid) {
    const code = getSchoolCodeFromSlug(params.schoolSlug);
    let academicYearId: string | null = null;
    if (code) {
      const { data: school } = await admin.from("schools").select("id").eq("code", code).maybeSingle();
      if (school?.id) {
        const { data: year } = await admin
          .from("academic_years")
          .select("id")
          .eq("school_id", school.id)
          .eq("is_current", true)
          .maybeSingle();
        academicYearId = year?.id ?? null;
      }
    }
    const schemaKeys = await loadClassKeysFromSchema(admin, schoolUuid, params.authId, academicYearId);
    schemaKeys.forEach((key) => classKeys.add(key));
  }

  const classKeyList = Array.from(classKeys);
  if (classKeyList.length) {
    return {
      mode: "class",
      classKeys: classKeyList,
      busNos: [],
      routes: [],
      designation,
      department,
    };
  }

  if (transport.busNos.length || transport.routes.length) {
    return {
      mode: "transport",
      classKeys: [],
      busNos: transport.busNos,
      routes: transport.routes,
      designation,
      department,
    };
  }

  return {
    mode: "none",
    classKeys: [],
    busNos: [],
    routes: [],
    designation,
    department,
  };
}

export function studentMatchesStaffScope(student: ScopedStudentLike, scope: StaffDataScope): boolean {
  if (scope.mode === "unrestricted") return true;
  if (scope.mode === "none") return false;

  if (scope.mode === "transport") {
    const busNo = normalizeToken(student.busNo);
    const route = String(student.route ?? "").trim();
    if (busNo && scope.busNos.some((value) => normalizeToken(value) === busNo)) return true;
    if (route && scope.routes.includes(route)) return true;
    return false;
  }

  const grade = String(student.classId ?? student.grade ?? student.className ?? "").trim();
  const section = String(student.section ?? "").trim();
  if (!grade || !section || !scope.classKeys.length) return false;
  return scope.classKeys.includes(classScopeKey(grade, section));
}

export function filterStudentsByStaffScope<T extends ScopedStudentLike>(
  students: T[],
  scope: StaffDataScope
): T[] {
  if (scope.mode === "unrestricted") return students;
  return students.filter((student) => studentMatchesStaffScope(student, scope));
}
