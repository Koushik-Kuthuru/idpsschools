import { gradeIdentityKey, gradesMatchForClass, sortGrades } from "@/lib/gradeOrder";

type ClassLike = {
  grade?: string;
  name?: string;
  class_name?: string;
  section?: string;
};

function gradeOf(c: ClassLike): string {
  return String(c.grade ?? c.name ?? c.class_name ?? "").trim();
}

export function uniqueGradesFromClasses(classes: ClassLike[]): string[] {
  const seen = new Set<string>();
  const grades: string[] = [];
  for (const c of classes) {
    const g = gradeOf(c);
    if (!g) continue;
    const key = gradeIdentityKey(g);
    if (seen.has(key)) continue;
    seen.add(key);
    grades.push(g);
  }
  return sortGrades(grades);
}

export function uniqueSectionsFromClasses(classes: ClassLike[]): string[] {
  const sections = classes
    .map((c) => String(c.section ?? "").trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(sections)].sort((a, b) => a.localeCompare(b));
}

export function sectionsForGrade(classes: ClassLike[], grade: string): string[] {
  const sections = classes
    .filter((c) => gradesMatchForClass(gradeOf(c), grade))
    .map((c) => String(c.section ?? "").trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(sections)].sort((a, b) => a.localeCompare(b));
}
