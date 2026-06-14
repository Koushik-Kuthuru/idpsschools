"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookOpen, ClipboardList, Plus, RotateCw, Trash2, Users, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getTestOptionsForClass } from "./testOptions";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  computeTestResultStats,
  getTestScheduleStatus,
  statusLabel,
  statusSortOrder,
  type TestResultStats,
  type TestScheduleStatus,
} from "./testStats";

export type TestCategory = "class_test" | "examination";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACTIVE_CATEGORY: TestCategory = "class_test";

type ExamEntry = {
  id: string;
  name: string;
  category: TestCategory;
  classId: string;
  section: string;
  startDate?: string;
  endDate?: string;
};

type StudentRow = { id: string; grade: string; section: string };
type MarksDoc = {
  exam: string;
  grade: string;
  section: string;
  subject?: string;
  rows?: { studentId: string; marks: number | "" }[];
};

type SubjectRecord = { name: string; classId: string; section: string };

type TestRow = ExamEntry & {
  status: TestScheduleStatus;
  stats: TestResultStats;
};

function parseCategory(value: unknown): TestCategory {
  return value === "examination" ? "examination" : "class_test";
}

const gradeLabel = (grade: string) => {
  if (!grade) return "—";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  return `Grade ${grade}`;
};

function StatusBadge({ status }: { status: TestScheduleStatus }) {
  const styles: Record<TestScheduleStatus, string> = {
    live: "bg-emerald-100 text-emerald-800 border-emerald-200",
    upcoming: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-slate-100 text-slate-600 border-slate-200",
    unscheduled: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        styles[status]
      )}
    >
      {status === "live" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      ) : null}
      {statusLabel(status)}
    </span>
  );
}

