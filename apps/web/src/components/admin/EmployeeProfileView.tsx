"use client";

import Link from "next/link";
const SafeLink = Link as any;
import {
  Badge,
  Briefcase,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
  HeartPulse,
  BookOpen,
  Key,
  Eye,
  EyeOff,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useMemo, useState } from "react";


import StaffAttendanceLogTab from "@/components/admin/hr/attendance/StaffAttendanceLogTab";
import { mapStaffDoc, type StaffDisplayRecord } from "@/lib/staffRecord";
import { fetchBranchStaffByIdViaApi } from "@/lib/fetchBranchStaffById";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { buildPath, subscribeData, sortBy, buildQuery, db } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ProfileField = { label: string; value: string; colSpan?: 1 | 2 };

function hasProfileValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return !Number.isNaN(value);
  return String(value).trim() !== "";
}

function profileValue(raw: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw?.[key];
    if (!hasProfileValue(value)) continue;
    const text = String(value).trim();
    if (text === "0" && (key === "empCode" || key === "childrenCount")) continue;
    return text;
  }
  return "";
}

function formatProfileDate(value: unknown): string {
  if (!hasProfileValue(value)) return "";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("en-IN");
}

function formatGender(value: unknown): string {
  const text = profileValue({ gender: value }, "gender");
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower === "male") return "Male";
  if (lower === "female") return "Female";
  return text;
}

function buildEmploymentFields(
  staff: StaffDisplayRecord,
  raw: Record<string, unknown> | null,
  showAcademicLoad: boolean
): ProfileField[] {
  const fields: ProfileField[] = [];
  const add = (label: string, value: string, colSpan?: 1 | 2) => {
    if (value) fields.push({ label, value, colSpan });
  };

  add("Employment Type", staff.employmentType !== "Full-Time" ? staff.employmentType : profileValue(raw, "employmentStatus") || staff.employmentType);
  add("Joining Date", staff.joinedDate !== "—" ? staff.joinedDate : formatProfileDate(raw?.joiningDate ?? raw?.joinDate));
  add("Date of Confirmation", formatProfileDate(raw?.confirmationDate));
  add("Trained Status", profileValue(raw, "trainedStatus"));
  add("Reports To", staff.reportsTo !== "—" ? staff.reportsTo : profileValue(raw, "reportsTo", "reportingManager"));
  add(
    "Qualifications",
    staff.qualifications.length ? staff.qualifications.join(", ") : profileValue(raw, "qualification")
  );

  const experienceMonths = raw?.experienceMonths;
  if (hasProfileValue(experienceMonths) && Number(experienceMonths) > 0) {
    add("Experience", `${experienceMonths} months`);
  }

  add("School Wing", profileValue(raw, "schoolWing"));
  add("Previous School", profileValue(raw, "previousSchool"));

  const probationMonths = raw?.probationMonths;
  if (hasProfileValue(probationMonths) && Number(probationMonths) > 0) {
    add("Probation Period", `${probationMonths} months`);
  }

  const transport = profileValue(raw, "availingTransport");
  if (transport) {
    add("School Transport", transport);
    if (transport.toUpperCase() === "YES") {
      add("Bus No.", profileValue(raw, "busNo"));
      add("Route", profileValue(raw, "route"));
      add("Stop", profileValue(raw, "stop"));
    }
  }

  add("Locker No.", profileValue(raw, "lockerNo"));
  add("Locker Key", profileValue(raw, "lockerKey"));
  add("Remarks", profileValue(raw, "remarks"), 2);

  if (showAcademicLoad && staff.classTeacher) {
    add("Class Teacher Of", staff.classTeacher, 2);
  }

  return fields;
}

