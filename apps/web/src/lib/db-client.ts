import { supabase, getSchoolUuidFromSlug, getBranchUuidFromSlug } from "@/lib/supabase/client";
import {
  ACADEMIC_YEAR_CHANGED_EVENT,
  getActiveAcademicYear,
  schoolSlugFromCollectionPath,
  type AcademicYearChangedDetail,
} from "@/lib/activeAcademicYear";
import { compareGrades } from "@/lib/gradeOrder";
import {
  buildDbDocCacheKey,
  buildDbQueryCacheKey,
  readDbDocCache,
  readDbRowsCache,
  writeDbDocCache,
  writeDbRowsCache,
} from "@/lib/dbQueryCache";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tables stored against branch_id in the hosted Supabase schema. */
const BRANCH_SCOPED_TABLES = new Set(["students", "classes", "teachers", "non_teaching_staff"]);

/** Tables that store school_id as route slug (legacy). */
const SLUG_SCHOOL_ID_TABLES = new Set(["homework", "study_materials"]);

/** Legacy Firebase collection names → Supabase tables. */
const TABLE_ALIASES: Record<string, string> = {
  holidays: "events",
  teaching_staff: "teachers",
  staff: "non_teaching_staff",
  employees: "non_teaching_staff",
  "non-teaching-staff": "non_teaching_staff",
  leaves: "leave_requests",
  sections: "classes",
};

/** Legacy sort fields → columns that exist on the mapped table. */
const ORDER_FIELD_ALIASES: Record<string, Record<string, string>> = {
  students: {
    firstName: "full_name",
    lastName: "full_name",
    name: "full_name",
    admission_number: "admission_no",
  },
  staff_profiles: { firstName: "created_at", lastName: "created_at", name: "created_at" },
  teachers: { firstName: "full_name", lastName: "full_name", name: "full_name" },
  non_teaching_staff: { firstName: "full_name", lastName: "full_name", name: "full_name" },
  classes: { firstName: "class_name", lastName: "class_name", name: "class_name" },
};

function resolveTable(table: string): string {
  return TABLE_ALIASES[table] ?? table;
}

function mapOrderField(table: string, field: string): string {
  return ORDER_FIELD_ALIASES[table]?.[field] ?? field;
}

async function resolveSchoolFilter(table: string, parentId: string): Promise<string | null> {
  if (!parentId) return null;
  if (SLUG_SCHOOL_ID_TABLES.has(table)) return parentId;
  if (UUID_RE.test(parentId)) return parentId;
  if (BRANCH_SCOPED_TABLES.has(table)) {
    return getBranchUuidFromSlug(parentId);
  }
  const uuid = await getSchoolUuidFromSlug(parentId);
  return uuid;
}

function branchScopeColumn(table: string): "branch_id" | "school_id" {
  return BRANCH_SCOPED_TABLES.has(table) ? "branch_id" : "school_id";
}

function shapeApiStudent(row: Record<string, unknown>): Record<string, unknown> {
  const name = String(row.name ?? "").trim();
  const parts = name.split(/\s+/);
  const className = String(row.className ?? row.classId ?? "-").trim() || "-";
  const section = String(row.section ?? "-").trim().toUpperCase() || "-";
  const admissionNo = String(row.admissionNo ?? row.admission_number ?? "").trim();

  return {
    id: row.id,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    name: name || admissionNo || "Unnamed",
    studentName: name,
    classId: className,
    section,
    academicYear: row.academicYear,
    admissionNo,
    admission_number: admissionNo,
    admissionNumber: admissionNo,
    rollNumber: row.roll ?? row.rollNumber ?? admissionNo,
    status: row.status ?? "Active",
    parentPhone: row.parentPhone ?? null,
    is_active: row.status !== "Inactive",
  };
}

function shapeApiClass(row: Record<string, unknown>): Record<string, unknown> {
  const grade = String(row.grade ?? row.class_name ?? "").trim() || "Unknown";
  const section = String(row.section ?? "").trim().toUpperCase() || "—";

  return {
    id: row.id,
    grade,
    name: grade,
    class_name: grade,
    section,
    total_students: row.strength ?? row.total_students ?? 0,
    academic_year: row.academicYear ?? row.academic_year,
    academicYear: row.academicYear ?? row.academic_year,
    status: row.status ?? "Active",
  };
}

