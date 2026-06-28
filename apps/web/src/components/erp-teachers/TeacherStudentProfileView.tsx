"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Home,
  User,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { buildPath, fetchOne, db } from "@/lib/db-client";
import { calculateAttendanceStats } from "@/utils/attendance";

const InfoSection = ({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-4">
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
      {Icon ? (
        <div className="h-6 w-6 rounded border border-gray-200 text-[#144835] flex items-center justify-center shrink-0 bg-white">
          <Icon size={14} strokeWidth={2.5} />
        </div>
      ) : null}
      <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">{title}</h2>
    </div>
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white">{children}</div>
  </div>
);

const InfoField = ({ label, value }: { label: string; value: unknown }) => (
  <div className="flex flex-col group">
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 break-words">
      {value ? String(value) : "-"}
    </span>
  </div>
);

type TeacherStudentProfileViewProps = {
  schoolId: string;
};

export default function TeacherStudentProfileView({ schoolId }: TeacherStudentProfileViewProps) {
  const params = useParams();
  const studentId = typeof params?.id === "string" ? decodeURIComponent(params.id) : "";
  const listHref = `/schools/${schoolId}/teachers/students`;
  const { loading: scopeLoading, matchesStudent } = useTeacherClassScope(schoolId);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!studentId) return;
      setLoading(true);
      try {
        const snap = await fetchOne(buildPath(db, "schools", schoolId, "students", studentId));
        if (!snap.exists()) {
          setStudent(null);
          return;
        }
        const raw = snap.data() as Record<string, unknown> | null;
        const data: Record<string, unknown> = { id: snap.id, ...(raw ?? {}) };
        if (
          !matchesStudent({
            classId: String(data.classId ?? data.grade ?? ""),
            section: String(data.section ?? ""),
          })
        ) {
          setDenied(true);
          setStudent(null);
          return;
        }
        setDenied(false);
        setStudent(data);
      } catch (err) {
        console.error("Failed to load student profile", err);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    if (!scopeLoading) void load();
  }, [studentId, schoolId, scopeLoading, matchesStudent]);

  if (loading || scopeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="erp-body space-y-4 max-w-[1600px] mx-auto">
        <SafeLink href={listHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to My Students
        </SafeLink>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          You do not have permission to view this student. Teachers can only view students in their assigned classes.
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="erp-body space-y-4 max-w-[1600px] mx-auto">
        <SafeLink href={listHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to My Students
        </SafeLink>
        <p className="text-sm text-gray-600">Student not found.</p>
      </div>
    );
  }

  const displayName =
    String(student.studentName || "") ||
    `${String(student.firstName || "")} ${String(student.lastName || "")}`.trim() ||
    "Student";

  const attendanceStats = calculateAttendanceStats(
    (student.attendance as { presentDates?: string[] })?.presentDates || [],
    (student.attendance as { absentDates?: string[] })?.absentDates || [],
    (student.attendance as { lateDates?: string[] })?.lateDates || []
  );

  return (
    <div className="erp-body space-y-4 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <SafeLink href={listHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to My Students
      </SafeLink>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
            <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
              <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden mb-4">
                {student.photo ? (
                  <img src={String(student.photo)} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                    <User size={40} />
                  </div>
                )}
              </div>
              <h1 className="erp-page-title text-center">{displayName}</h1>
              <p className="erp-caption mt-1 text-center">
                Class {String(student.classId ?? student.grade ?? "-")} · Section {String(student.section ?? "-")}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {String(student.status || "Active")}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="erp-caption">Admission No</span>
                <span className="text-sm font-bold text-gray-900">{String(student.admissionNo ?? "-")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="erp-caption">Roll No</span>
                <span className="text-sm font-bold text-gray-900">{String(student.rollNumber ?? "-")}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="erp-caption">Attendance</span>
                <span className="text-sm font-bold text-gray-900">{attendanceStats.percentage}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-9 space-y-4">
          <InfoSection title="Identity Information" icon={User}>
            <InfoField label="Aadhar No" value={student.aadharNo} />
            <InfoField label="SRN No" value={student.srnNo} />
            <InfoField label="Form No" value={student.formNo} />
            <InfoField label="Pen No" value={student.penNo} />
            <InfoField label="Gender" value={student.gender} />
            <InfoField label="Date of Birth" value={student.dob} />
            <InfoField label="Blood Group" value={student.bloodGroup} />
            <InfoField label="Nationality" value={student.nationality} />
          </InfoSection>

          <InfoSection title="Academic Details" icon={BookOpen}>
            <InfoField label="Class" value={student.classId ?? student.grade} />
            <InfoField label="Section" value={student.section} />
            <InfoField label="Session" value={student.session} />
            <InfoField label="House" value={student.house} />
            <InfoField label="Stream" value={student.stream} />
            <InfoField label="Medium" value={student.mediumOfInstruction} />
          </InfoSection>

          <InfoSection title="Family — Father" icon={Users}>
            <InfoField label="Name" value={student.fatherName} />
            <InfoField label="Mobile" value={student.fatherMobile1} />
            <InfoField label="Email" value={student.fatherEmail} />
            <InfoField label="Occupation" value={student.fatherOccupation} />
          </InfoSection>

          <InfoSection title="Family — Mother" icon={Heart}>
            <InfoField label="Name" value={student.motherName} />
            <InfoField label="Mobile" value={student.motherMobile1} />
            <InfoField label="Email" value={student.motherEmail} />
            <InfoField label="Occupation" value={student.motherOccupation} />
          </InfoSection>

          <InfoSection title="Address" icon={Home}>
            <InfoField label="Permanent Address" value={student.permAddress} />
            <InfoField label="City" value={student.permCity} />
            <InfoField label="State" value={student.permState} />
            <InfoField label="Mobile" value={student.permMobile} />
          </InfoSection>

          <InfoSection title="Attendance Summary" icon={Calendar}>
            <InfoField label="Present Days" value={attendanceStats.presentDays} />
            <InfoField label="Absent Days" value={attendanceStats.absentDays} />
            <InfoField label="Late Days" value={attendanceStats.lateDays} />
            <InfoField label="Attendance %" value={`${attendanceStats.percentage}%`} />
          </InfoSection>
        </div>
      </div>
    </div>
  );
}
