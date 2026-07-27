import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  loadAllMicroScheduleDocs,
  loadMicroScheduleDoc,
  saveMicroScheduleDoc,
  deleteMicroScheduleDoc,
  microScheduleDocId,
  formatMicroScheduleTitle,
  type MicroScheduleDocData,
} from "@/lib/microScheduleStore";

export type BranchMicroScheduleRecord = MicroScheduleDocData & {
  id: string;
  label: string;
};

function shapeRow(id: string, data: MicroScheduleDocData): BranchMicroScheduleRecord {
  return {
    id,
    ...data,
    label: formatMicroScheduleTitle(data),
  };
}

export async function loadBranchMicroSchedules(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  termKey?: string | null
): Promise<BranchMicroScheduleRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const docs = await loadAllMicroScheduleDocs(admin, branchId, termKey ?? undefined);
  return docs
    .map(({ id, data }) => shapeRow(id, data))
    .sort((a, b) => (a.label || "").localeCompare(b.label || "", undefined, { sensitivity: "base" }));
}

export async function loadBranchMicroScheduleById(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  docId: string
): Promise<BranchMicroScheduleRecord | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;

  const doc = await loadMicroScheduleDoc(admin, branchId, docId);
  if (!doc) return null;
  const { id: _ignored, ...data } = doc;
  return shapeRow(docId, data);
}

export async function saveBranchMicroSchedule(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: MicroScheduleDocData & { id?: string }
): Promise<BranchMicroScheduleRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const teacherName = String(payload.teacherName ?? "").trim();
  const grade = String(payload.grade ?? "").trim();
  const section = String(payload.section ?? "").trim();
  const subject = String(payload.subject ?? "").trim();
  const termKey = String(payload.termKey ?? "").trim();

  if (!teacherName || !grade || !section || !subject || !termKey) {
    throw new Error("Teacher, class, section, subject and academic year are required");
  }

  const id =
    String(payload.id ?? "").trim() ||
    microScheduleDocId(termKey, teacherName, grade, section, subject);

  await saveMicroScheduleDoc(admin, branchId, id, {
    ...payload,
    teacherName,
    grade,
    section,
    subject,
    termKey,
    rows: Array.isArray(payload.rows) ? payload.rows : [],
  });

  const saved = await loadMicroScheduleDoc(admin, branchId, id);
  if (!saved) throw new Error("Failed to load saved micro schedule");
  const { id: savedId, ...data } = saved;
  return shapeRow(savedId, data);
}

export async function deleteBranchMicroSchedule(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  docId: string
): Promise<void> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteMicroScheduleDoc(admin, branchId, docId);
}