function buildPersonalFields(
  staff: StaffDisplayRecord,
  raw: Record<string, unknown> | null
): ProfileField[] {
  const fields: ProfileField[] = [];
  const add = (label: string, value: string, colSpan?: 1 | 2) => {
    if (value) fields.push({ label, value, colSpan });
  };

  add("Father's Name", profileValue(raw, "fatherName"));
  add("Mother's Name", profileValue(raw, "motherName"));
  add("Father's Occupation", profileValue(raw, "fatherOccupation"));
  add("Mother's Occupation", profileValue(raw, "motherOccupation"));
  add("Date of Birth", formatProfileDate(raw?.dob));
  add("Gender", formatGender(raw?.gender));
  add("Marital Status", profileValue(raw, "maritalStatus"));
  add("Blood Group", profileValue(raw, "bloodGroup"));
  add("Spouse Name", profileValue(raw, "spouseName"));
  add("Spouse Contact", profileValue(raw, "spouseContact"));
  add("Spouse Organisation", profileValue(raw, "spouseOrganisation"));

  const childrenCount = raw?.childrenCount;
  if (hasProfileValue(childrenCount) && Number(childrenCount) > 0) {
    add("No. of Children", String(childrenCount));
  }

  add("Permanent Address", profileValue(raw, "permanentAddress"), 2);
  const correspondence = profileValue(raw, "correspondenceAddress");
  const permanent = profileValue(raw, "permanentAddress");
  if (correspondence && correspondence !== permanent) {
    add("Correspondence Address", correspondence, 2);
  }

  add("Aadhar", profileValue(raw, "aadharNo"));
  add("PAN", profileValue(raw, "panNo"));
  add("Employee Code", profileValue(raw, "empCode") || (staff.employeeId !== "—" ? staff.employeeId : ""));
  add("Computer Knowledge", profileValue(raw, "computerKnowledge"));
  add("Relatives", profileValue(raw, "relatives"), 2);

  return fields;
}

