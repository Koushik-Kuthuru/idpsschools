import type { SupabaseClient } from "@supabase/supabase-js";

export const SUBJECT_NOTICE_PREFIX = "__subject__:";

export type SubjectDocData = {
  classId?: string;
  section?: string;
  name?: string;
  description?: string;
  portions?: unknown[];
  academicYear?: string;
  source?: string;
  /** Teachers explicitly assigned from timetable cells */
  teachers?: string[];
  /** Primary / display teacher name */
  teacherName?: string;
  /** Students enrolled in this class-section for the academic year */
  studentCount?: number;
  /** Weekly periods this subject appears in the timetable */
  weeklyPeriods?: number;
  updatedAt?: string;
};

function keyPart(v: string) {
  return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

export function subjectDocId(grade: string, section: string, name: string, academicYear?: string) {
  const year = String(academicYear ?? "").trim();
  if (year) {
    return `subj__${keyPart(year)}__${keyPart(grade)}__${keyPart(section)}__${keyPart(name)}`;
  }
  return `subj__${keyPart(grade)}__${keyPart(section)}__${keyPart(name)}`;
}

/** Timetable / teacher-sheet class codes keyed by grade|section */
const CLASS_CODE_BY_KEY: Record<string, string> = {
  "XII|HAWKINGS": "12-H",
  "XI (MPC)|CYGNUS": "11-C",
  "XI (BiPC)|CYGNUS": "11-N",
  "XI + NDA|NDA": "11-NDA",
  "X|GAGARIAN": "10-G",
  "X|ARMSTRONG": "10-A",
  "IX|EINSTEIN": "9-E",
  "IX|NEWTON": "9-N",
  "VIII|FLEMING(CO-SPARK)": "8-F",
  "VIII|DARWIN": "8-D",
  "VIII|WALLACE": "8-W",
  "VII|GALILEO(CO-SPARK)": "7-G",
  "VII|KEPLER": "7-K",
  "VI|BACH(CO-SPARK)": "6-B",
  "VI|MOZART": "6-M",
  "V|GANGES(CO-SPARK)": "5-G",
  "V|INDUS": "5-I",
  "IV|MOON(CO-SPARK)": "4-M",
  "IV|TITAN": "4-T",
  "III|MARS(CO-SPARK)": "3-M",
  "III|VENUS": "3-V",
  "II|KOALAS(CO-SPARK)": "2-K",
  "II|KANGAROOS": "2-G",
  "I|DAISY": "1-D",
};

const ROMAN_GRADE_NUM: Record<string, string> = {
  XII: "12",
  XI: "11",
  X: "10",
  IX: "9",
  VIII: "8",
  VII: "7",
  VI: "6",
  V: "5",
  IV: "4",
  III: "3",
  II: "2",
  I: "1",
};

function classKey(grade: string, section: string) {
  return `${String(grade ?? "").trim()}|${String(section ?? "").trim()}`;
}

function fallbackClassCode(grade: string, section: string) {
  const g = String(grade ?? "").trim();
  const sec = String(section ?? "")
    .replace(/\(CO-SPARK\)/gi, "")
    .trim();
  const sectionLetter = sec.charAt(0).toUpperCase() || "X";

  for (const [roman, num] of Object.entries(ROMAN_GRADE_NUM)) {
    if (g === roman || g.startsWith(`${roman} `) || g.startsWith(`${roman}(`)) {
      return `${num}-${sectionLetter}`;
    }
  }

  const gradeSlug = g.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "CLS";
  const sectionSlug = sec.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "A";
  return `${gradeSlug}-${sectionSlug}`;
}

/** Numeric / short grade code only — e.g. I → 1, XI (MPC) → 11. */
export function gradeCodeOnly(classId: string): string {
  const g = String(classId ?? "").trim();
  if (!g) return "CLS";

  for (const [roman, num] of Object.entries(ROMAN_GRADE_NUM)) {
    if (g === roman || g.startsWith(`${roman} `) || g.startsWith(`${roman}(`) || g.startsWith(`${roman}+`)) {
      return num;
    }
  }

  const arabic = g.match(/\b(\d{1,2})\b/);
  if (arabic) return arabic[1];

  return g.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "CLS";
}

function subjectCodeSlug(subjectName: string): string {
  return String(subjectName ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "SUBJ";
}

/**
 * Class + subject code (no section), e.g. 1-EVS, 4-SCIENCE, 10-MATHEMATICS.
 * `section` is kept for call-site compatibility but is not used in the code.
 */
export function buildClassSubjectCode(classId: string, _section: string, subjectName: string) {
  return `${gradeCodeOnly(classId)}-${subjectCodeSlug(subjectName)}`;
}

export function classCodeForGradeSection(classId: string, section: string) {
  return CLASS_CODE_BY_KEY[classKey(classId, section)] ?? fallbackClassCode(classId, section);
}

export function subjectNoticeTitle(docId: string) {
  return `${SUBJECT_NOTICE_PREFIX}${docId}`;
}

export function docIdFromSubjectTitle(title: string) {
  if (!title.startsWith(SUBJECT_NOTICE_PREFIX)) return null;
  return title.slice(SUBJECT_NOTICE_PREFIX.length);
}

function parseJsonContent(content: unknown): SubjectDocData | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as SubjectDocData;
  } catch {
    return null;
  }
}

