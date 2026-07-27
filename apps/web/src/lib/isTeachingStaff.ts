/**
 * Decide whether a staff member belongs in Teaching Staff (teachers table)
 * vs Non-Teaching Staff.
 *
 * Rules (any match → teaching):
 * - Department is a teaching / academic / activity / specialty dept
 * - Designation matches teaching roles (PET, Dance, Music, Principal, Librarian, …)
 * - At least one subject is assigned
 */

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_/]+/g, " ")
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAssignedSubjects(subjects: unknown): boolean {
  const parts = String(subjects ?? "")
    .split(/[,;\n|]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p !== "-" && p !== "—" && p.toUpperCase() !== "NA" && p.toUpperCase() !== "N/A");
  return parts.length > 0;
}

const TEACHING_DEPARTMENTS = new Set([
  "TEACHING",
  "TEACHING SUPPORT",
  "HOD TEACHING",
  "ACADEMICS",
  "ACADEMIC",
  "ACADEMIC ADMINISTRATION",
  "GAMES AND ACTIVITIES",
  "ROBOTICS",
  "SPACE",
]);

/** Exact designation matches after normalizeKey */
const TEACHING_DESIGNATIONS = new Set([
  "PET",
  "PHYSICAL DIRECTOR",
  "PHYSICAL EDUCATION",
  "PHYSICAL EDUCATION TEACHER",
  "DANCE",
  "DANCE TEACHER",
  "MUSIC",
  "MUSIC TEACHER",
  "ART",
  "ART AND CRAFT",
  "ART CRAFT",
  "ARTS AND CRAFTS",
  "CRAFT",
  "CRAFTS",
  "PRINCIPAL",
  "VICE PRINCIPAL",
  "VICE-PRINCIPAL",
  "ACADEMIC DIRECTOR",
  "LIBRARIAN",
  "ASSISTANT LIBRARIAN",
  "ASSISTANT TEACHER",
  "ASST TEACHER",
  "MOTHER TEACHER",
  "ROBOTICS",
  "ROBOTICS FACULTY",
  "SPACE",
  "SPACE FACULTY",
  "SPACE LAB",
]);

export type TeachingStaffFields = {
  department?: unknown;
  designation?: unknown;
  subjects?: unknown;
  /** Optional aliases used by some forms / Excel rows */
  roleTitle?: unknown;
  position?: unknown;
  subject?: unknown;
};

/**
 * Returns true when this person should appear under Teaching Staff.
 */
export function isTeachingStaff(fields: TeachingStaffFields): boolean {
  const department = normalizeKey(fields.department);
  const designation = normalizeKey(
    fields.designation ?? fields.roleTitle ?? fields.position
  );
  const subjects = fields.subjects ?? fields.subject;

  if (hasAssignedSubjects(subjects)) return true;

  if (department && TEACHING_DEPARTMENTS.has(department)) return true;

  if (designation && TEACHING_DESIGNATIONS.has(designation)) return true;

  // Soft matches (titles containing keywords)
  if (
    /\b(TEACHER|TUTOR|PROFESSOR|LECTURER|FACULTY|PHONICS)\b/.test(designation) ||
    /\b(PGT|PRT|TGT)\b/.test(designation) ||
    /^HOD\b/.test(designation) ||
    /\bHOD\b/.test(designation) ||
    /\bPET\b/.test(designation) ||
    /\bPHYSICAL\s+DIRECTOR\b/.test(designation) ||
    /\bDANCE\b/.test(designation) ||
    /\bMUSIC\b/.test(designation) ||
    (/\bART\b/.test(designation) && /\bCRAFT/.test(designation)) ||
    /\bLIBRAR/.test(designation) ||
    /\bPRINCIPAL\b/.test(designation) ||
    /\bROBOTICS\b/.test(designation) ||
    /\bSPACE\b/.test(designation) ||
    /\bASSISTANT\s+TEACHER\b/.test(designation) ||
    /\bASST\.?\s+TEACHER\b/.test(designation)
  ) {
    return true;
  }

  return false;
}

/** @deprecated Prefer isTeachingStaff — kept for call sites that only pass department. */
export function isTeachingDepartment(dept: unknown): boolean {
  return isTeachingStaff({ department: dept });
}
