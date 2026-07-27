import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  deleteSubjectDoc,
  loadAllSubjectDocs,
  loadSubjectDoc,
  saveSubjectDoc,
  subjectDocId,
  subjectDisplayName,
  type SubjectDocData,
} from "@/lib/subjectStore";
import { loadAllTimetableDocs } from "@/lib/timetableStore";
import {
  buildSubjectCatalogFromTimetables,
  buildSubjectTeacherMapFromTimetables,
  lookupSubjectTeachers,
  subjectMatchKey,
} from "@/lib/subjectTimetableTeachers";
import { withServerCache } from "@/lib/serverQueryCache";

export type BranchSubjectRecord = {
  id: string;
  classId: string;
  section: string;
  name: string;
  description: string;
  portions: unknown[];
  academicYear?: string;
  source?: string;
  teachers: string[];
  teacherName: string;
  studentCount: number;
  weeklyPeriods: number;
};

function shapeSubjectRow(
  id: string,
  data: SubjectDocData,
  timetableTeachers?: { teachers: string[]; weeklyPeriods: number } | null
): BranchSubjectRecord {
  const classId = String(data.classId ?? "");
  const section = String(data.section ?? "");
  const name = String(data.name ?? "");
  const storedTeachers = Array.isArray(data.teachers)
    ? data.teachers.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const teachers =
    timetableTeachers?.teachers?.length ? timetableTeachers.teachers : storedTeachers;
  const teacherName =
    teachers[0] ||
    String(data.teacherName ?? "").trim() ||
    "";
  const weeklyPeriods =
    timetableTeachers?.weeklyPeriods && timetableTeachers.weeklyPeriods > 0
      ? timetableTeachers.weeklyPeriods
      : Number(data.weeklyPeriods ?? 0) || 0;

  return {
    id,
    classId,
    section,
    name,
    description: String(data.description ?? subjectDisplayName(name)),
    portions: Array.isArray(data.portions) ? data.portions : [],
    academicYear: data.academicYear,
    source: data.source,
    teachers,
    teacherName,
    studentCount: Number(data.studentCount ?? 0) || 0,
    weeklyPeriods,
  };
}

export async function loadBranchSubjects(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
): Promise<BranchSubjectRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(academicYear ?? "").trim();
  // v3: when year is set, subject list is driven by that year's timetable cells.
  const cacheKey = `subjects|v3|${branchId}|${year || "all"}`;

  return withServerCache(
    cacheKey,
    async () => {
      const [docs, timetableDocs] = await Promise.all([
        loadAllSubjectDocs(admin, branchId),
        year ? loadAllTimetableDocs(admin, branchId, year) : Promise.resolve([]),
      ]);

      const teacherMap = year
        ? buildSubjectTeacherMapFromTimetables(
            timetableDocs.map((row) => row.data),
            year
          )
        : new Map();

      // Academic-year Subjects page: only subjects that appear in the timetable.
      if (year && teacherMap.size > 0) {
        const catalog = buildSubjectCatalogFromTimetables(
          timetableDocs.map((row) => row.data),
          year
        );

        const existingByKey = new Map<string, { id: string; data: SubjectDocData }>();
        for (const row of docs) {
          if (String(row.data.academicYear ?? "").trim() !== year) continue;
          const key = `${String(row.data.classId ?? "").trim().toUpperCase()}|${String(row.data.section ?? "").trim().toUpperCase()}|${subjectMatchKey(String(row.data.name ?? ""))}`;
          if (!existingByKey.has(key)) existingByKey.set(key, row);
        }

        return catalog
          .map((entry) => {
            const key = `${entry.grade.trim().toUpperCase()}|${entry.section.trim().toUpperCase()}|${subjectMatchKey(entry.name)}`;
            const existing = existingByKey.get(key);
            const assignment = lookupSubjectTeachers(teacherMap, entry.grade, entry.section, entry.name);
            const data: SubjectDocData = {
              classId: entry.grade,
              section: entry.section,
              name: entry.name,
              description: existing?.data.description || subjectDisplayName(entry.name),
              portions: Array.isArray(existing?.data.portions) ? existing!.data.portions : [],
              academicYear: year,
              source: existing?.data.source || "timetable",
              teachers: entry.teachers,
              teacherName: entry.teachers[0] || "",
              studentCount: Number(existing?.data.studentCount ?? 0) || 0,
              weeklyPeriods: entry.weeklyPeriods,
            };
            const id =
              existing?.id ||
              subjectDocId(entry.grade, entry.section, entry.name, year);
            return shapeSubjectRow(id, data, assignment);
          })
          .sort((a, b) => {
            const g = a.classId.localeCompare(b.classId, undefined, { sensitivity: "base" });
            if (g !== 0) return g;
            const s = a.section.localeCompare(b.section, undefined, { sensitivity: "base" });
            if (s !== 0) return s;
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
          });
      }

      return docs
        .map(({ id, data }) => {
          const assignment = year
            ? lookupSubjectTeachers(
                teacherMap,
                String(data.classId ?? ""),
                String(data.section ?? ""),
                String(data.name ?? "")
              )
            : null;
          return shapeSubjectRow(id, data, assignment);
        })
        .filter((row) => {
          if (!year) return true;
          return String(row.academicYear ?? "").trim() === year;
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    },
    60_000
  );
}

export async function loadBranchSubjectById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  subjectId: string
): Promise<BranchSubjectRecord | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  const doc = await loadSubjectDoc(admin, branchId, subjectId);
  if (!doc) return null;
  return shapeSubjectRow(subjectId, doc);
}

export async function saveBranchSubject(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: SubjectDocData & { id?: string }
): Promise<BranchSubjectRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const classId = String(payload.classId ?? "").trim();
  const section = String(payload.section ?? "").trim();
  const name = String(payload.name ?? "").trim();
  if (!classId || !section || !name) {
    throw new Error("Grade, section and subject name are required");
  }

  const id =
    String(payload.id ?? "").trim() ||
    subjectDocId(classId, section, name, payload.academicYear);

  await saveSubjectDoc(admin, branchId, id, {
    ...payload,
    classId,
    section,
    name,
    description:
      String(payload.description ?? "").trim() || subjectDisplayName(name),
    teachers: Array.isArray(payload.teachers)
      ? payload.teachers.map((t) => String(t).trim()).filter(Boolean)
      : [],
    teacherName: String(payload.teacherName ?? "").trim() || undefined,
    studentCount: Number(payload.studentCount ?? 0) || 0,
    weeklyPeriods: Number(payload.weeklyPeriods ?? 0) || 0,
  });

  const saved = await loadSubjectDoc(admin, branchId, id);
  if (!saved) throw new Error("Failed to load saved subject");
  return shapeSubjectRow(id, saved);
}

export async function deleteBranchSubject(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  subjectId: string
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteSubjectDoc(admin, branchId, subjectId);
}
