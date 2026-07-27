import { adminFetch } from "@/lib/adminApi";

export type StudentReportCardFields = {
  fatherName: string;
  motherName: string;
  aadharNo: string;
  house: string;
  dob: string;
  address: string;
  phone: string;
  coScholastic: Record<string, string>;
  disciplineGrade: string;
  remarks: string;
  heightCm: string;
  weightKg: string;
  workingDays: number | null;
  daysPresent: number | null;
};

export async function fetchStudentReportFields(
  schoolId: string,
  academicYear: string,
  studentIds: string[]
): Promise<Record<string, StudentReportCardFields>> {
  if (!schoolId || !studentIds.length) return {};

  const response = await adminFetch("/api/admin/students/report-fields", {
    method: "POST",
    body: JSON.stringify({ schoolId, academicYear, studentIds }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(String(payload.error ?? "Failed to load student report fields"));
  }

  const payload = (await response.json()) as { profiles?: Record<string, StudentReportCardFields> };
  return payload.profiles ?? {};
}
