import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { listBranchAcademicYears } from "@/lib/branchAcademicYears";
import {
  fetchAllPaginated,
  loadAllStudentProfiles,
  resolveStudentYearEnrollment,
} from "@/lib/studentProfileStore";
import { shapeBranchStudentListRow } from "@/lib/loadBranchStudents";
import {
  deleteHostelRoom,
  deleteHostelVisitor,
  hostelRoomDocId,
  loadHostelAttendance,
  loadHostelRooms,
  loadHostelVisitors,
  saveHostelAttendance,
  saveHostelRoom,
  saveHostelVisitor,
  type HostelAttendanceDoc,
  type HostelAttendanceSession,
  type HostelRoomDoc,
  type HostelVisitorDoc,
} from "@/lib/hostelStore";
import {
  loadStudentProfileData,
  saveStudentProfileData,
} from "@/lib/studentProfileStore";

export type BranchHostelStudentRow = {
  id: string;
  name: string;
  className: string;
  section: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive";
  academicYear: string;
  studentType: string;
  parentName: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  fatherPhone: string;
  motherPhone: string;
  localNumber: string;
  roomNo: string;
  block: string;
  bedNo: string;
  hostelFeeTotal: number;
  hostelFeePaid: number;
  foodFeeTotal: number;
  laundryFeeTotal: number;
  feeStatus: "Paid" | "Partial" | "Pending";
};

function sumFeeRows(
  feeGrid: Array<{ name?: string; values?: unknown[] }> | undefined,
  keywords: string[]
): number {
  if (!Array.isArray(feeGrid)) return 0;
  let total = 0;
  for (const row of feeGrid) {
    const name = String(row.name ?? "").toUpperCase();
    if (!keywords.some((keyword) => name.includes(keyword))) continue;
    const values = Array.isArray(row.values) ? row.values : [];
    for (const value of values) total += Number(value) || 0;
  }
  return total;
}

function feeStatus(total: number, paid: number): "Paid" | "Partial" | "Pending" {
  if (total <= 0) return "Pending";
  if (paid <= 0) return "Pending";
  if (paid >= total) return "Paid";
  return "Partial";
}

async function resolveYearName(
  admin: SupabaseClient<any>,
  branchId: string,
  academicYearName?: string | null
) {
  if (academicYearName) return academicYearName;
  const years = await listBranchAcademicYears(admin, branchId);
  return years.find((y) => y.is_current)?.name ?? years[0]?.name ?? null;
}

