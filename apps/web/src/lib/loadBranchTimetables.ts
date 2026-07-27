import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  loadAllTimetableDocs,
  loadTimetableDoc,
  loadTimetableTemplate,
  saveTimetableDoc,
  saveTimetableTemplate,
  type TimetableDocData,
} from "@/lib/timetableStore";
import {
  buildTeacherPeriodGrid,
  flattenTeacherGridToPeriods,
  teacherClassSubjectsFromDocs,
  type TeacherTimetablePeriodRow,
} from "@/lib/teacherTimetableUtils";
import {
  DEFAULT_TERM_KEY,
  normalizePeriodGrid,
  timetableDays,
} from "@/components/admin/timetable/timetablePeriodGrid";
import {
  defaultTimetableTemplate,
  normalizeTimetableTemplate,
} from "@/components/admin/timetable/timetableTemplate";

export type BranchTimetableRecord = TimetableDocData & { id: string };

export async function loadBranchTimetables(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  termKey?: string | null
): Promise<BranchTimetableRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const docs = await loadAllTimetableDocs(admin, branchId, termKey ?? undefined);
  return docs.map(({ id, data }) => ({ id, ...data }));
}

export async function loadBranchTimetableById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  docId: string
): Promise<BranchTimetableRecord | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  const doc = await loadTimetableDoc(admin, branchId, docId);
  if (!doc) return null;
  const { id: _ignored, ...data } = doc as TimetableDocData & { id: string };
  return { id: docId, ...data };
}

export async function saveBranchTimetable(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  docId: string,
  payload: TimetableDocData
): Promise<BranchTimetableRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  await saveTimetableDoc(admin, branchId, docId, payload);
  const saved = await loadTimetableDoc(admin, branchId, docId);
  if (!saved) throw new Error("Failed to load saved timetable");
  const { id: _ignored, ...data } = saved as TimetableDocData & { id: string };
  return { id: docId, ...data };
}

export async function loadBranchTimetableTemplate(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<Record<string, unknown> | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  return loadTimetableTemplate(admin, branchId);
}

export async function saveBranchTimetableTemplate(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  await saveTimetableTemplate(admin, branchId, payload);
  const saved = await loadTimetableTemplate(admin, branchId);
  return saved ?? payload;
}

export async function resolveTimetableTermKey(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  preferredTerm?: string | null
): Promise<string> {
  const docs = await loadBranchTimetables(admin, schoolSlug, null);
  const terms = Array.from(
    new Set(docs.map((doc) => String(doc.key ?? "").trim()).filter(Boolean))
  ).sort();

  if (preferredTerm && docs.some((doc) => doc.key === preferredTerm)) {
    return preferredTerm;
  }

  const termsWithTeacherDocs = terms.filter((term) =>
    docs.some((doc) => doc.key === term && doc.scope === "teacher")
  );

  if (termsWithTeacherDocs.includes(DEFAULT_TERM_KEY)) {
    return DEFAULT_TERM_KEY;
  }

  return termsWithTeacherDocs.at(-1) ?? preferredTerm ?? DEFAULT_TERM_KEY;
}

export async function loadTeacherTimetablePeriods(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  teacherName: string,
  termKey?: string | null,
  dayFilter?: string | null
): Promise<TeacherTimetablePeriodRow[]> {
  const term = await resolveTimetableTermKey(admin, schoolSlug, termKey ?? undefined);
  const [docs, template] = await Promise.all([
    loadBranchTimetables(admin, schoolSlug, term),
    loadBranchTimetableTemplate(admin, schoolSlug),
  ]);

  if (!teacherName.trim()) return [];

  const { grid } = buildTeacherPeriodGrid(docs, teacherName, term, template);
  return flattenTeacherGridToPeriods(grid, template, dayFilter ?? undefined);
}

export async function loadTeacherClassSubjects(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  teacherName: string,
  termKey?: string | null
) {
  const term = await resolveTimetableTermKey(admin, schoolSlug, termKey ?? undefined);
  const [docs, template] = await Promise.all([
    loadBranchTimetables(admin, schoolSlug, term),
    loadBranchTimetableTemplate(admin, schoolSlug),
  ]);
  if (!teacherName.trim()) return [];
  return teacherClassSubjectsFromDocs(docs, teacherName, term, template);
}

