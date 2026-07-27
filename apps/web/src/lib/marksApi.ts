import { adminFetch } from "@/lib/adminApi";

export type MarksIndexEntry = {
  id: string;
  exam: string;
  grade: string;
  section: string;
  subject: string;
  academicYear?: string;
};

export type MarksDoc = {
  id: string;
  exam: string;
  grade: string;
  section: string;
  subject: string;
  academicYear?: string;
  maxMarks?: number | null;
  rows: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function marksParams(
  schoolId: string,
  academicYear?: string | null,
  extra?: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams({ schoolId });
  if (academicYear) params.set("academicYear", academicYear);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      const v = String(value ?? "").trim();
      if (v) params.set(key, v);
    }
  }
  return params;
}

/** Lightweight catalog — titles only, no mark rows (fast dropdowns). */
export async function fetchMarksIndex(
  schoolId: string,
  academicYear?: string | null
): Promise<MarksIndexEntry[]> {
  const params = marksParams(schoolId, academicYear, { resource: "index" });
  const res = await adminFetch(`/api/admin/marks?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return (data.index ?? []) as MarksIndexEntry[];
}

/** Full marks docs, optionally scoped to class/section/exam (fast report cards). */
export async function fetchMarksDocs(
  schoolId: string,
  academicYear?: string | null,
  filters?: { grade?: string; section?: string; exam?: string }
): Promise<MarksDoc[]> {
  const params = marksParams(schoolId, academicYear, filters);
  const res = await adminFetch(`/api/admin/marks?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return (data.marks ?? []) as MarksDoc[];
}
