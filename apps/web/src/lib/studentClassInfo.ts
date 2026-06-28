type StudentUser = {
  displayName?: string | null;
  studentName?: string;
  grade?: string;
  classId?: string;
  section?: string;
  class?: string;
};

export function getStudentDisplayName(user: StudentUser | null | undefined): string {
  if (!user) return "Student";
  return user.displayName || user.studentName || "Student";
}

export function getStudentClassInfo(user: StudentUser | null | undefined) {
  const grade = String(user?.grade ?? user?.classId ?? user?.class ?? "").trim();
  const section = String(user?.section ?? "").trim();
  const className = grade && section ? `${grade}-${section}` : grade || section || "";
  return { grade, section, className };
}