export async function loadSubjectDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<(SubjectDocData & { id: string }) | null> {
  const { data, error } = await client
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", subjectNoticeTitle(docId))
    .maybeSingle();

  if (error || !data?.content) return null;
  const parsed = parseJsonContent(data.content);
  if (!parsed) return null;
  return { ...parsed, id: docId };
}

export async function saveSubjectDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string,
  payload: SubjectDocData
): Promise<void> {
  const title = subjectNoticeTitle(docId);
  const { code: _ignoredCode, ...withoutCode } = payload as SubjectDocData & { code?: string };
  const content = JSON.stringify({ ...withoutCode, updatedAt: new Date().toISOString() });

  const { data: existing, error: loadError } = await client
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await client.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await client.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}

export async function deleteSubjectDoc(
  client: SupabaseClient<any>,
  branchId: string,
  docId: string
): Promise<void> {
  const { error } = await client
    .from("notices")
    .delete()
    .eq("branch_id", branchId)
    .eq("title", subjectNoticeTitle(docId));

  if (error) throw new Error(error.message);
}

export async function loadAllSubjectDocs(
  client: SupabaseClient<any>,
  branchId: string
): Promise<Array<{ id: string; data: SubjectDocData }>> {
  const { data, error } = await client
    .from("notices")
    .select("title, content")
    .eq("branch_id", branchId)
    .like("title", `${SUBJECT_NOTICE_PREFIX}%`);

  if (error || !data) return [];

  const rows: Array<{ id: string; data: SubjectDocData }> = [];
  for (const row of data) {
    const id = docIdFromSubjectTitle(String(row.title ?? ""));
    if (!id) continue;
    const parsed = parseJsonContent(row.content);
    if (!parsed) continue;
    rows.push({ id, data: parsed });
  }
  return rows;
}

/** Human-readable labels for common timetable subject codes. */
export const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  PHY: "Physics",
  PHYSICS: "Physics",
  MATHS: "Mathematics",
  MATHEMATICS: "Mathematics",
  ENG: "English",
  ENGLISH: "English",
  "COM.SCI": "Computer Science",
  COMPUTER: "Computer",
  CHEM: "Chemistry",
  CHEMISTRY: "Chemistry",
  BIO: "Biology",
  BIOLOGY: "Biology",
  SST: "Social Studies",
  SOCIAL_SCIENCE: "Social Science",
  SOCIAL_STUDIES: "Social Studies",
  SCIENCE: "Science",
  EVS: "EVS",
  "II-LANG": "Second Language",
  "CHE-IIT": "Chemistry (IIT)",
  "PHY-IIT": "Physics (IIT)",
  "MATH-IIT": "Mathematics (IIT)",
  ROBO: "Robotics",
  SPACELAB: "Space Lab",
  GAMES: "Games",
  "A&C": "Arts & Crafts",
  ART: "Art",
  IT: "Information Technology",
  NDA: "NDA Preparation",
  "SWIM-B": "Swimming",
  HINDI: "Hindi",
  TELUGU: "Telugu",
  SANSKRIT: "Sanskrit",
  FRENCH: "French",
  LIBRARY: "Library",
  YOGA: "Yoga",
  GK: "General Knowledge",
  STUDY_HOUR: "Study Hour",
  ACTIVITY: "Activity",
};

export function subjectDisplayName(code: string) {
  const key = String(code ?? "").trim().toUpperCase();
  return SUBJECT_DISPLAY_NAMES[key] ?? String(code ?? "").trim();
}

export function extractSubjectsFromPeriodGrid(
  grade: string,
  section: string,
  periodGrid: Record<string, Record<string, Array<{ subject?: string }>>>
) {
  const names = new Set<string>();
  for (const day of Object.values(periodGrid ?? {})) {
    for (const period of Object.values(day ?? {})) {
      for (const entry of period ?? []) {
        const name = String(entry?.subject ?? "").trim();
        if (name) names.add(name);
      }
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b)).map((name) => ({
    grade,
    section,
    name,
    description: subjectDisplayName(name),
  }));
}
