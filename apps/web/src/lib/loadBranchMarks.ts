import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { fetchAllPaginated } from "@/lib/studentProfileStore";
import { withServerCache } from "@/lib/serverQueryCache";

export const MARKS_NOTICE_PREFIX = "__marks__:";
export const EXAM_TYPE_NOTICE_PREFIX = "__exam_type__:";

export type BranchMarksRow = {
  studentId: string;
  roll?: string;
  admissionNo?: string;
  studentName?: string;
  marks: number | null;
  gradeLabel?: string;
  absent?: boolean;
  maxMarks?: number | null;
};

export type BranchMarksDoc = {
  id: string;
  exam: string;
  grade: string;
  section: string;
  subject: string;
  academicYear?: string;
  maxMarks?: number | null;
  rows: BranchMarksRow[];
  updatedAt?: string;
  sourceFile?: string;
};

export type BranchMarksIndexEntry = {
  id: string;
  exam: string;
  grade: string;
  section: string;
  subject: string;
  academicYear?: string;
};

function keyPart(v: string) {
  return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

function decodeKeyPart(v: string) {
  try {
    return decodeURIComponent(String(v).replace(/_/g, "%"));
  } catch {
    return String(v);
  }
}

export function marksDocId(
  exam: string,
  grade: string,
  section: string,
  subject: string,
  academicYear?: string | null
) {
  const base = `${keyPart(exam)}__${keyPart(grade)}__${keyPart(section)}__${keyPart(subject)}`;
  const year = String(academicYear ?? "").trim();
  return year ? `${keyPart(year)}__${base}` : base;
}

function marksNoticeTitle(docId: string) {
  return `${MARKS_NOTICE_PREFIX}${docId}`;
}

/** Parse doc id embedded in notice title (no JSON). */
export function parseMarksDocId(docId: string): BranchMarksIndexEntry | null {
  const parts = String(docId).split("__");
  if (parts.length >= 5) {
    return {
      id: docId,
      academicYear: decodeKeyPart(parts[0]),
      exam: decodeKeyPart(parts[1]),
      grade: decodeKeyPart(parts[2]),
      section: decodeKeyPart(parts[3]),
      subject: decodeKeyPart(parts.slice(4).join("__")),
    };
  }
  if (parts.length === 4) {
    return {
      id: docId,
      exam: decodeKeyPart(parts[0]),
      grade: decodeKeyPart(parts[1]),
      section: decodeKeyPart(parts[2]),
      subject: decodeKeyPart(parts[3]),
    };
  }
  return null;
}

function marksTitlePattern(
  academicYear?: string | null,
  filters?: { grade?: string | null; section?: string | null }
) {
  const year = String(academicYear ?? "").trim();
  const grade = String(filters?.grade ?? "").trim();
  const section = String(filters?.section ?? "").trim();

  if (year && grade && section) {
    return `${MARKS_NOTICE_PREFIX}${keyPart(year)}__%__${keyPart(grade)}__${keyPart(section)}__%`;
  }
  if (year) return `${MARKS_NOTICE_PREFIX}${keyPart(year)}__%`;
  return `${MARKS_NOTICE_PREFIX}%`;
}

function parseMarksDoc(notice: { title: string; content: string }): BranchMarksDoc | null {
  const id = String(notice.title).slice(MARKS_NOTICE_PREFIX.length);
  try {
    const parsed = JSON.parse(String(notice.content ?? "{}")) as BranchMarksDoc;
    return {
      ...parsed,
      id: parsed.id ?? id,
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
    };
  } catch {
    return null;
  }
}

export type LoadBranchMarksFilters = {
  grade?: string | null;
  section?: string | null;
  exam?: string | null;
};

export async function loadBranchMarksIndex(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
): Promise<BranchMarksIndexEntry[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(academicYear ?? "").trim();
  const cacheKey = `marks-index|${branchId}|${year}`;

  return withServerCache(
    cacheKey,
    async () => {
      const notices = await fetchAllPaginated<{ title: string }>(admin, "notices", "title", (query) => {
        let q = query.eq("branch_id", branchId).like("title", `${MARKS_NOTICE_PREFIX}%`);
        if (year) q = q.like("title", `${MARKS_NOTICE_PREFIX}${keyPart(year)}__%`);
        return q;
      });

      const entries: BranchMarksIndexEntry[] = [];
      for (const notice of notices) {
        const id = String(notice.title).slice(MARKS_NOTICE_PREFIX.length);
        const parsed = parseMarksDocId(id);
        if (parsed) entries.push(parsed);
      }
      return entries;
    },
    120_000
  );
}

export async function loadBranchMarks(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null,
  filters?: LoadBranchMarksFilters
): Promise<BranchMarksDoc[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(academicYear ?? "").trim();
  const grade = String(filters?.grade ?? "").trim();
  const section = String(filters?.section ?? "").trim();
  const exam = String(filters?.exam ?? "").trim();
  const cacheKey = `marks|${branchId}|${year}|${grade}|${section}|${exam}`;

  return withServerCache(
    cacheKey,
    async () => {
      const titlePattern = marksTitlePattern(year, { grade, section });
      const notices = await fetchAllPaginated<{ title: string; content: string }>(
        admin,
        "notices",
        "title, content",
        (query) => {
          let q = query.eq("branch_id", branchId).like("title", titlePattern);
          if (year && !grade) q = q.like("title", `${MARKS_NOTICE_PREFIX}${keyPart(year)}__%`);
          return q;
        }
      );

      const docs: BranchMarksDoc[] = [];
      for (const notice of notices) {
        const doc = parseMarksDoc(notice);
        if (!doc) continue;
        if (exam && String(doc.exam ?? "").trim() !== exam) continue;
        if (grade && String(doc.grade ?? "").trim() !== grade) continue;
        if (section && String(doc.section ?? "").trim().toUpperCase() !== section.toUpperCase()) {
          continue;
        }
        docs.push(doc);
      }
      return docs;
    },
    grade && section ? 90_000 : 60_000
  );
}

export async function loadBranchMarksDoc(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  docId: string
): Promise<BranchMarksDoc | null> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId || !docId) return null;

  const { data, error } = await admin
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .eq("title", marksNoticeTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  try {
    const parsed = JSON.parse(String(data.content)) as BranchMarksDoc;
    return { ...parsed, id: parsed.id ?? docId, rows: Array.isArray(parsed.rows) ? parsed.rows : [] };
  } catch {
    return null;
  }
}