async function fetchBranchDepartmentsViaApi(
  schoolSlug: string,
  academicYear: string | null
): Promise<Record<string, unknown>[]> {
  try {
    const params = new URLSearchParams({ schoolId: schoolSlug });
    if (academicYear) params.set("academicYear", academicYear);
    const res = await fetch(`/api/admin/departments?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("Branch departments API:", data.error || res.status, { schoolSlug });
      return [];
    }
    return (data.departments ?? []) as Record<string, unknown>[];
  } catch (err) {
    console.warn("Branch departments API fetch failed:", err);
    return [];
  }
}

async function fetchBranchStaffViaApi(
  schoolSlug: string,
  kind: "teaching" | "non_teaching" | "all",
  academicYear: string | null
): Promise<Record<string, unknown>[]> {
  try {
    const params = new URLSearchParams({ schoolId: schoolSlug, kind });
    if (academicYear) params.set("academicYear", academicYear);
    const res = await fetch(`/api/admin/staff?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("Branch staff API:", data.error || res.status, { kind, schoolSlug });
      return [];
    }
    return (data.staff ?? []) as Record<string, unknown>[];
  } catch (err) {
    console.warn("Branch staff API fetch failed:", err);
    return [];
  }
}

async function fetchBranchTableViaApi(
  table: "students" | "classes",
  schoolSlug: string,
  academicYear: string | null
): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({ schoolId: schoolSlug });
  if (academicYear) params.set("academicYear", academicYear);

  const endpoint =
    table === "students"
      ? `/api/admin/students?${params.toString()}`
      : `/api/admin/classes?${params.toString()}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("Branch API:", data.error || res.status, { table, schoolSlug });
      return [];
    }

    if (table === "students") {
      return ((data.students ?? []) as Record<string, unknown>[]).map(shapeApiStudent);
    }

    const rows = ((data.classes ?? []) as Record<string, unknown>[]).map(shapeApiClass);
    return rows.sort((a, b) => {
      const byGrade = compareGrades(String(a.grade ?? ""), String(b.grade ?? ""));
      if (byGrade !== 0) return byGrade;
      return String(a.section ?? "").localeCompare(String(b.section ?? ""), undefined, {
        sensitivity: "base",
      });
    });
  } catch (err) {
    console.warn("Branch API fetch failed:", err);
    return [];
  }
}

function applyClientConstraints(
  table: string,
  rows: Record<string, unknown>[],
  constraints: any[]
): Record<string, unknown>[] {
  let result = [...rows];

  for (const c of constraints) {
    if (c.type === "where") {
      result = result.filter((row) => {
        const raw = row[c.field] ?? row[mapOrderField(table, c.field)];
        if (c.op === "==") return raw === c.value;
        if (c.op === ">=") return Number(raw) >= Number(c.value);
        if (c.op === "<=") return Number(raw) <= Number(c.value);
        if (c.op === ">") return Number(raw) > Number(c.value);
        if (c.op === "<") return Number(raw) < Number(c.value);
        if (c.op === "in") return Array.isArray(c.value) && c.value.includes(raw);
        return true;
      });
    }
  }

  for (const c of constraints) {
    if (c.type === "orderBy") {
      const field = c.field;
      const asc = c.direction === "asc";
      result.sort((a, b) => {
        const av = String(a[field] ?? a[mapOrderField(table, field)] ?? "");
        const bv = String(b[field] ?? b[mapOrderField(table, field)] ?? "");
        const cmp = av.localeCompare(bv, undefined, { sensitivity: "base", numeric: true });
        return asc ? cmp : -cmp;
      });
    }
  }

  for (const c of constraints) {
    if (c.type === "limit") {
      result = result.slice(0, c.value);
    }
  }

  return result;
}

function shapeStudentRow(row: Record<string, unknown>): Record<string, unknown> {
  const classes = row.classes as
    | { class_name?: string; section?: string; academic_year?: string }
    | { class_name?: string; section?: string; academic_year?: string }[]
    | null
    | undefined;
  const cls = Array.isArray(classes) ? classes[0] : classes;

  const fullName = String(row.full_name ?? row.name ?? "").trim();
  const parts = fullName.split(/\s+/);
  const admissionNo = String(row.admission_no ?? row.admission_number ?? "").trim();

  return {
    ...row,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    name: fullName || admissionNo || "Unnamed",
    studentName: fullName,
    classId: cls?.class_name ?? row.classId ?? "-",
    section: cls?.section ?? row.section ?? "-",
    academicYear: cls?.academic_year ?? row.academicYear,
    admissionNo,
    admission_number: admissionNo,
    rollNumber: row.roll_number ?? row.rollNumber ?? "",
    status: row.is_active === false || row.status === "inactive" ? "Inactive" : "Active",
  };
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  return String(error.message ?? "").includes("Could not find the table");
}

// Mock snapshot wrappers to avoid rewriting 150+ UI components at once
class QueryResult {
  docs: any[];
  empty: boolean;
  size: number;

  constructor(docs: any[]) {
    this.empty = docs.length === 0;
    this.size = docs.length;
    this.docs = docs.map((doc) => ({
      id: doc.id,
      data: () => doc,
      exists: () => true,
      ref: { id: doc.id },
    }));
  }

  forEach(callback: Function) {
    this.docs.forEach((d) => callback(d));
  }
}

class SingleResult {
  id: string;
  _data: any;
  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
  }
  data() {
    return this._data;
  }
  exists() {
    return !!this._data;
  }
}

export function buildPath(db: any, ...paths: string[]) {
  return paths;
}

export function buildQuery(collectionPath: any, ...constraints: any[]) {
  return { collectionPath, constraints };
}

export function filterBy(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function sortBy(field: string, direction = "asc") {
  return { type: "orderBy", field, direction };
}

export function limitTo(value: number) {
  return { type: "limit", value };
}

function finishQuery(
  collectionPath: string[],
  constraints: any[],
  rows: Record<string, unknown>[]
): QueryResult {
  writeDbRowsCache(buildDbQueryCacheKey(collectionPath, constraints), rows);
  return new QueryResult(rows);
}

function parseQueryInput(
  queryOrPath: any
): { collectionPath: string[]; constraints: any[] } | null {
  if (Array.isArray(queryOrPath)) {
    return { collectionPath: queryOrPath, constraints: [] };
  }
  if (queryOrPath?.collectionPath) {
    return {
      collectionPath: queryOrPath.collectionPath,
      constraints: queryOrPath.constraints ?? [],
    };
  }
  return null;
}

type FetchOptions = { skipCache?: boolean };

async function applyQuery(collectionPath: string[], constraints: any[] = []) {
  let table = resolveTable(collectionPath[0]);
  let isSubcollection = false;
  let parentId: string | null = null;

  if (collectionPath.length === 3) {
    table = resolveTable(collectionPath[2]);
    parentId = collectionPath[1];
    isSubcollection = true;
  }

  const schoolSlug = isSubcollection ? schoolSlugFromCollectionPath(collectionPath) : null;

  if (schoolSlug && (table === "students" || table === "classes")) {
    const academicYear = getActiveAcademicYear(schoolSlug);
    const apiRows = await fetchBranchTableViaApi(table, schoolSlug, academicYear);
    const filtered = applyClientConstraints(table, apiRows, constraints);
    return finishQuery(collectionPath, constraints, filtered);
  }

  if (schoolSlug && table === "teachers") {
    const academicYear = getActiveAcademicYear(schoolSlug);
    const apiRows = await fetchBranchStaffViaApi(schoolSlug, "teaching", academicYear);
    const filtered = applyClientConstraints(table, apiRows, constraints);
    return finishQuery(collectionPath, constraints, filtered);
  }

  if (schoolSlug && table === "non_teaching_staff") {
    const academicYear = getActiveAcademicYear(schoolSlug);
    const apiRows = await fetchBranchStaffViaApi(schoolSlug, "non_teaching", academicYear);
    const filtered = applyClientConstraints(table, apiRows, constraints);
    return finishQuery(collectionPath, constraints, filtered);
  }

  if (schoolSlug && table === "departments") {
    const academicYear = getActiveAcademicYear(schoolSlug);
    const apiRows = await fetchBranchDepartmentsViaApi(schoolSlug, academicYear);
    const filtered = applyClientConstraints(table, apiRows, constraints);
    return finishQuery(collectionPath, constraints, filtered);
  }

  let schoolFilter: string | null = null;
  if (isSubcollection && parentId) {
    schoolFilter = await resolveSchoolFilter(table, parentId);
    if (!schoolFilter) {
      return finishQuery(collectionPath, constraints, []);
    }
  }

  let q: any = supabase.from(table).select("*");

  if (table === "students" && schoolFilter) {
    q = supabase
      .from("students")
      .select("*, classes(class_name, section, academic_year)")
      .eq("branch_id", schoolFilter);
  } else if (schoolFilter) {
    q = q.eq(branchScopeColumn(table), schoolFilter);
  }

  for (const c of constraints) {
    if (c.type === "where") {
      if (c.op === "==") q = q.eq(c.field, c.value);
      if (c.op === ">=") q = q.gte(c.field, c.value);
      if (c.op === "<=") q = q.lte(c.field, c.value);
      if (c.op === ">") q = q.gt(c.field, c.value);
      if (c.op === "<") q = q.lt(c.field, c.value);
      if (c.op === "in") q = q.in(c.field, c.value);
      if (c.op === "array-contains") q = q.contains(c.field, [c.value]);
    } else if (c.type === "orderBy") {
      const field = mapOrderField(table, c.field);
      q = q.order(field, { ascending: c.direction === "asc" });
    } else if (c.type === "limit") {
      q = q.limit(c.value);
    }
  }

  const { data, error } = await q;
  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("Supabase query:", error.message || error.code, { table, parentId: isSubcollection ? parentId : undefined });
    }
    return finishQuery(collectionPath, constraints, []);
  }

  const rows = (data || []).map((row: Record<string, unknown>) => {
    if (table === "students") return shapeStudentRow(row);
    if (table === "teachers" || table === "non_teaching_staff") {
      const legacy = row as Record<string, unknown>;
      if (!legacy.firstName && !legacy.lastName) {
        const fullName = String(legacy.full_name ?? legacy.name ?? "").trim();
        const parts = fullName.split(/\s+/);
        legacy.firstName = parts[0] ?? "";
        legacy.lastName = parts.slice(1).join(" ") ?? "";
        legacy.name = fullName || legacy.employee_id || "Unnamed";
      }
      return legacy;
    }
    if (table === "staff_profiles") {
      const legacy = row as Record<string, unknown>;
      if (!legacy.firstName && !legacy.lastName) {
        const fullName = String(legacy.full_name ?? legacy.name ?? "").trim();
        const parts = fullName.split(/\s+/);
        legacy.firstName = parts[0] ?? "";
        legacy.lastName = parts.slice(1).join(" ") ?? "";
        legacy.name = fullName || legacy.admission_number || "Unnamed";
      }
      return legacy;
    }
    return row;
  });

  return finishQuery(collectionPath, constraints, rows);
}

export async function fetchMany(queryOrPath: any, options: FetchOptions = {}) {
  const parsed = parseQueryInput(queryOrPath);
  if (!parsed) return new QueryResult([]);

  const cacheKey = buildDbQueryCacheKey(parsed.collectionPath, parsed.constraints);
  if (!options.skipCache) {
    const cached = readDbRowsCache(cacheKey);
    if (cached) return new QueryResult(cached);
  }

  return applyQuery(parsed.collectionPath, parsed.constraints);
}

async function fetchBranchStudentByIdViaApi(
  schoolSlug: string,
  studentId: string,
  academicYear: string | null
): Promise<Record<string, unknown> | null> {
  try {
    const params = new URLSearchParams({ schoolId: schoolSlug });
    if (academicYear) params.set("academicYear", academicYear);
    const res = await fetch(`/api/admin/students/${encodeURIComponent(studentId)}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    return (data.student ?? null) as Record<string, unknown> | null;
  } catch (err) {
    console.warn("Branch student API fetch failed:", err);
    return null;
  }
}

