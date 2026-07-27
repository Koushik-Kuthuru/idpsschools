"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchClasses } from "@/hooks/useBranchClasses";
import { useBranchStaff } from "@/hooks/useBranchStaff";
import { useBranchStudents } from "@/hooks/useBranchStudents";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import {
  Skeleton,
  SkeletonList,
  SkeletonPage,
  SkeletonTableRows,
} from "@/components/ui/Skeleton";
import { gradeDisplayLabel, gradesMatchForClass } from "@/lib/gradeOrder";
import {
  classTeachersForSection,
  indexClassTeachersBySection,
} from "@/lib/classTeacherAssignments";
import { buildPath, fetchMany, db } from "@/lib/db-client";
import { subjectDisplayName } from "@/lib/subjectStore";

const SafeLink = Link as any;

type SubjectRow = {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
};

type Props = {
  grade: string;
  section: string;
};

function displaySubjectName(name: string) {
  const raw = String(name ?? "").trim();
  if (!raw) return "Unnamed Subject";
  const fromMap = subjectDisplayName(raw);
  if (fromMap && fromMap !== raw) return fromMap;
  return raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export default function AdminSectionDetailPage({ grade, section }: Props) {
  const schoolId = useSchoolId();
  const router = useRouter();
  const { currentYear, loading: yearLoading } = useAcademicYear();
  const { classes: branchClasses, loading: classesLoading, error: classesError } =
    useBranchClasses(schoolId, currentYear?.name);
  const { staff: teachingStaff, loading: staffLoading } = useBranchStaff(
    schoolId,
    "teaching",
    currentYear?.name
  );
  const { students, loading: studentsLoading } = useBranchStudents(
    schoolId,
    currentYear?.name,
    "enrolled"
  );

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  const classTeacherIndex = useMemo(
    () => indexClassTeachersBySection(teachingStaff),
    [teachingStaff]
  );

  const classRecord = useMemo(() => {
    const sectionKey = section.trim().toUpperCase();
    return (
      branchClasses.find(
        (c) =>
          gradesMatchForClass(c.grade, grade) &&
          c.section.trim().toUpperCase() === sectionKey
      ) ?? null
    );
  }, [branchClasses, grade, section]);

  const resolvedGrade = classRecord?.grade || grade;
  const resolvedSection = classRecord?.section || section.trim().toUpperCase();

  const teachers = useMemo(
    () => classTeachersForSection(classTeacherIndex, resolvedGrade, resolvedSection),
    [classTeacherIndex, resolvedGrade, resolvedSection]
  );

  const sectionStudents = useMemo(() => {
    const sectionKey = resolvedSection.toUpperCase();
    return students
      .filter(
        (s) =>
          gradesMatchForClass(s.className, resolvedGrade) &&
          String(s.section ?? "")
            .trim()
            .toUpperCase() === sectionKey
      )
      .slice()
      .sort((a, b) => {
        const byRoll = String(a.roll).localeCompare(String(b.roll), undefined, {
          numeric: true,
          sensitivity: "base",
        });
        if (byRoll !== 0) return byRoll;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      });
  }, [students, resolvedGrade, resolvedSection]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      setSubjectsLoading(true);
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "subjects"), {
          skipCache: true,
        });
        const yearName = currentYear?.name ?? "";
        const sectionKey = resolvedSection.toUpperCase();
        const rows: SubjectRow[] = [];
        for (const doc of snap.docs) {
          const data = doc.data() as Record<string, unknown>;
          const classId = String(data.classId ?? "").trim();
          const sec = String(data.section ?? "")
            .trim()
            .toUpperCase();
          const academicYear = String(data.academicYear ?? "").trim();
          if (yearName && academicYear && academicYear !== yearName) continue;
          if (!gradesMatchForClass(classId, resolvedGrade)) continue;
          if (sec !== sectionKey) continue;
          const teachersArr = Array.isArray(data.teachers)
            ? data.teachers.map((t) => String(t).trim()).filter(Boolean)
            : [];
          rows.push({
            id: doc.id,
            name: String(data.name ?? "Unnamed Subject"),
            teacherName: String(data.teacherName ?? "").trim() || teachersArr[0] || "",
            studentCount: Number(data.studentCount ?? 0) || 0,
          });
        }
        rows.sort((a, b) =>
          displaySubjectName(a.name).localeCompare(displaySubjectName(b.name), undefined, {
            sensitivity: "base",
          })
        );
        if (!cancelled) setSubjects(rows);
      } catch {
        if (!cancelled) setSubjects([]);
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    }
    if (schoolId && resolvedGrade && resolvedSection) void loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [schoolId, resolvedGrade, resolvedSection, currentYear?.name]);

  const isLoading =
    ((classesLoading || staffLoading) && !branchClasses.length) ||
    (yearLoading && !currentYear);

  const classHref = `/schools/${schoolId}/admin/academic/classes/${encodeURIComponent(resolvedGrade)}`;
  const classesHref = `/schools/${schoolId}/admin/academic/classes`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] pb-10 font-jost">
        <SkeletonPage stats={4} rows={6} columns={5} toolbar={false} />
      </div>
    );
  }

  if (classesError) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 pb-10 font-jost">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {classesError}
        </div>
        <SafeLink
          href={classesHref}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700"
        >
          <ArrowLeft size={14} /> Back to classes
        </SafeLink>
      </div>
    );
  }

  if (!classRecord) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4 pb-10 font-jost">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-bold text-gray-900">Section not found</p>
          <p className="mt-1 text-xs text-gray-500">
            {gradeDisplayLabel(grade)} — {section}
            {currentYear?.name ? ` · ${currentYear.name}` : ""}
          </p>
          <SafeLink
            href={classesHref}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <SafeLink href={classHref} className="rounded-lg p-2 text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={18} />
          </SafeLink>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              <SafeLink href={classHref} className="hover:text-[#144835]">
                {gradeDisplayLabel(resolvedGrade)}
              </SafeLink>
              {" · "}
              Section · {currentYear?.name ?? "—"}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-gray-900">
              {gradeDisplayLabel(resolvedGrade)} — {resolvedSection}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {classRecord.strength} enrolled ·{" "}
              {teachers.length
                ? teachers.map((t) => t.name).join(", ")
                : "No class teacher"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SafeLink
            href={`/schools/${schoolId}/admin/academic/subjects`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <BookOpen size={14} /> Subjects
          </SafeLink>
          <SafeLink
            href={`/schools/${schoolId}/admin/academic/timetable?tab=class`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <CalendarDays size={14} /> Timetable
          </SafeLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Strength</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{classRecord.strength}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Students listed</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{sectionStudents.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Subjects</p>
          {subjectsLoading ? (
            <Skeleton className="mt-2 h-6 w-10" />
          ) : (
            <p className="mt-1 text-xl font-bold text-gray-900">{subjects.length}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Room</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-gray-900">
            <MapPin size={14} className="text-gray-400" /> TBD
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-[#144835]" />
          <h2 className="text-sm font-bold text-gray-800">Class teachers</h2>
        </div>
        {teachers.length ? (
          <ul className="flex flex-wrap gap-2">
            {teachers.map((t) => (
              <li
                key={`${t.name}-${t.staffId ?? ""}`}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800"
              >
                {t.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-medium text-gray-400">Unassigned</p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-2.5">
          <h2 className="text-xs font-bold text-gray-800">Subjects</h2>
          {subjectsLoading ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <span className="text-xs font-semibold text-gray-500">{subjects.length} subjects</span>
          )}
        </div>
        {subjectsLoading ? (
          <SkeletonList rows={4} avatar={false} />
        ) : subjects.length ? (
          <div className="divide-y divide-gray-100">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}`
                  )
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-gray-900">
                    {displaySubjectName(s.name)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {s.teacherName || "Unassigned"}
                    {s.studentCount ? ` · ${s.studentCount} students` : ""}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-xs text-gray-500">
            No subjects for this section yet.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-2.5">
          <h2 className="text-xs font-bold text-gray-800">Students</h2>
          {studentsLoading ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <span className="text-xs font-semibold text-gray-500">
              {sectionStudents.length} students
            </span>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Roll
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Admission No
                </th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="w-10 px-5 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {studentsLoading ? (
                <SkeletonTableRows rows={6} columns={5} />
              ) : sectionStudents.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/50"
                  onClick={() =>
                    router.push(
                      `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`
                    )
                  }
                >
                  <td className="px-5 py-2.5 text-xs font-bold tabular-nums text-gray-700">
                    {s.roll || "—"}
                  </td>
                  <td className="px-5 py-2.5 text-xs font-extrabold text-gray-900">{s.name}</td>
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">
                    {s.admissionNo || "—"}
                  </td>
                  <td className="px-5 py-2.5">
                    <span
                      className={
                        s.status === "Active"
                          ? "rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700"
                          : "rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-gray-400">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
              {!studentsLoading && !sectionStudents.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">
                    No students in this section.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 lg:hidden">
          {studentsLoading ? (
            <SkeletonList rows={6} />
          ) : sectionStudents.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                router.push(
                  `/schools/${schoolId}/admin/academic/students/${encodeURIComponent(s.id)}/profile`
                )
              }
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{s.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Roll {s.roll || "—"} · {s.admissionNo || "No adm. no"}
                </p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-gray-400" />
            </button>
          ))}
          {!studentsLoading && !sectionStudents.length ? (
            <p className="px-4 py-8 text-center text-xs text-gray-500">
              No students in this section.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
