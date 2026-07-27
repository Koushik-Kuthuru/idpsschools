"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import AdminPageHeader from "@/components/admin/PageHeader";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import Link from "next/link";
const SafeLink = Link as any;
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Plus, Search, Trash2, Eye, Pencil } from "lucide-react";
import { buildPath, subscribeData, buildQuery, sortBy, db } from "@/lib/db-client";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import { gradeSortKey } from "@/lib/gradeOrder";
import { subjectDisplayName } from "@/lib/subjectStore";

type PortionStatus = "Planned" | "In Progress" | "Completed";

type SubjectPortion = {
  title: string;
  chapters: string;
  from: string;
  to: string;
  status: PortionStatus;
};

export type AcademicSubject = {
  id: string;
  grade: string;
  section: string;
  name: string;
  description: string;
  portions: SubjectPortion[];
  teachers: string[];
  teacherName: string;
  studentCount: number;
  weeklyPeriods: number;
  academicYear?: string;
};

function displaySubjectName(name: string) {
  const raw = String(name ?? "").trim();
  if (!raw) return "Unnamed Subject";
  const fromMap = subjectDisplayName(raw);
  if (fromMap && fromMap !== raw) return fromMap;
  return raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export default function AdminSubjectsPage() {
  const schoolId = useSchoolId();
  const router = useRouter();
  const { currentYear } = useAcademicYear();
  const { grades: branchGrades, sectionsByClass } = useBranchClassOptions(schoolId);
  const allClassesKey = "All";
  const allSectionsKey = "All";
  const allSubjectsKey = "All";
  const [allSubjects, setAllSubjects] = useState<AcademicSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [grade, setGrade] = useState(allClassesKey);
  const [section, setSection] = useState(allSectionsKey);
  const [subjectFilter, setSubjectFilter] = useState(allSubjectsKey);

  const classOptions = useMemo(
    () => [allClassesKey, ...branchGrades],
    [allClassesKey, branchGrades]
  );

  const sectionOptions = useMemo(() => {
    const allBranchSections = Object.values(sectionsByClass).flat();
    const seen = new Set<string>();
    const uniqueAllSections = allBranchSections.filter((s) => {
      const key = s.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    uniqueAllSections.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    const sections =
      grade === allClassesKey ? uniqueAllSections : sectionsByClass[grade] ?? [];
    return [allSectionsKey, ...sections];
  }, [grade, sectionsByClass, allClassesKey, allSectionsKey]);

  const scopedForSubjectOptions = useMemo(() => {
    return allSubjects.filter((s) => {
      const matchGrade = grade === allClassesKey || s.grade === grade;
      const matchSection =
        section === allSectionsKey || s.section.toUpperCase() === section.toUpperCase();
      return matchGrade && matchSection;
    });
  }, [allSubjects, grade, section, allClassesKey, allSectionsKey]);

  const subjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of scopedForSubjectOptions) {
      const label = displaySubjectName(s.name);
      const key = label.toLowerCase();
      if (!seen.has(key)) seen.set(key, label);
    }
    const names = Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    return [allSubjectsKey, ...names];
  }, [scopedForSubjectOptions, allSubjectsKey]);

  const subjects = useMemo(() => {
    const filtered = scopedForSubjectOptions.filter((s) => {
      const label = displaySubjectName(s.name);
      const matchSubject =
        subjectFilter === allSubjectsKey ||
        label.toLowerCase() === subjectFilter.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        label.toLowerCase().includes(q) ||
        s.teacherName.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });

    filtered.sort((a, b) => {
      const byGrade = gradeSortKey(a.grade) - gradeSortKey(b.grade);
      if (byGrade !== 0) return byGrade;
      const bySection = a.section.localeCompare(b.section, undefined, { sensitivity: "base" });
      if (bySection !== 0) return bySection;
      return displaySubjectName(a.name).localeCompare(displaySubjectName(b.name), undefined, {
        sensitivity: "base",
      });
    });

    return filtered;
  }, [
    scopedForSubjectOptions,
    subjectFilter,
    searchQuery,
    allSubjectsKey,
  ]);

  const gradeLabel = (g: string) => {
    if (g === allClassesKey || g === "all") return "All Grades";
    return /^\d+$/.test(g) ? `Grade ${g}` : g;
  };

  const sectionLabel = (s: string) => {
    if (s === allSectionsKey) return "All Sections";
    return s;
  };

  const subjectLabel = (s: string) => {
    if (s === allSubjectsKey) return "All Subjects";
    return s;
  };

  const sectionDisplay = (sec: string) => {
    const sectionText = String(sec ?? "").trim();
    return !sectionText || sectionText === "-" ? "—" : sectionText;
  };

  useEffect(() => {
    if (schoolId && currentYear?.name) setActiveAcademicYear(schoolId, currentYear.name);
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);

    const qRef = buildQuery(buildPath(db, "schools", schoolId, "subjects"), sortBy("name", "asc"));

    const unsubscribe = subscribeData(qRef, (snapshot: any) => {
      const yearName = currentYear?.name ?? "";
      const rows: AcademicSubject[] = snapshot.docs
        .map((doc: any) => {
          const data = doc.data();
          const teachers = Array.isArray(data.teachers)
            ? data.teachers.map((t: unknown) => String(t).trim()).filter(Boolean)
            : [];
          return {
            id: doc.id,
            grade: data.classId || "-",
            section: data.section || "-",
            name: data.name || "Unnamed Subject",
            description: data.description || "",
            portions: data.portions || [],
            teachers,
            teacherName: String(data.teacherName ?? "").trim() || teachers[0] || "",
            studentCount: Number(data.studentCount ?? 0) || 0,
            weeklyPeriods: Number(data.weeklyPeriods ?? 0) || 0,
            academicYear: data.academicYear,
          };
        })
        .filter((s: AcademicSubject) => {
          if (!yearName) return true;
          return String(s.academicYear ?? "") === yearName;
        });

      setAllSubjects(rows);
      setLoading(false);
    }, (err: any) => {
      console.error("Error loading subjects:", err);
      setLoadError("Failed to load subjects. Check permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    if (classOptions.length && grade !== allClassesKey && !classOptions.includes(grade)) {
      setGrade(allClassesKey);
    }
  }, [classOptions, grade, allClassesKey]);

  useEffect(() => {
    if (grade === allClassesKey) return;
    const sections = sectionsByClass[grade] ?? [];
    if (
      section !== allSectionsKey &&
      !sections.some((s) => s.toUpperCase() === section.toUpperCase())
    ) {
      setSection(allSectionsKey);
    }
  }, [grade, section, sectionsByClass, allClassesKey, allSectionsKey]);

  useEffect(() => {
    if (subjectFilter === allSubjectsKey) return;
    if (!subjectOptions.some((s) => s.toLowerCase() === subjectFilter.toLowerCase())) {
      setSubjectFilter(allSubjectsKey);
    }
  }, [subjectOptions, subjectFilter, allSubjectsKey]);

  const handleGradeChange = (nextGrade: string) => {
    setGrade(nextGrade);
    if (nextGrade === allClassesKey) return;
    const sections = sectionsByClass[nextGrade] ?? [];
    if (
      section !== allSectionsKey &&
      !sections.some((s) => s.toUpperCase() === section.toUpperCase())
    ) {
      setSection(allSectionsKey);
    }
  };

  const openSubject = (id: string) => {
    router.push(`/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(id)}`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Subjects"
        description={`Subjects for each class and section${currentYear?.name ? ` · ${currentYear.name}` : ""} with assigned teachers and students`}
        actions={
          <SafeLink
            href={`/schools/${schoolId}/admin/academic/subjects/new`}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 whitespace-nowrap transition-all"
          >
            <Plus size={14} /> Add Subject
          </SafeLink>
        }
      />

      {loadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
              placeholder="Search subject or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none min-w-0">
              <select
                value={grade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full min-w-0 sm:min-w-[130px] h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
                {classOptions.map((g) => (
                  <option key={g} value={g}>
                    {gradeLabel(g)}
                  </option>
                ))}
              </select>
              <ChevronRight
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              />
            </div>

            <div className="relative flex-1 sm:flex-none min-w-0">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full min-w-0 sm:min-w-[160px] h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
              <ChevronRight
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              />
            </div>

            <div className="relative flex-1 sm:flex-none min-w-0">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full min-w-0 sm:min-w-[180px] h-9 appearance-none bg-gray-50/50 border border-gray-200 rounded-lg px-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
              >
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>
                    {subjectLabel(s)}
                  </option>
                ))}
              </select>
              <ChevronRight
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {loading ? <Skeleton className="h-3 w-20" /> : `${subjects.length} results`}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={6} showHeader={false} className="rounded-none border-0" />
        ) : (
        <>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Students
                </th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50/50 last:border-0 cursor-pointer"
                  onClick={() => openSubject(s.id)}
                >
                  <td className="px-5 py-2.5">
                    <p className="text-xs font-extrabold text-gray-900 truncate">
                      {displaySubjectName(s.name)}
                    </p>
                  </td>
                  <td className="px-5 py-2.5 text-xs font-bold text-gray-700">
                    {gradeLabel(s.grade)}
                  </td>
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">
                    {sectionDisplay(s.section)}
                  </td>
                  <td className="px-5 py-2.5 text-xs font-semibold text-gray-700">
                    <span className={s.teacherName ? "text-gray-800" : "text-gray-400"}>
                      {s.teacherName || "Unassigned"}
                    </span>
                    {s.teachers.length > 1 ? (
                      <span className="ml-1 text-[10px] font-bold text-gray-400">
                        +{s.teachers.length - 1}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-bold text-gray-700 tabular-nums">
                      {s.studentCount || "—"}
                    </span>
                  </td>
                  <td
                    className="px-5 py-2.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableRowActions
                      items={[
                        {
                          label: "View",
                          icon: Eye,
                          href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}`,
                        },
                        {
                          label: "Edit",
                          icon: Pencil,
                          href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}/edit`,
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          destructive: true,
                          dividerBefore: true,
                          confirmMessage: `Delete subject ${displaySubjectName(s.name)}? This cannot be undone.`,
                          onClick: () => deleteSchoolDocument(schoolId, "subjects", s.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!loading && subjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
                      <BookOpen size={16} className="text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">No subjects found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Add subjects per class/section to use in Marks and planning.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden divide-y divide-gray-100">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-4 cursor-pointer"
              onClick={() => openSubject(s.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-gray-900 truncate">
                    {displaySubjectName(s.name)}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <TableRowActions
                    items={[
                      {
                        label: "View",
                        icon: Eye,
                        href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}`,
                      },
                      {
                        label: "Edit",
                        icon: Pencil,
                        href: `/schools/${schoolId}/admin/academic/subjects/${encodeURIComponent(s.id)}/edit`,
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        destructive: true,
                        dividerBefore: true,
                        confirmMessage: `Delete subject ${displaySubjectName(s.name)}? This cannot be undone.`,
                        onClick: () => deleteSchoolDocument(schoolId, "subjects", s.id),
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">
                  {gradeLabel(s.grade)}
                </span>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100/80 px-2 py-0.5 rounded">
                  Sec {sectionDisplay(s.section)}
                </span>
                <span className="text-xs font-semibold text-gray-700 bg-[#144835]/10 text-[#144835] px-2 py-0.5 rounded">
                  {s.teacherName || "No teacher"}
                </span>
                <span className="text-xs font-semibold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">
                  {s.studentCount || 0} students
                </span>
              </div>
            </div>
          ))}
          {!loading && subjects.length === 0 && (
            <div className="px-5 py-8 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
                <BookOpen size={16} className="text-gray-400" />
              </div>
              <p className="text-xs font-bold text-gray-900">No subjects found</p>
              <p className="text-xs text-gray-500 mt-1">
                Add subjects per class/section to use in Marks and planning.
              </p>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