export async function loadClassTeacherNames(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  grade: string,
  section: string,
  termKey?: string | null
): Promise<Array<{ name: string; subjects: string[] }>> {
  const term = await resolveTimetableTermKey(admin, schoolSlug, termKey ?? undefined);
  const [docs, template] = await Promise.all([
    loadBranchTimetables(admin, schoolSlug, term),
    loadBranchTimetableTemplate(admin, schoolSlug),
  ]);
  const normalize = (value: unknown) => String(value ?? "").trim().toUpperCase();
  const classDoc = docs.find(
    (doc) =>
      doc.scope !== "teacher" &&
      normalize(doc.grade) === normalize(grade) &&
      normalize(doc.section) === normalize(section)
  );
  if (!classDoc) return [];

  const normalizedTemplate = normalizeTimetableTemplate(template ?? defaultTimetableTemplate);
  const grid = normalizePeriodGrid(classDoc.periodGrid ?? classDoc.timetable, normalizedTemplate);
  const byTeacher = new Map<string, { name: string; subjects: Set<string> }>();
  for (const day of timetableDays) {
    for (const entries of Object.values(grid[day] ?? {})) {
      for (const entry of entries) {
        const name = String(entry.teacher ?? "").trim();
        const subject = String(entry.subject ?? "").trim();
        if (!name || name === "—" || name === "-") continue;
        const key = name.toLowerCase();
        const current = byTeacher.get(key) ?? { name, subjects: new Set<string>() };
        if (subject && subject !== "—" && subject !== "-") current.subjects.add(subject);
        byTeacher.set(key, current);
      }
    }
  }
  return Array.from(byTeacher.values()).map((row) => ({
    name: row.name,
    subjects: Array.from(row.subjects),
  }));
}

export type StudentTimetablePeriodRow = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  teacher_name: string;
  room: string;
  accent: string;
  period_id: string;
  period_label: string;
};

/** Class timetable for a student (grade + section), flattened to period rows. */
export async function loadStudentClassTimetablePeriods(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  grade: string,
  section: string,
  termKey?: string | null
): Promise<StudentTimetablePeriodRow[]> {
  const normalize = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(/^CLASS\s+/i, "");
  const wantGrade = normalize(grade);
  const wantSection = normalize(section);
  if (!wantGrade || !wantSection) return [];

  const preferred = String(termKey ?? "").trim() || null;
  const term = await resolveTimetableTermKey(admin, schoolSlug, preferred);
  const [docs, template] = await Promise.all([
    loadBranchTimetables(admin, schoolSlug, term),
    loadBranchTimetableTemplate(admin, schoolSlug),
  ]);

  const matchClassDoc = (list: BranchTimetableRecord[]) =>
    list.find(
      (doc) =>
        doc.scope !== "teacher" &&
        normalize(doc.grade) === wantGrade &&
        normalize(doc.section) === wantSection
    );

  let classDoc = matchClassDoc(docs);
  // If preferred year/term has no class grid, scan all docs.
  if (!classDoc) {
    const allDocs = await loadBranchTimetables(admin, schoolSlug, null);
    classDoc = matchClassDoc(allDocs);
  }
  if (!classDoc) return [];

  const normalizedTemplate = normalizeTimetableTemplate(template ?? defaultTimetableTemplate);
  const grid = normalizePeriodGrid(classDoc.periodGrid ?? classDoc.timetable, normalizedTemplate);
  const rows: StudentTimetablePeriodRow[] = [];
  let rowId = 0;

  for (const day of timetableDays) {
    for (const period of normalizedTemplate.periods) {
      const entries = grid[day]?.[period.id] ?? [];
      for (const entry of entries) {
        const subject = String(entry.subject ?? "").trim();
        const teacher = String(entry.teacher ?? "").trim();
        if (!subject || subject === "—" || subject === "-") continue;
        rows.push({
          id: `${day}-${period.id}-${rowId++}`,
          day_of_week: day,
          start_time: period.startTime,
          end_time: period.endTime,
          subject_name: subject,
          teacher_name: teacher === "—" || teacher === "-" ? "" : teacher,
          room: "",
          accent: "#144835",
          period_id: period.id,
          period_label: period.label ?? period.id,
        });
      }
    }
  }

  return rows;
}
