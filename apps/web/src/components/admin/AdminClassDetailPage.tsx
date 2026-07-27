"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  LayoutGrid,
  MapPin,
  Users,
} from "lucide-react";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchClasses } from "@/hooks/useBranchClasses";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { SkeletonPage } from "@/components/ui/Skeleton";
import { gradeDisplayLabel, gradesMatchForClass } from "@/lib/gradeOrder";
import {
  classTeachersForSection,
  indexClassTeachersBySection,
} from "@/lib/classTeacherAssignments";

const SafeLink = Link as any;

type Props = {
  grade: string;
};

export default function AdminClassDetailPage({ grade }: Props) {
  const schoolId = useSchoolId();
  const router = useRouter();
  const { currentYear, loading: yearLoading } = useAcademicYear();
  const { classes: branchClasses, loading, error } = useBranchClasses(
    schoolId,
    currentYear?.name
  );
  const { staff: teachingStaff, loading: staffLoading } = useBranchStaff(
    schoolId,
    "teaching",
    currentYear?.name
  );

  const classTeacherIndex = useMemo(
    () => indexClassTeachersBySection(teachingStaff),
    [teachingStaff]
  );

  const sections = useMemo(() => {
    return branchClasses
      .filter((c) => gradesMatchForClass(c.grade, grade))
      .slice()
      .sort((a, b) => a.section.localeCompare(b.section, undefined, { sensitivity: "base" }))
      .map((c) => {
        const teachers = classTeachersForSection(classTeacherIndex, c.grade, c.section);
        return {
          ...c,
          teachers,
          teacherNames: teachers.map((t) => t.name).join(", "),
        };
      });
  }, [branchClasses, grade, classTeacherIndex]);

  const resolvedGrade = sections[0]?.grade || grade;
  const totalStudents = sections.reduce((sum, s) => sum + (s.strength || 0), 0);
  const isLoading = ((loading || staffLoading) && !branchClasses.length) || (yearLoading && !currentYear);

  const sectionHref = (section: string) =>
    `/schools/${schoolId}/admin/academic/classes/${encodeURIComponent(resolvedGrade)}/${encodeURIComponent(section)}`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] pb-10 font-jost">
        <SkeletonPage stats={3} rows={6} columns={5} toolbar={false} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 pb-10 font-jost">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {error}
        </div>
        <SafeLink
          href={`/schools/${schoolId}/admin/academic/classes`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700"
        >
          <ArrowLeft size={14} /> Back to classes
        </SafeLink>
      </div>
    );
  }

  if (!sections.length) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 pb-10 font-jost">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-bold text-gray-900">Class not found</p>
          <p className="mt-1 text-xs text-gray-500">
            No sections for {gradeDisplayLabel(grade)}
            {currentYear?.name ? ` in ${currentYear.name}` : ""}.
          </p>
          <SafeLink
            href={`/schools/${schoolId}/admin/academic/classes`}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700"
          >
            <ArrowLeft size={14} /> Back to classes
          </SafeLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 animate-in fade-in duration-500 pb-10 font-jost">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <SafeLink
            href={`/schools/${schoolId}/admin/academic/classes`}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </SafeLink>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Class · {currentYear?.name ?? "—"}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-gray-900">
              {gradeDisplayLabel(resolvedGrade)}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {sections.length} section{sections.length === 1 ? "" : "s"} ·{" "}
              {totalStudents.toLocaleString("en-IN")} students
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <LayoutGrid size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Sections</p>
            <p className="text-xl font-bold text-gray-900">{sections.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Students</p>
            <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Grade</p>
            <p className="text-sm font-bold text-gray-900">{gradeDisplayLabel(resolvedGrade)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2.5">
          <h2 className="text-xs font-bold text-gray-800">Sections</h2>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Section
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Strength
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Class Teacher
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Room
                </th>
                <th className="w-10 px-5 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/50"
                  onClick={() => router.push(sectionHref(s.section))}
                >
                  <td className="px-5 py-2.5">
                    <span className="inline-block rounded bg-gray-100/80 px-2 py-0.5 text-xs font-bold text-gray-700">
                      {s.section}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-xs font-bold tabular-nums text-gray-800">
                    {s.strength}
                  </td>
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-700">
                    {s.teacherNames || (
                      <span className="font-medium text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600">
                      <MapPin size={12} className="text-gray-400" /> TBD
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-gray-400">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 lg:hidden">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(sectionHref(s.section))}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Sec {s.section}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {s.strength} students · {s.teacherNames || "No class teacher"}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