export async function fetchOne(docPath: string[], options: FetchOptions = {}) {
  let table = resolveTable(docPath[0]);
  let id = docPath[1];
  let schoolSlug: string | null = null;

  if (docPath.length === 4) {
    table = resolveTable(docPath[2]);
    schoolSlug = docPath[1];
    id = docPath[3];
  }

  const cacheKey = buildDbDocCacheKey(docPath);
  if (!options.skipCache) {
    const cached = readDbDocCache(cacheKey);
    if (cached) return new SingleResult(cached.id, cached.data);
  }

  if (schoolSlug && table === "students") {
    const academicYear = getActiveAcademicYear(schoolSlug);
    const row = await fetchBranchStudentByIdViaApi(schoolSlug, id, academicYear);
    if (!row) {
      writeDbDocCache(cacheKey, { id, data: null });
      return new SingleResult(id, null);
    }
    writeDbDocCache(cacheKey, { id, data: row });
    return new SingleResult(id, row);
  }

  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
  if (error || !data) {
    writeDbDocCache(cacheKey, { id, data: null });
    return new SingleResult(id, null);
  }
  writeDbDocCache(cacheKey, { id, data: data as Record<string, unknown> });
  return new SingleResult(id, data);
}

async function assignSchoolId(table: string, slugOrUuid: string, data: Record<string, unknown>) {
  const resolved = await resolveSchoolFilter(table, slugOrUuid);
  if (resolved) data[branchScopeColumn(table)] = resolved;
}