export async function loadBranchHostelStudents(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  academicYearName?: string | null
): Promise<BranchHostelStudentRow[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];

  const yearName = await resolveYearName(admin, branchId, academicYearName);
  if (!yearName) return [];

  const [students, profiles] = await Promise.all([
    fetchAllPaginated<{
      id: string;
      admission_no: string;
      full_name: string;
      is_active: boolean;
      parent_phone: string | null;
      parent_name: string | null;
    }>(admin, "students", "id, admission_no, full_name, is_active, parent_phone, parent_name", (query) =>
      query.eq("branch_id", branchId).order("full_name", { ascending: true })
    ),
    loadAllStudentProfiles(admin, branchId),
  ]);

  const results: BranchHostelStudentRow[] = [];

  for (const row of students) {
    const profile = profiles.get(String(row.id)) ?? {};
    const enrollment = resolveStudentYearEnrollment(profile, yearName);
    if (!enrollment) continue;

    const studentType = String(
      (enrollment as Record<string, unknown>).studentType ??
        (profile as Record<string, unknown>).studentType ??
        ""
    ).trim();

    const typeKey = studentType.toLowerCase().replace(/[\s_-]+/g, "");
    const isBoarder =
      typeKey === "boarder" ||
      typeKey === "hostel" ||
      typeKey.includes("boarder") ||
      typeKey.includes("hostel");
    if (!isBoarder) continue;

    const base = shapeBranchStudentListRow(
      row as Record<string, unknown>,
      enrollment,
      yearName,
      profile
    );

    const feeDetails = ((enrollment as Record<string, unknown>).feeDetails ??
      (profile as Record<string, unknown>).feeDetails ??
      {}) as { feeGrid?: Array<{ name?: string; values?: unknown[] }>; paid?: number };
    const feeGrid = feeDetails.feeGrid;
    const hostelFeeTotal = sumFeeRows(feeGrid, ["HOSTEL"]);
    const foodFeeTotal = sumFeeRows(feeGrid, ["FOOD"]);
    const laundryFeeTotal = sumFeeRows(feeGrid, ["LAUNDRY"]);
    const hostelFeePaid = Number(feeDetails.paid) || 0;
    const totalDue = hostelFeeTotal + foodFeeTotal + laundryFeeTotal;

    const hostelDetails = ((enrollment as Record<string, unknown>).hostelDetails ??
      (profile as Record<string, unknown>).hostelDetails ??
      {}) as Record<string, unknown>;

    const fatherName = String(
      (enrollment as Record<string, unknown>).fatherName ??
        (profile as Record<string, unknown>).fatherName ??
        base.fatherName ??
        ""
    ).trim();
    const motherName = String(
      (enrollment as Record<string, unknown>).motherName ??
        (profile as Record<string, unknown>).motherName ??
        ""
    ).trim();
    const fatherPhone = String(
      (enrollment as Record<string, unknown>).fatherMobile1 ??
        (profile as Record<string, unknown>).fatherMobile1 ??
        base.parentPhone ??
        ""
    ).trim();
    const motherPhone = String(
      (enrollment as Record<string, unknown>).motherMobile1 ??
        (profile as Record<string, unknown>).motherMobile1 ??
        ""
    ).trim();
    const localNumber = String(
      hostelDetails.localNumber ??
        hostelDetails.localPhone ??
        (enrollment as Record<string, unknown>).mobileNumber ??
        (profile as Record<string, unknown>).mobileNumber ??
        (enrollment as Record<string, unknown>).permMobile ??
        (profile as Record<string, unknown>).permMobile ??
        fatherPhone ??
        ""
    ).trim();

    results.push({
      id: base.id,
      name: base.name,
      className: base.className,
      section: base.section,
      roll: String((enrollment as Record<string, unknown>).rollNumber ?? base.admissionNo ?? ""),
      admissionNo: base.admissionNo,
      status: base.status as "Active" | "Inactive",
      academicYear: yearName,
      studentType,
      parentName: fatherName || motherName || "—",
      fatherName: fatherName || "—",
      motherName: motherName || "—",
      parentPhone: fatherPhone || motherPhone || "—",
      fatherPhone: fatherPhone || "—",
      motherPhone: motherPhone || "—",
      localNumber: localNumber || "—",
      roomNo: String(hostelDetails.roomNo ?? hostelDetails.room ?? "—"),
      block: String(hostelDetails.block ?? "—"),
      bedNo: String(hostelDetails.bedNo ?? hostelDetails.bed ?? "—"),
      hostelFeeTotal,
      hostelFeePaid,
      foodFeeTotal,
      laundryFeeTotal,
      feeStatus: feeStatus(totalDue, hostelFeePaid),
    });
  }

  return results.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function loadBranchHostelAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  date: string,
  session: HostelAttendanceSession
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  return loadHostelAttendance(admin, branchId, date, session);
}

export async function saveBranchHostelAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: HostelAttendanceDoc
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await saveHostelAttendance(admin, branchId, payload);
}

export async function loadBranchHostelVisitors(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  return loadHostelVisitors(admin, branchId);
}

export async function saveBranchHostelVisitor(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: HostelVisitorDoc & { id?: string }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  const id =
    String(payload.id ?? "").trim() ||
    `vis__${Date.now()}__${Math.random().toString(36).slice(2, 8)}`;
  const { id: _ignored, ...data } = payload;
  await saveHostelVisitor(admin, branchId, id, data);
  return { id, ...data };
}

export async function deleteBranchHostelVisitor(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  visitorId: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteHostelVisitor(admin, branchId, visitorId);
}

export async function loadBranchHostelRooms(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  return loadHostelRooms(admin, branchId);
}

export async function saveBranchHostelRoom(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: HostelRoomDoc & { id?: string }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const block = String(payload.block ?? "").trim() || "Main";
  const roomNo = String(payload.roomNo ?? "").trim();
  if (!roomNo) throw new Error("Room number is required");

  const id = String(payload.id ?? "").trim() || hostelRoomDocId(block, roomNo);
  const data: HostelRoomDoc = {
    block,
    roomNo,
    floor: String(payload.floor ?? "").trim(),
    capacity: Math.max(0, Number(payload.capacity) || 0),
    roomType: String(payload.roomType ?? "Standard").trim() || "Standard",
    status: payload.status === "maintenance" ? "maintenance" : "active",
    notes: String(payload.notes ?? "").trim(),
  };

  await saveHostelRoom(admin, branchId, id, data);
  return { id, ...data };
}

export async function deleteBranchHostelRoom(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  roomId: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteHostelRoom(admin, branchId, roomId);
}

export async function assignBranchHostelRoom(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  studentId: string,
  assignment: { block: string; roomNo: string }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  if (!studentId) throw new Error("Student is required");

  const profile = await loadStudentProfileData(admin, branchId, studentId);
  const nextProfile = {
    ...profile,
    hostelDetails: {
      ...((profile.hostelDetails as Record<string, unknown> | undefined) ?? {}),
      block: String(assignment.block ?? "").trim(),
      roomNo: String(assignment.roomNo ?? "").trim(),
      room: String(assignment.roomNo ?? "").trim(),
    },
  };

  await saveStudentProfileData(admin, branchId, studentId, nextProfile);
}
