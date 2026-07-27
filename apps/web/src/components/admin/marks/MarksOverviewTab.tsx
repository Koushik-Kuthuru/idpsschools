"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RotateCw, Search, Table2 } from "lucide-react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import { sortGrades } from "@/lib/gradeOrder";
import {
  fetchMarksDocs,
  fetchMarksIndex,
  type MarksDoc,
  type MarksIndexEntry,
} from "@/lib/marksApi";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StudentCell = {
  marks: number | null;
  gradeLabel: string;
  absent: boolean;
  maxMarks: number | null;
};

type OverviewRow = {
  studentId: string;
  name: string;
  roll: string;
  bySubject: Record<string, StudentCell>;
};

function cellDisplay(cell: StudentCell | undefined) {
  if (!cell) return { text: "—", sub: "" };
  if (cell.absent) return { text: "AB", sub: cell.gradeLabel || "" };
  if (typeof cell.marks === "number") {
    return { text: String(cell.marks), sub: cell.gradeLabel || "" };
  }
  return { text: "—", sub: cell.gradeLabel || "" };
}

export default function MarksOverviewTab() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name ?? null;

  const [index, setIndex] = useState<MarksIndexEntry[]>([]);
  const [docs, setDocs] = useState<MarksDoc[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (schoolId && academicYear) setActiveAcademicYear(schoolId, academicYear);
  }, [schoolId, academicYear]);

  const refreshIndex = useCallback(async () => {
    setLoadingIndex(true);
    setError(null);
    try {
      const entries = await fetchMarksIndex(schoolId, academicYear);
      setIndex(entries);
    } catch (err) {
      setIndex([]);
      setError(err instanceof Error ? err.message : "Failed to load marks catalog");
    } finally {
      setLoadingIndex(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    void refreshIndex();
  }, [refreshIndex]);

  const examOptions = useMemo(() => {
    const set = new Set<string>();
    index.forEach((d) => {
      if (d.exam) set.add(d.exam);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [index]);

  useEffect(() => {
    if (!exam && examOptions.length) setExam(examOptions[0]);
    else if (exam && examOptions.length && !examOptions.includes(exam)) setExam(examOptions[0]);
  }, [exam, examOptions]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    index
      .filter((d) => !exam || d.exam === exam)
      .forEach((d) => {
        if (d.grade) set.add(d.grade);
      });
    return sortGrades(Array.from(set));
  }, [index, exam]);

  useEffect(() => {
    if (!grade && gradeOptions.length) setGrade(gradeOptions[0]);
    else if (grade && gradeOptions.length && !gradeOptions.includes(grade)) setGrade(gradeOptions[0]);
  }, [grade, gradeOptions]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    index
      .filter((d) => (!exam || d.exam === exam) && (!grade || d.grade === grade))
      .forEach((d) => {
        if (d.section) set.add(d.section);
      });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [index, exam, grade]);

  useEffect(() => {
    if (!section && sectionOptions.length) setSection(sectionOptions[0]);
    else if (section && sectionOptions.length && !sectionOptions.includes(section)) {
      setSection(sectionOptions[0]);
    }
  }, [section, sectionOptions]);

  const loadScopedDocs = useCallback(async () => {
    if (!exam || !grade || !section) {
      setDocs([]);
      return;
    }
    setLoadingDocs(true);
    setError(null);
    try {
      const rows = await fetchMarksDocs(schoolId, academicYear, { exam, grade, section });
      setDocs(rows);
    } catch (err) {
      setDocs([]);
      setError(err instanceof Error ? err.message : "Failed to load marks");
    } finally {
      setLoadingDocs(false);
    }
  }, [schoolId, academicYear, exam, grade, section]);

  useEffect(() => {
    void loadScopedDocs();
  }, [loadScopedDocs]);

  const subjects = useMemo(() => {
    const map = new Map<string, number | null>();
    docs.forEach((d) => {
      if (!d.subject) return;
      map.set(d.subject, d.maxMarks ?? map.get(d.subject) ?? null);
    });
    return Array.from(map.entries())
      .map(([name, maxMarks]) => ({ name, maxMarks }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);

  const tableRows = useMemo(() => {
    const byStudent = new Map<string, OverviewRow>();

    for (const doc of docs) {
      for (const row of doc.rows ?? []) {
        const studentId = String(row.studentId ?? "").trim();
        if (!studentId) continue;
        if (!byStudent.has(studentId)) {
          byStudent.set(studentId, {
            studentId,
            name: String(row.studentName ?? "").trim() || "—",
            roll: String(row.admissionNo ?? row.roll ?? "").trim() || "—",
            bySubject: {},
          });
        }
        const entry = byStudent.get(studentId)!;
        if (row.studentName && entry.name === "—") entry.name = String(row.studentName).trim();
        if ((row.admissionNo || row.roll) && entry.roll === "—") {
          entry.roll = String(row.admissionNo ?? row.roll).trim();
        }
        entry.bySubject[doc.subject] = {
          marks: typeof row.marks === "number" ? row.marks : null,
          gradeLabel: String(row.gradeLabel ?? "").trim(),
          absent: Boolean(row.absent),
          maxMarks: (row.maxMarks as number | null | undefined) ?? doc.maxMarks ?? null,
        };
      }
    }

    return Array.from(byStudent.values()).sort((a, b) => {
      const byRoll = a.roll.localeCompare(b.roll, undefined, { numeric: true });
      if (byRoll !== 0) return byRoll;
      return a.name.localeCompare(b.name);
    });
  }, [docs]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.roll.toLowerCase().includes(q)
    );
  }, [tableRows, query]);

  const loading = loadingIndex || loadingDocs;
  const sheetCount = useMemo(() => {
    if (!exam || !grade || !section) return 0;
    return index.filter(
      (d) => d.exam === exam && d.grade === grade && d.section === section
    ).length;
  }, [index, exam, grade, section]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Table2 size={16} className="text-[#144835]" />
              All Marks
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {academicYear
                ? `Showing imported / saved marks for ${academicYear}`
                : "Select an academic year in the header"}
              {sheetCount ? ` · ${sheetCount} subject sheets` : ""}
              {examOptions.length ? ` · ${examOptions.length} exams` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refreshIndex();
              void loadScopedDocs();
            }}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : undefined} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Exam</span>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800"
            >
              {examOptions.length ? (
                examOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              ) : (
                <option value="">{loadingIndex ? "Loading…" : "No exams"}</option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Class</span>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800"
            >
              {gradeOptions.length ? (
                gradeOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))
              ) : (
                <option value="">—</option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Section</span>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800"
            >
              {sectionOptions.length ? (
                sectionOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              ) : (
                <option value="">—</option>
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Search</span>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or admission no."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-8 pr-3 text-xs font-semibold text-gray-800"
              />
            </div>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <SkeletonTable rows={10} columns={6} />
      ) : !examOptions.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-bold text-gray-800">No exams for this year</p>
          <p className="text-xs text-gray-500 mt-1">
            Import marks for {academicYear ?? "the selected year"} to populate exams and subjects.
          </p>
        </div>
      ) : !subjects.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-bold text-gray-800">No subject sheets for this selection</p>
          <p className="text-xs text-gray-500 mt-1">
            Try another exam / class / section combination.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50 z-10">
                    Student
                  </th>
                  {subjects.map((s) => (
                    <th
                      key={s.name}
                      className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center whitespace-nowrap"
                    >
                      {s.name}
                      {s.maxMarks != null ? (
                        <span className="block font-semibold normal-case text-gray-400">
                          /{s.maxMarks}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={subjects.length + 1}
                      className="px-4 py-10 text-center text-xs font-semibold text-gray-500"
                    >
                      No students match your search.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.studentId} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                        <div className="text-xs font-bold text-gray-900">{row.name}</div>
                        <div className="text-[10px] font-semibold text-gray-500">Adm {row.roll}</div>
                      </td>
                      {subjects.map((s) => {
                        const cell = cellDisplay(row.bySubject[s.name]);
                        return (
                          <td key={s.name} className="px-3 py-2.5 text-center">
                            <div
                              className={cn(
                                "text-xs font-bold",
                                cell.text === "AB" ? "text-amber-700" : "text-gray-800"
                              )}
                            >
                              {cell.text}
                            </div>
                            {cell.sub ? (
                              <div className="text-[10px] font-semibold text-gray-400">{cell.sub}</div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
