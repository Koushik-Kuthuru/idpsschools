import { gradeIdentityKey } from "@/lib/gradeOrder";
import type { StaffDisplayRecord } from "@/lib/staffRecord";

export type ClassTeacherInfo = {
  staffId: string;
  name: string;
  employeeId: string;
};

export function classSectionKey(grade: string, section: string): string {
  return `${gradeIdentityKey(grade)}::${String(section).trim().toUpperCase()}`;
}

export function parseClassTeacherLabel(raw: string): { grade: string; section: string } | null {
  const text = String(raw ?? "").trim();
  if (!text || text === "-") return null;

  const dash = text.indexOf("-");
  if (dash <= 0) return null;

  const grade = text.slice(0, dash).trim();
  const section = text.slice(dash + 1).trim();
  if (!grade || !section || section === "-") return null;

  return { grade, section };
}

export function splitClassTeacherLabels(value: unknown): string[] {
  return String(value ?? "")
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter((part) => part && part !== "-");
}

export function indexClassTeachersBySection(
  staff: StaffDisplayRecord[]
): Map<string, ClassTeacherInfo[]> {
  const index = new Map<string, ClassTeacherInfo[]>();

  for (const teacher of staff) {
    const labels = splitClassTeacherLabels(teacher.classTeacher);
    for (const label of labels) {
      const parsed = parseClassTeacherLabel(label);
      if (!parsed) continue;

      const key = classSectionKey(parsed.grade, parsed.section);
      const list = index.get(key) ?? [];
      if (!list.some((entry) => entry.staffId === teacher.id)) {
        list.push({
          staffId: teacher.id,
          name: teacher.name,
          employeeId: teacher.employeeId,
        });
      }
      index.set(key, list);
    }
  }

  return index;
}

export function classTeachersForSection(
  index: Map<string, ClassTeacherInfo[]>,
  grade: string,
  section: string
): ClassTeacherInfo[] {
  return index.get(classSectionKey(grade, section)) ?? [];
}
