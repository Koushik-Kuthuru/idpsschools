"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Eye,
  RotateCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import SelectMenu from "@/components/ui/SelectMenu";
import TableRowActions from "@/components/ui/TableRowActions";
import { useTeacherClassScope } from "@/hooks/useTeacherClassScope";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import { usePortalStudents } from "@/hooks/usePortalStudents";
import { sortGrades } from "@/lib/gradeOrder";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";

export interface TeacherStudentRow {
  id: string;
  name: string;
  className: string;
  section: string;
  roll: string;
  admissionNo: string;
  status: "Active" | "Inactive";
  attendance: number;
  username: string;
  portalPassword: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getAvatarColor(name: string) {
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
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-rose-100 text-rose-700 border-rose-200",
  ];
  if (!name) return colors[0];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

type TeacherStudentsViewProps = {
  schoolId: string;
};

export default function TeacherStudentsView({ schoolId }: TeacherStudentsViewProps) {
  const base = `/schools/${schoolId}/teachers/students`;
  const academicYearCtx = useAcademicYearOptional();
  const currentYear = academicYearCtx?.currentYear;
  const { grades: branchGrades, sections: branchSections, sectionsForGrade } = useBranchClassOptions(schoolId);
  const { loading: scopeLoading, error: scopeError, assignments, matchesStudent, isUnrestricted } =
    useTeacherClassScope(schoolId);
  const {
    data: portalStudents,
    loading: studentsLoading,
    error: studentsError,
  } = usePortalStudents(schoolId, currentYear?.name);

  const allClassesKey = "all";
  const allSectionsKey = "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>(allClassesKey);
  const [sectionFilter, setSectionFilter] = useState<string>(allSectionsKey);
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");

  const students = useMemo<TeacherStudentRow[]>(() => {
    const rows = portalStudents?.students ?? [];
    return rows
      .map((row) => ({
        id: String(row.id ?? ""),
        name: String(row.name ?? ""),
        className: String(row.grade ?? row.className ?? ""),
        section: String(row.section ?? ""),
        roll: String(row.roll ?? ""),
        admissionNo: String(row.admissionNo ?? ""),
        status: (String(row.status ?? "Active") as "Active" | "Inactive") || "Active",
        attendance: 0,
        username: String(row.email ?? "—"),
        portalPassword: "—",
      }))
      .filter(
        (s) => isUnrestricted || matchesStudent({ classId: s.className, grade: s.className, section: s.section })
      );
  }, [portalStudents?.students, isUnrestricted, matchesStudent]);

  const loadError = studentsError ?? scopeError;

  const classOptions = useMemo(() => sortGrades(branchGrades), [branchGrades]);

  const sectionOptions = useMemo(() => {
    if (classFilter === allClassesKey) return branchSections;
    return sectionsForGrade(classFilter);
  }, [allClassesKey, branchSections, classFilter, sectionsForGrade]);

  useEffect(() => {
    if (classFilter !== allClassesKey && classOptions.length && !classOptions.includes(classFilter)) {
      setClassFilter(allClassesKey);
    }
  }, [classFilter, classOptions, allClassesKey]);

  useEffect(() => {
    if (sectionFilter !== allSectionsKey && sectionOptions.length && !sectionOptions.includes(sectionFilter)) {
      setSectionFilter(allSectionsKey);
    }
  }, [sectionFilter, sectionOptions, allSectionsKey]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.status === "Active").length;
    const inactive = total - active;
    const avgAttendance =
      total === 0 ? 0 : Math.round((students.reduce((sum, s) => sum + s.attendance, 0) / total) * 10) / 10;
    return { total, active, inactive, avgAttendance };
  }, [students]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q || `${s.name} ${s.roll} ${s.admissionNo} ${s.className} ${s.section}`.toLowerCase().includes(q);
      const matchesClass = classFilter === allClassesKey || s.className === classFilter;
      const matchesSection = sectionFilter === allSectionsKey || s.section === sectionFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesClass && matchesSection && matchesStatus;
    });
  }, [classFilter, sectionFilter, searchQuery, statusFilter, students, allClassesKey, allSectionsKey]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    classFilter !== allClassesKey ||
    sectionFilter !== allSectionsKey ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setClassFilter(allClassesKey);
    setSectionFilter(allSectionsKey);
    setStatusFilter("all");
  };

  const classFilterOptions = useMemo(
    () => [{ value: allClassesKey, label: "All Classes" }, ...classOptions.map((c) => ({ value: c, label: `Class ${c}` }))],
    [allClassesKey, classOptions]
  );
  const sectionFilterOptions = useMemo(
    () => [{ value: allSectionsKey, label: "All Sections" }, ...sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))],
    [allSectionsKey, sectionOptions]
  );
  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: "All Status" },
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    []
  );

  const assignmentLabel = useMemo(() => {
    if (assignments.length === 0) return "No class assigned as class teacher";
    return assignments.map((a) => `${a.grade}-${a.section}`).join(", ");
  }, [assignments]);

  const pageLoading = (studentsLoading && students.length === 0) || scopeLoading;

  return (
    <div className="erp-body space-y-6 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      {(loadError || scopeError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError || scopeError}
        </div>
      )}

      <AdminPageHeader
        title="My Students"
        description={`View-only · Students in your assigned classes · ${assignmentLabel}`}
        actions={
          <ExportButton
            data={filtered}
            filename="my-students"
            columns={[
              { header: "Name", key: "name" },
              { header: "Class", key: "className" },
              { header: "Section", key: "section" },
              { header: "Roll", key: "roll" },
              { header: "Status", key: "status" },
              { header: "Attendance %", key: "attendance" },
            ]}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
            iconSize={14}
          />
        }
      />

      {!scopeLoading && assignments.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          You are not assigned as a class teacher for any class yet. Contact the school admin to assign your homeroom
          class.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="erp-caption mb-0.5">Total Students</p>
            <p className="erp-metric text-xl">{stats.total.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="erp-caption mb-0.5">Active</p>
            <p className="erp-metric text-xl">{stats.active.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="erp-caption mb-0.5">Inactive</p>
            <p className="erp-metric text-xl">{stats.inactive.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CalendarCheck2 size={18} />
          </div>
          <div>
            <p className="erp-caption mb-0.5">Avg Attendance</p>
            <p className="erp-metric text-xl">{stats.avgAttendance}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
              <label className="erp-caption">Class</label>
              <SelectMenu value={classFilter} onChange={setClassFilter} options={classFilterOptions} aria-label="Filter by class" />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
              <label className="erp-caption">Section</label>
              <SelectMenu value={sectionFilter} onChange={setSectionFilter} options={sectionFilterOptions} aria-label="Filter by section" />
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
              <label className="erp-caption">Status</label>
              <SelectMenu
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as typeof statusFilter)}
                options={statusFilterOptions}
                aria-label="Filter by status"
              />
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                <RotateCw size={12} /> Reset
              </button>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5 w-full xl:w-[280px]">
            <label className="erp-caption">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-9 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
                placeholder="Name, roll no., admission no..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="erp-section-title">Student Directory</h2>
          <span className="text-xs font-medium text-gray-500">
            {filtered.length} student{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          {pageLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Class</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Attendance</th>
                  <th className="w-12 px-2 py-3 text-right" aria-label="Row actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((s) => {
                    const initials = s.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("");
                    const active = s.status === "Active";
                    const avatarColor = getAvatarColor(s.name);
                    const isLowAttendance = s.attendance < 75;
                    const profileHref = `${base}/${encodeURIComponent(s.id)}/profile`;

                    return (
                      <tr key={s.id} className="hover:bg-[#144835]/[0.02] transition-colors group">
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-gray-800 tabular-nums">{s.roll}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border shrink-0",
                                avatarColor
                              )}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <SafeLink
                                href={profileHref}
                                className="text-xs font-bold text-gray-900 hover:text-[#144835] transition-colors truncate block"
                              >
                                {s.name}
                              </SafeLink>
                              <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">
                                {s.admissionNo !== "-" ? `Adm. ${s.admissionNo}` : "No admission no."}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700">
                            <span>{s.className}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-500">{s.section}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border",
                              active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            )}
                          >
                            {active ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 max-w-[5rem] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", isLowAttendance ? "bg-red-500" : "bg-emerald-500")}
                                style={{ width: `${Math.min(s.attendance, 100)}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs font-bold tabular-nums w-9 text-right",
                                isLowAttendance ? "text-red-600" : "text-gray-700"
                              )}
                            >
                              {s.attendance}%
                            </span>
                          </div>
                        </td>
                        <td className="w-12 px-2 py-3 text-right">
                          <TableRowActions
                            items={[
                              { label: "View Profile", icon: Eye, href: profileHref },
                              {
                                label: "Attendance",
                                icon: CalendarCheck2,
                                href: `/schools/${schoolId}/teachers/attendance?class=${encodeURIComponent(s.className)}&section=${encodeURIComponent(s.section)}`,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center">
                      <p className="text-xs font-bold text-gray-900">No students found</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {assignments.length === 0
                          ? "You need a class teacher assignment to see students."
                          : "Try adjusting your filters."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
