import { sortGrades } from "@/lib/gradeOrder";

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
  const grades = classes.map(gradeOf).filter(Boolean);
  return sortGrades([...new Set(grades)]);
}

export function uniqueSectionsFromClasses(classes: ClassLike[]): string[] {
  const sections = classes
    .map((c) => String(c.section ?? "").trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(sections)].sort((a, b) => a.localeCompare(b));
}

export function sectionsForGrade(classes: ClassLike[], grade: string): string[] {
  const want = grade.trim();
  const sections = classes
    .filter((c) => gradeOf(c) === want)
    .map((c) => String(c.section ?? "").trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(sections)].sort((a, b) => a.localeCompare(b));
}