export default function TestsPanel() {
  const schoolId = useSchoolId();
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marksDocs, setMarksDocs] = useState<MarksDoc[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [sectionsByClass, setSectionsByClass] = useState<Record<string, string[]>>({});
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterTestType, setFilterTestType] = useState("");
  const [allSubjects, setAllSubjects] = useState(true);
  const [pickedSubjects, setPickedSubjects] = useState<string[]>([]);
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addClass, setAddClass] = useState("");
  const [addSection, setAddSection] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [newStart, setNewStart] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadClasses() {
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
        const grades = new Set<string>();
        const byClass: Record<string, Set<string>> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const grade = String(data.grade ?? data.name ?? "").trim();
          const section = String(data.section ?? "").trim().toUpperCase();
          if (!grade) return;
          grades.add(grade);
          if (!byClass[grade]) byClass[grade] = new Set();
          if (section) byClass[grade].add(section);
        });
        const sortedGrades = Array.from(grades).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        const mapped: Record<string, string[]> = {};
        sortedGrades.forEach((g) => {
          mapped[g] = Array.from(byClass[g] ?? []).sort();
        });
        setClassOptions(sortedGrades);
        setSectionsByClass(mapped);
      } catch (err) {
        console.error(err);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    async function loadSupportData() {
      try {
        const [stuSnap, marksSnap, subjectsSnap] = await Promise.all([
          getDocs(collection(db, "schools", schoolId, "students")),
          getDocs(collection(db, "schools", schoolId, "marks")),
          getDocs(collection(db, "schools", schoolId, "subjects")),
        ]);
        setStudents(
          stuSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              grade: String(data.grade ?? "").trim(),
              section: String(data.section ?? "").trim().toUpperCase(),
            };
          })
        );
        setMarksDocs(
          marksSnap.docs.map((d) => {
            const data = d.data();
            return {
              exam: String(data.exam ?? "").trim(),
              grade: String(data.grade ?? "").trim(),
              section: String(data.section ?? "").trim().toUpperCase(),
              subject: String(data.subject ?? "").trim(),
              rows: data.rows,
            };
          })
        );
        setSubjectCatalog(
          subjectsSnap.docs.map((d) => {
            const data = d.data();
            return {
              name: String(data.name ?? "").trim(),
              classId: String(data.classId ?? data.grade ?? "").trim(),
              section: String(data.section ?? "").trim().toUpperCase(),
            };
          }).filter((s) => s.name)
        );
      } catch (err) {
        console.error(err);
      }
    }
    loadSupportData();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "schools", schoolId, "exam_types"), (snap) => {
      setEntries(
        snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name ?? "").trim(),
              category: parseCategory(data.category),
              classId: String(data.classId ?? data.grade ?? "").trim(),
              section: String(data.section ?? "").trim().toUpperCase(),
              startDate: data.startDate ? String(data.startDate) : undefined,
              endDate: data.endDate ? String(data.endDate) : undefined,
            };
          })
          .filter((e) => e.name && e.category === ACTIVE_CATEGORY)
      );
    });
    return () => unsub();
  }, []);

  const sectionOptions = useMemo(
    () => (filterClass ? sectionsByClass[filterClass] ?? [] : []),
    [filterClass, sectionsByClass]
  );

  const testTypeOptions = useMemo(() => {
    const names = new Set<string>();
    entries.forEach((e) => names.add(e.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const subjectOptions = useMemo(() => {
    const names = new Set<string>();
    subjectCatalog.forEach((s) => {
      if (filterClass && s.classId !== filterClass) return;
      if (filterSection && s.section !== filterSection) return;
      names.add(s.name);
    });
    marksDocs.forEach((m) => {
      if (!m.subject) return;
      if (filterClass && m.grade !== filterClass) return;
      if (filterSection && m.section !== filterSection) return;
      names.add(m.subject);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [subjectCatalog, marksDocs, filterClass, filterSection]);

  const activeSubjectFilter = useMemo(
    () =>
      allSubjects || pickedSubjects.length === 0 ? undefined : pickedSubjects,
    [allSubjects, pickedSubjects]
  );

  const resetSubjectFilter = () => {
    setAllSubjects(true);
    setPickedSubjects([]);
  };

  const toggleAllSubjects = () => {
    setAllSubjects(true);
    setPickedSubjects([]);
  };

  const toggleSubject = (name: string) => {
    if (allSubjects) {
      setAllSubjects(false);
      setPickedSubjects([name]);
      return;
    }
    setPickedSubjects((prev) => {
      const next = prev.includes(name)
        ? prev.filter((s) => s !== name)
        : [...prev, name];
      if (next.length === 0 || next.length === subjectOptions.length) {
        setAllSubjects(true);
        return [];
      }
      return next;
    });
  };

  const addSectionOptions = useMemo(
    () => (addClass ? sectionsByClass[addClass] ?? [] : []),
    [addClass, sectionsByClass]
  );

  useEffect(() => {
    if (filterSection && sectionOptions.length > 0 && !sectionOptions.includes(filterSection)) {
      setFilterSection("");
    }
  }, [filterClass, sectionOptions, filterSection]);

  useEffect(() => {
    if (addSection && addSectionOptions.length > 0 && !addSectionOptions.includes(addSection)) {
      setAddSection("");
      setSelectedTest("");
    }
  }, [addClass, addSectionOptions, addSection]);

  useEffect(() => {
    if (filterTestType && !testTypeOptions.includes(filterTestType)) {
      setFilterTestType("");
    }
  }, [filterTestType, testTypeOptions]);

  const addTestOptions = useMemo(() => {
    if (!addClass) return [];
    return getTestOptionsForClass(ACTIVE_CATEGORY, addClass);
  }, [addClass]);

  const availableTests = useMemo(() => {
    if (!addClass || !addSection) return [];
    return addTestOptions.filter(
      (name) =>
        !entries.some(
          (e) =>
            e.classId === addClass &&
            e.section === addSection &&
            e.name === name
        )
    );
  }, [addTestOptions, entries, addClass, addSection]);

  useEffect(() => {
    if (selectedTest && !availableTests.includes(selectedTest)) {
      setSelectedTest("");
    }
  }, [availableTests, selectedTest]);

  const testRows = useMemo((): TestRow[] => {
    return entries
      .map((entry) => ({
        ...entry,
        status: getTestScheduleStatus(entry.startDate, entry.endDate),
        stats: computeTestResultStats(
          entry.name,
          entry.classId,
          entry.section,
          students,
          marksDocs,
          activeSubjectFilter
        ),
      }))
      .sort((a, b) => {
        const order = statusSortOrder(a.status) - statusSortOrder(b.status);
        if (order !== 0) return order;
        const dateA = a.startDate ?? "";
        const dateB = b.startDate ?? "";
        return dateB.localeCompare(dateA);
      });
  }, [entries, students, marksDocs, activeSubjectFilter]);

  const filtered = useMemo(() => {
    return testRows.filter((e) => {
      if (filterClass && e.classId !== filterClass) return false;
      if (filterSection && e.section !== filterSection) return false;
      if (filterTestType && e.name !== filterTestType) return false;
      return true;
    });
  }, [testRows, filterClass, filterSection, filterTestType]);

  const summary = useMemo(() => {
    const live = filtered.filter((t) => t.status === "live").length;
    const upcoming = filtered.filter((t) => t.status === "upcoming").length;
    const completed = filtered.filter((t) => t.status === "completed").length;
    return { live, upcoming, completed, total: filtered.length };
  }, [filtered]);

  const handleClassChange = (grade: string) => {
    setFilterClass(grade);
    setFilterSection("");
    resetSubjectFilter();
  };

  const resetAddForm = () => {
    setAddClass("");
    setAddSection("");
    setSelectedTest("");
    setNewStart("");
  };

  const closeAddDrawer = () => {
    setShowAddForm(false);
    resetAddForm();
  };

  const openAddDrawer = () => {
    setAddClass(filterClass);
    setAddSection(filterSection);
    setSelectedTest("");
    setNewStart("");
    setShowAddForm(true);
  };

  const handleAdd = async () => {
    if (!selectedTest || !newStart || !addClass || !addSection) return;
    setIsSaving(true);
    try {
      const slug = selectedTest.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
      const id = `${ACTIVE_CATEGORY}_${addClass}_${addSection}_${slug}`;
      await setDoc(doc(db, "schools", schoolId, "exam_types", id), {
        name: selectedTest,
        category: ACTIVE_CATEGORY,
        classId: addClass,
        section: addSection,
        startDate: newStart,
        endDate: newStart,
        updatedAt: serverTimestamp(),
      });
      closeAddDrawer();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!showAddForm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAddForm]);

  const handleDelete = async (examId: string) => {
    setDeletingId(examId);
    try {
      await deleteDoc(doc(db, "schools", schoolId, "exam_types", examId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls =
    "h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all";

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 items-end flex-1 min-w-0">
            <div className="flex flex-col gap-1.5 w-full sm:w-[130px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
              <select
                value={filterClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className={inputCls}
              >
                <option value="">All classes</option>
                {classOptions.map((g) => (
                  <option key={g} value={g}>{gradeLabel(g)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[110px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
              <select
                value={filterSection}
                onChange={(e) => {
                  setFilterSection(e.target.value);
                  resetSubjectFilter();
                }}
                disabled={!filterClass}
                className={cn(inputCls, "disabled:opacity-60")}
              >
                <option value="">All sections</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 w-full sm:w-[150px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type of test</label>
              <select
                value={filterTestType}
                onChange={(e) => setFilterTestType(e.target.value)}
                className={inputCls}
              >
                <option value="">All test types</option>
                {testTypeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddDrawer}
            className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all shrink-0 self-center"
          >
            <Plus size={14} />
            Add Test
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject</p>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 cursor-pointer hover:border-[#144835]/30 transition-colors">
              <input
                type="checkbox"
                checked={allSubjects}
                onChange={(e) => {
                  if (e.target.checked) toggleAllSubjects();
                  else setAllSubjects(false);
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
              />
              <span className="text-xs font-semibold text-gray-800">All</span>
            </label>
            {subjectOptions.map((subject) => {
              const checked = allSubjects || pickedSubjects.includes(subject);
              return (
                <label
                  key={subject}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors",
                    checked && !allSubjects
                      ? "border-[#144835]/30 bg-[#144835]/5"
                      : "border-gray-200 bg-gray-50/50 hover:border-[#144835]/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(subject)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
                  />
                  <span className="text-xs font-semibold text-gray-800">{subject}</span>
                </label>
              );
            })}
            {subjectOptions.length === 0 ? (
              <span className="text-xs text-gray-400 py-1.5">No subjects found for selected class</span>
            ) : null}
          </div>
        </div>

      </div>

      {showAddForm ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close add test panel"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={closeAddDrawer}
          />
          <aside
            role="dialog"
            aria-label="Add test"
            className="relative h-full w-full max-w-md bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#144835]/10 text-[#144835]">
                      <ClipboardList size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Add Test</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Schedule a class test for marks entry</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeAddDrawer}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#144835] hover:bg-white border border-transparent hover:border-gray-200 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
                <select
                  value={addClass}
                  onChange={(e) => {
                    setAddClass(e.target.value);
                    setAddSection("");
                    setSelectedTest("");
                  }}
                  className={cn(inputCls, "w-full")}
                >
                  <option value="">Select class</option>
                  {classOptions.map((g) => (
                    <option key={g} value={g}>{gradeLabel(g)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
                <select
                  value={addSection}
                  onChange={(e) => {
                    setAddSection(e.target.value);
                    setSelectedTest("");
                  }}
                  disabled={!addClass}
                  className={cn(inputCls, "w-full disabled:opacity-60")}
                >
                  <option value="">Select section</option>
                  {addSectionOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test</label>
                <select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  disabled={
                    !addClass ||
                    !addSection ||
                    (availableTests.length === 0 && Boolean(addClass && addSection))
                  }
                  className={cn(inputCls, "w-full disabled:opacity-60")}
                >
                  <option value="">
                    {!addClass || !addSection
                      ? "Select class & section first"
                      : availableTests.length === 0
                        ? "All tests added"
                        : "Select test"}
                  </option>
                  {availableTests.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test date</label>
                <input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className={cn(inputCls, "w-full")}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40 flex gap-2">
              <button
                type="button"
                onClick={closeAddDrawer}
                className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isSaving || !selectedTest || !newStart || !addClass || !addSection}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#a2c144] text-[#144835] text-xs font-bold hover:bg-[#b5d351] shadow-sm disabled:opacity-60 transition-all"
              >
                {isSaving ? <RotateCw size={13} className="animate-spin" /> : <Plus size={13} />}
                Save Test
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {summary.live > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {summary.live} live
            </span>
          ) : null}
          {summary.upcoming > 0 ? (
            <span className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
              {summary.upcoming} upcoming
            </span>
          ) : null}
          {summary.completed > 0 ? (
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              {summary.completed} completed
            </span>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={20} className="text-blue-500" />
          </div>
          <p className="text-sm font-bold text-gray-700">No tests found</p>
          <p className="text-xs text-gray-400 mt-1">
            {entries.length === 0
              ? "Use Add Test to schedule a class test"
              : "Try changing the class, section, test type, or subject filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Test</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Class</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Students</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Passed</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Failed</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Pass %</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <BookOpen size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{entry.name}</p>
                          <p className="text-[11px] text-gray-400">Class test</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-800">{gradeLabel(entry.classId)}</p>
                      <p className="text-[11px] text-gray-500">Section {entry.section}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700">{entry.startDate ?? "—"}</p>
                      {entry.endDate && entry.endDate !== entry.startDate ? (
                        <p className="text-[11px] text-gray-400">to {entry.endDate}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700">
                        <Users size={12} className="text-gray-400" />
                        {entry.stats.totalStudents}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.stats.hasMarks ? (
                        <span className="text-xs font-bold text-emerald-700">{entry.stats.passed}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.stats.hasMarks ? (
                        <span className="text-xs font-bold text-red-600">{entry.stats.failed}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.stats.hasMarks ? (
                        <span
                          className={cn(
                            "inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold",
                            entry.stats.passPct >= 75
                              ? "bg-emerald-50 text-emerald-700"
                              : entry.stats.passPct >= 50
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          )}
                        >
                          {entry.stats.passPct}%
                        </span>
                      ) : entry.status === "completed" ? (
                        <span className="text-[10px] font-semibold text-gray-400">Pending</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="h-7 w-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0 disabled:opacity-50 mx-auto"
                      >
                        {deletingId === entry.id ? (
                          <RotateCw size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