function ProfileFieldGrid({ fields }: { fields: ProfileField[] }) {
  if (!fields.length) {
    return <p className="text-sm text-gray-500">No additional details recorded.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
      {fields.map((field) => (
        <div key={field.label} className={field.colSpan === 2 ? "col-span-2" : undefined}>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{field.label}</p>
          <p className="mt-1 text-xs font-bold text-gray-900">{field.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatInrMonthly(value: number) {
  if (!value) return "₹0";
  return value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function getAvatarColor(name: string) {
  if (!name) return "bg-gray-100 text-gray-700";
  const colors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-violet-100 text-violet-700 border-violet-200",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

type LeaveRow = {
  id: string;
  type: string;
  from: string;
  to: string;
  days?: number;
  status: string;
};

async function loadStaffRecord(
  schoolId: string,
  employeeId: string,
  variant?: "teaching" | "nonTeaching",
  academicYear?: string | null
): Promise<{ record: StaffDisplayRecord; raw: Record<string, unknown> } | null> {
  const kind = variant === "nonTeaching" ? "non_teaching" : variant === "teaching" ? "teaching" : undefined;
  const row = await fetchBranchStaffByIdViaApi(schoolId, employeeId, academicYear ?? null, kind);
  if (!row) return null;
  return {
    record: mapStaffDoc(employeeId, row),
    raw: row,
  };
}

export default function EmployeeProfileView({
  employeeId,
  schoolId,
  editHref,
  backHref = "/schools",
  backLabel = "Directory",
  variant,
}: {
  employeeId: string;
  schoolId: string;
  editHref: string;
  backHref?: string;
  backLabel?: string;
  variant?: "teaching" | "nonTeaching";
}) {
  const { currentYear } = useAcademicYear();
    const [staff, setStaff] = useState<StaffDisplayRecord | null>(null);
  const [rawEmployee, setRawEmployee] = useState<Record<string, unknown> | null>(null);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Profile Overview");
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    if (!employeeId || !schoolId) return;
    setLoading(true);

    loadStaffRecord(schoolId, employeeId, variant, currentYear?.name).then((result) => {
      if (result) {
        setStaff(result.record);
        const raw = result.raw;
        if (!raw.username || !raw.portalPassword) {
          const empId = String(raw.employeeId ?? employeeId).toLowerCase();
          raw.username = empId;
          raw.portalPassword = empId;
        }
        setRawEmployee(raw);
      } else {
        setStaff(null);
        setRawEmployee(null);
      }
      setLoading(false);
    });
  }, [employeeId, schoolId, variant, currentYear?.name]);

  useEffect(() => {
    if (!employeeId || !schoolId || !staff) return;

    const ids = new Set([staff.employeeId, staff.id, employeeId].filter(Boolean));
    const qRef = buildQuery(buildPath(db, "schools", schoolId, "leaves"), sortBy("createdAt", "desc"));

    const unsub = subscribeData(
      qRef,
      (snap: any) => {
        const rows: LeaveRow[] = snap.docs
          .filter((d) => {
            const data = d.data() as Record<string, unknown>;
            const empId = String(data.employeeId ?? "");
            return ids.has(empId) || ids.has(d.id);
          })
          .map((d: any) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: d.id,
              type: String(data.type ?? data.leaveType ?? "Leave"),
              from: String(data.from ?? data.startDate ?? "—"),
              to: String(data.to ?? data.endDate ?? "—"),
              days: data.days !== undefined ? Number(data.days) : undefined,
              status: String(data.status ?? "Pending"),
            };
          });
        setLeaves(rows);
      },
      () => setLeaves([])
    );

    return () => unsub();
  }, [employeeId, schoolId, staff]);

  const payslips = useMemo(() => {
    const list = rawEmployee?.payslips;
    return Array.isArray(list) ? list : [];
  }, [rawEmployee]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-gray-700">Staff member not found</h2>
        <SafeLink href={backHref} className="text-[#144835] font-semibold mt-4 inline-block hover:underline">
          Return to Directory
        </SafeLink>
      </div>
    );
  }

  const initials = staff.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const avatarColor = getAvatarColor(staff.name);
  const showAcademicLoad = variant === "teaching";
  const employmentFields = buildEmploymentFields(staff, rawEmployee, showAcademicLoad);
  const personalFields = buildPersonalFields(staff, rawEmployee);
  const emergencyPerson = profileValue(rawEmployee, "emergencyPerson");
  const emergencyPhone = profileValue(rawEmployee, "emergencyContact");
  const bankDetails = rawEmployee?.bankDetails as
    | { bankName?: string; accountNumber?: string; ifscCode?: string }
    | undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <SafeLink href={backHref} className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> {backLabel}
          </SafeLink>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-gray-900">{staff.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export Data
          </button>
          <SafeLink
            href={editHref}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
          >
            <Pencil size={14} /> Edit Profile
          </SafeLink>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#144835] to-[#144835]/80" />

            <div className="relative px-6 pb-6 pt-16">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-28 w-28 rounded-3xl border-4 border-white flex items-center justify-center text-xl font-bold shadow-lg bg-white relative",
                    avatarColor
                  )}
                >
                  {initials}
                  <div
                    className={cn(
                      "absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center",
                      staff.status === "Active"
                        ? "bg-emerald-500"
                        : staff.status === "On Leave"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                    )}
                  >
                    {staff.status === "Inactive" ? (
                      <AlertCircle size={12} className="text-white" />
                    ) : (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h1 className="text-xl font-bold text-gray-900">{staff.name}</h1>
                  <p className="text-xs font-medium text-gray-500 mt-1">{staff.designation}</p>
                  <span
                    className={cn(
                      "inline-flex mt-2 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                      staff.status === "Active"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : staff.status === "On Leave"
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                    )}
                  >
                    {staff.status}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Badge, label: "Employee ID", value: staff.employeeId },
                  { icon: Users, label: "Department", value: staff.department },
                  { icon: Briefcase, label: "Designation", value: staff.designation },
                  { icon: Phone, label: "Mobile", value: staff.mobile },
                  { icon: Mail, label: "Email", value: staff.email },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100"
                  >
                    <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                      <p className="text-xs font-bold text-gray-900 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <nav className="space-y-1">
              {["Profile Overview", "Payroll & Slips", "Attendance & Logs", "Leave Requests"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-4 py-3 text-xs transition-colors",
                    activeTab === tab
                      ? "bg-gray-50 font-bold text-gray-900 border border-gray-100"
                      : "font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {tab}
                  {activeTab === tab && <ChevronRight size={14} className="text-gray-400" />}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {activeTab === "Profile Overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Briefcase size={20} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Employment Details</h2>
                  </div>
                  <div className="p-4">
                    <ProfileFieldGrid fields={employmentFields} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users size={20} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Personal Details</h2>
                  </div>
                  <div className="p-4">
                    <ProfileFieldGrid fields={personalFields} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <HeartPulse size={20} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Emergency Contact</h2>
                  </div>
                  <div className="p-4">
                    {emergencyPerson || emergencyPhone ? (
                      <div className="space-y-4">
                        {emergencyPerson ? (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Name</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{emergencyPerson}</p>
                          </div>
                        ) : null}
                        {emergencyPhone ? (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{emergencyPhone}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No emergency contact provided.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Login Credentials Section */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Key size={20} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Login Credentials</h2>
                  </div>

                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rawEmployee?.username ? (
                    <>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Username / User ID</p>
                        <p className="mt-1 text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{String(rawEmployee.username)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Portal Password</p>
                        <div className="mt-1 relative flex items-center">
                          <p className="text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 w-full font-mono tracking-widest">
                            {showPassword ? String(rawEmployee.portalPassword || "") : "••••••••"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-sm text-gray-500 p-2">
                      Generating login credentials...
                    </div>
                  )}
                </div>
              </div>

              {showAcademicLoad && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Classes &amp; Subjects</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {staff.classes} · {staff.subjects}
                          {staff.classTeacher ? ` · Class teacher: ${staff.classTeacher}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            Class &amp; Section
                          </th>
                          <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            Students
                          </th>
                          <th className="px-4 py-2.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            Weekly Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {staff.classLoads.length > 0 ? (
                          staff.classLoads.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-2.5">
                                <span className="text-xs font-bold text-gray-800 bg-gray-100/80 px-2.5 py-1 rounded-md">
                                  {row.classSection || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{row.subject || "—"}</td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                                {row.students ? `${row.students}${row.capacity ? ` / ${row.capacity}` : ""}` : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">
                                {row.weeklyHours ? `${row.weeklyHours}h` : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                              No classes or subjects assigned yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "Payroll & Slips" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Base Salary</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatInrMonthly(staff.baseSalaryMonthlyInr)}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-1">per month</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Building size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <h2 className="text-sm font-bold text-gray-900">Bank Details</h2>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {bankDetails?.bankName ? (
                      <>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Bank Name</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">{bankDetails.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Account No</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">{bankDetails.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">IFSC Code</p>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">{bankDetails.ifscCode}</p>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 text-sm text-gray-500">Bank details pending.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">Payslip History</h2>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-6 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-right">
                          Net Pay
                        </th>
                        <th className="px-6 py-3 text-xs font-extrabold text-gray-500 uppercase tracking-wider text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {payslips.map((ps: Record<string, unknown>, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{String(ps.month ?? "—")}</td>
                          <td className="px-6 py-4 text-sm font-bold text-[#144835] text-right">
                            {formatInrMonthly(Number((ps.netPay as number) ?? 0))}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {String(ps.status ?? "—")}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {payslips.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">
                            No payslip history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Attendance & Logs" && (
            <StaffAttendanceLogTab 
              presentDates={(rawEmployee?.attendance as any)?.presentDates || []}
              absentDates={(rawEmployee?.attendance as any)?.absentDates || []}
            />
          )}

          {activeTab === "Leave Requests" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Leave Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">From</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">To</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Days</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800">{leave.type}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.from}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.to}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.days ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold border bg-gray-50 border-gray-200 text-gray-700">
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {leaves.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          No leave requests on record.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
