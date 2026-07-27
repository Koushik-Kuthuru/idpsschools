import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { fetchAllPaginated } from "@/lib/studentProfileStore";

export const GATE_PASS_NOTICE_PREFIX = "__gate_pass__:";

export type BranchGatePassRecord = {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  grade?: string;
  section?: string;
  academicYear?: string;
  type: string;
  date: string;
  time: string;
  takenBy: string;
  relation: string;
  mobile: string;
  message: string;
  confirmed: boolean;
  confirmedAt?: string | null;
  photo?: string;
  createdAt: string;
  createdByName?: string;
};

function gatePassNoticeTitle(passId: string) {
  return `${GATE_PASS_NOTICE_PREFIX}${passId}`;
}

function parseGatePassNotice(notice: {
  title: string;
  content: string;
  posted_on?: string | null;
  created_at?: string | null;
}): BranchGatePassRecord | null {
  const id = String(notice.title).slice(GATE_PASS_NOTICE_PREFIX.length);
  try {
    const parsed = JSON.parse(String(notice.content ?? "{}")) as BranchGatePassRecord;
    return {
      id: parsed.id ?? id,
      studentId: String(parsed.studentId ?? ""),
      studentName: parsed.studentName,
      admissionNo: parsed.admissionNo,
      grade: parsed.grade,
      section: parsed.section,
      academicYear: parsed.academicYear,
      type: String(parsed.type ?? "Early Departure").trim() || "Early Departure",
      date: String(parsed.date ?? "").slice(0, 10),
      time: String(parsed.time ?? "").trim() || "—",
      takenBy: String(parsed.takenBy ?? "").trim() || "—",
      relation: String(parsed.relation ?? "").trim() || "Guardian",
      mobile: String(parsed.mobile ?? "").trim() || "—",
      message: String(parsed.message ?? "").trim(),
      confirmed: Boolean(parsed.confirmed),
      confirmedAt: parsed.confirmedAt ?? null,
      photo: parsed.photo ? String(parsed.photo) : "",
      createdAt: String(
        parsed.createdAt ?? notice.posted_on ?? notice.created_at ?? new Date().toISOString()
      ),
      createdByName: parsed.createdByName,
    };
  } catch {
    return null;
  }
}

export async function loadBranchGatePasses(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  options: { studentId?: string | null; academicYear?: string | null; limit?: number | null } = {}
): Promise<BranchGatePassRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const studentId = String(options.studentId ?? "").trim();
  const year = String(options.academicYear ?? "").trim();
  const limit = options.limit != null && Number.isFinite(options.limit) ? Number(options.limit) : null;

  const notices = await fetchAllPaginated<{
    title: string;
    content: string;
    posted_on?: string | null;
    created_at?: string | null;
  }>(admin, "notices", "title, content, posted_on, created_at", (query) =>
    query.eq("branch_id", branchId).like("title", `${GATE_PASS_NOTICE_PREFIX}%`)
  );

  const rows: BranchGatePassRecord[] = [];
  for (const notice of notices) {
    const pass = parseGatePassNotice(notice);
    if (!pass || !pass.studentId) continue;
    if (studentId && pass.studentId !== studentId) continue;
    if (year) {
      const passYear = String(pass.academicYear ?? "").trim();
      if (passYear && passYear !== year) continue;
    }
    rows.push(pass);
  }

  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return limit != null ? rows.slice(0, limit) : rows;
}

export async function saveBranchGatePass(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  pass: BranchGatePassRecord
): Promise<BranchGatePassRecord> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const id = String(pass.id || crypto.randomUUID()).trim();
  const record: BranchGatePassRecord = {
    ...pass,
    id,
    studentId: String(pass.studentId ?? "").trim(),
    type: String(pass.type ?? "Early Departure").trim() || "Early Departure",
    date: String(pass.date ?? "").slice(0, 10),
    time: String(pass.time ?? "").trim() || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    takenBy: String(pass.takenBy ?? "").trim(),
    relation: String(pass.relation ?? "Guardian").trim() || "Guardian",
    mobile: String(pass.mobile ?? "").trim(),
    message: String(pass.message ?? "").trim(),
    confirmed: Boolean(pass.confirmed),
    photo: pass.photo ? String(pass.photo) : "",
    createdAt: String(pass.createdAt || new Date().toISOString()),
  };

  if (!record.studentId) throw new Error("studentId required");
  if (!record.date) throw new Error("date required");
  if (!record.takenBy) throw new Error("takenBy required");

  const title = gatePassNoticeTitle(id);
  const payload = {
    branch_id: branchId,
    title,
    content: JSON.stringify(record),
    target: "admin",
    posted_on: record.date || new Date().toISOString().slice(0, 10),
  };

  const { data: existing } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("notices").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("notices").insert(payload);
    if (error) throw new Error(error.message);
  }

  return record;
}