export async function saveBranchMarksDoc(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  doc: BranchMarksDoc
): Promise<BranchMarksDoc> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const id =
    String(doc.id ?? "").trim() ||
    marksDocId(doc.exam, doc.grade, doc.section, doc.subject, doc.academicYear);
  const payload: BranchMarksDoc = {
    ...doc,
    id,
    updatedAt: new Date().toISOString(),
  };
  const title = marksNoticeTitle(id);
  const content = JSON.stringify(payload);

  const { data: existing } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("notices").insert({
      branch_id: branchId,
      title,
      content,
      target: "system",
      posted_on: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
  }

  return payload;
}

export async function loadBranchExamTypes(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYear?: string | null
): Promise<Array<Record<string, unknown>>> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const year = String(academicYear ?? "").trim();
  const notices = await fetchAllPaginated<{ title: string; content: string }>(
    admin,
    "notices",
    "title, content",
    (query) => {
      let q = query.eq("branch_id", branchId).like("title", `${EXAM_TYPE_NOTICE_PREFIX}%`);
      if (year) q = q.like("title", `${EXAM_TYPE_NOTICE_PREFIX}${keyPart(year)}__%`);
      return q;
    }
  );

  return notices.map((notice) => {
    const id = String(notice.title).slice(EXAM_TYPE_NOTICE_PREFIX.length);
    try {
      const parsed = JSON.parse(String(notice.content ?? "{}")) as Record<string, unknown>;
      return { id, ...parsed };
    } catch {
      return { id, name: id };
    }
  });
}
