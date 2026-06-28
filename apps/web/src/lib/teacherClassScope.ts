export type ClassAssignment = {
  grade: string;
  section: string;
  key: string;
};

export function classScopeKey(grade: string, section: string): string {
  return `${String(grade || "").trim()}__${String(section || "").trim().toUpperCase()}`;
}

export function parseClassScopeKey(key: string): { grade: string; section: string } | null {
  const parts = String(key || "").split("__");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { grade: parts[0], section: parts[1] };
}

export function teacherKeysFromDoc(data: Record<string, unknown>): string[] {
  const keys: string[] = [];
  const directGrade = data?.classId ?? data?.grade ?? data?.className ?? data?.homeroomGrade;
  const directSection = data?.section ?? data?.homeroomSection;
  if (directGrade && directSection) {
    keys.push(classScopeKey(String(directGrade), String(directSection)));
  }

  const assignedClasses = Array.isArray(data?.assignedClasses) ? (data.assignedClasses as unknown[]) : [];
  assignedClasses.forEach((v) => {
    const raw = String(v || "").trim();
    const parts = raw.split("-").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) keys.push(classScopeKey(parts[0], parts[1]));
  });

  const classes = Array.isArray(data?.classes) ? (data.classes as Record<string, unknown>[]) : [];
  classes.forEach((c) => {
    const g = c?.grade ?? c?.classId ?? c?.name;
    const s = c?.section;
    if (g && s) keys.push(classScopeKey(String(g), String(s)));
  });

  return Array.from(new Set(keys));
}

export function studentMatchesClassScope(
  student: { classId?: string; grade?: string; section?: string },
  allowedKeys: Set<string>
): boolean {
  if (allowedKeys.size === 0) return false;
  const grade = String(student.classId ?? student.grade ?? "").trim();
  const section = String(student.section ?? "").trim();
  if (!grade || !section) return false;
  return allowedKeys.has(classScopeKey(grade, section));
}

export function assignmentsFromKeys(keys: string[]): ClassAssignment[] {
  return keys
    .map((key) => {
      const parsed = parseClassScopeKey(key);
      if (!parsed) return null;
      return { ...parsed, key };
    })
    .filter(Boolean) as ClassAssignment[];
}

export function filterGradesByScope(grades: string[], allowedKeys: Set<string>): string[] {
  if (allowedKeys.size === 0) return [];
  return grades.filter((grade) =>
    Array.from(allowedKeys).some((key) => key.startsWith(`${grade}__`))
  );
}

export function filterSectionsByScope(
  sections: string[],
  grade: string,
  allowedKeys: Set<string>,
  allGradesKey = "all"
): string[] {
  if (allowedKeys.size === 0) return [];
  if (!grade || grade === allGradesKey) {
    return sections.filter((section) =>
      Array.from(allowedKeys).some((key) => key.endsWith(`__${section.toUpperCase()}`))
    );
  }
  return sections.filter((section) => allowedKeys.has(classScopeKey(grade, section)));
}

export function matchesClassScope(grade: string, section: string, allowedKeys: Set<string>): boolean {
  if (!grade || !section || allowedKeys.size === 0) return false;
  return allowedKeys.has(classScopeKey(grade, section));
}