export async function upsertData(docPath: string[], data: any, options: any = {}) {
  let table = resolveTable(docPath[0]);
  let id = docPath[1];
  let schoolSlug: string | null = null;

  if (docPath.length === 4) {
    table = resolveTable(docPath[2]);
    schoolSlug = docPath[1];
    id = docPath[3];
    await assignSchoolId(table, docPath[1], data);
  }

  if (schoolSlug && table === "departments") {
    const name = String(data.name ?? "").trim();
    if (!name) throw new Error("Department name is required");

    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId: schoolSlug,
        action: "addDepartment",
        name,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "Failed to save department");
    }
    return;
  }

  data.id = id;
  const { error } = await supabase.from(table).upsert(data);
  if (error) throw error;
}

export async function insertData(collectionPath: string[], data: any) {
  let table = resolveTable(collectionPath[0]);
  if (collectionPath.length === 3) {
    table = resolveTable(collectionPath[2]);
    await assignSchoolId(table, collectionPath[1], data);
  }

  const { data: res, error } = await supabase.from(table).insert(data).select().single();
  if (error) throw error;
  return { id: res.id };
}

export async function patchData(docPath: string[], data: any) {
  let table = resolveTable(docPath[0]);
  let id = docPath[1];
  let schoolSlug: string | null = null;

  if (docPath.length === 4) {
    table = resolveTable(docPath[2]);
    schoolSlug = docPath[1];
    id = docPath[3];
  }

  if (schoolSlug && table === "students") {
    const res = await fetch(`/api/admin/students/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId: schoolSlug, ...data }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || "Failed to update student");
    }
    return;
  }

  const { error } = await supabase.from(table).update(data).eq("id", id);
  if (error) throw error;
}

export async function removeData(docPath: string[]) {
  let table = resolveTable(docPath[0]);
  let id = docPath[1];

  if (docPath.length === 4) {
    table = resolveTable(docPath[2]);
    id = docPath[3];
  }

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export function subscribeData(queryOrDoc: any, onNext: Function, onError?: Function) {
  let isDoc = Array.isArray(queryOrDoc) && (queryOrDoc.length === 2 || queryOrDoc.length === 4);
  let cancelled = false;

  try {
    if (isDoc) {
      const cached = readDbDocCache(buildDbDocCacheKey(queryOrDoc));
      if (cached) onNext(new SingleResult(cached.id, cached.data));
    } else {
      const parsed = parseQueryInput(queryOrDoc);
      if (parsed) {
        const cached = readDbRowsCache(
          buildDbQueryCacheKey(parsed.collectionPath, parsed.constraints)
        );
        if (cached) onNext(new QueryResult(cached));
      }
    }
  } catch {
    // ignore cache hydrate errors
  }

  const load = () => {
    if (cancelled) return;
    if (isDoc) {
      fetchOne(queryOrDoc, { skipCache: true })
        .then((doc) => {
          if (!cancelled) onNext(doc);
        })
        .catch((e) => onError && onError(e));
    } else {
      fetchMany(queryOrDoc, { skipCache: true })
        .then((snap) => {
          if (!cancelled) onNext(snap);
        })
        .catch((e) => onError && onError(e));
    }
  };

  load();

  let schoolSlug: string | null = null;
  if (!isDoc) {
    const path = Array.isArray(queryOrDoc)
      ? queryOrDoc
      : queryOrDoc?.collectionPath;
    if (Array.isArray(path)) {
      schoolSlug = schoolSlugFromCollectionPath(path);
    }
  }

  const onYearChanged = (event: Event) => {
    if (cancelled || !schoolSlug) return;
    const detail = (event as CustomEvent<AcademicYearChangedDetail>).detail;
    if (detail?.schoolSlug === schoolSlug) load();
  };

  if (typeof window !== "undefined" && schoolSlug) {
    window.addEventListener(ACADEMIC_YEAR_CHANGED_EVENT, onYearChanged);
  }

  return () => {
    cancelled = true;
    if (typeof window !== "undefined" && schoolSlug) {
      window.removeEventListener(ACADEMIC_YEAR_CHANGED_EVENT, onYearChanged);
    }
  };
}

export function getTimestamp() {
  return new Date().toISOString();
}
export function incrementValue(n: number) {
  return n;
}

export const db = {};

type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  getIdToken: () => Promise<string>;
};

export const auth = {
  currentUser: null as AuthUser | null,
  signOut: async () => {},
};

export { hasDbQueryCache } from "@/lib/dbQueryCache";

export async function uploadFile(path: string, file: File) {
  const { data, error } = await supabase.storage.from("uploads").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(path);
  return publicUrlData.publicUrl;
}
