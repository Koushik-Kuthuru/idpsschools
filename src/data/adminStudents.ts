export type StudentStatus = "Active" | "Inactive";

export type StudentGuardian = {
  name: string;
  phone: string;
  email: string;
};

export type StudentSubjectResult = {
  subject: string;
  score: number;
  grade: string;
};

export type AdminStudent = {
  id: string;
  enrollmentId: string;
  name: string;
  className: string;
  section: string;
  roll: string;
  status: StudentStatus;
  attendance: number;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  gpa: string;
  guardians: {
    father: StudentGuardian;
    mother: StudentGuardian;
  };
  results: StudentSubjectResult[];
};

import seed from "./seed.json";

export const adminStudents = seed.adminStudents as AdminStudent[];

export function getAdminStudentById(id: string) {
  return adminStudents.find((s) => s.id === id);
}
