"use client";


import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { 
 BarChart3, 
 Check, 
 ChevronDown,
 Download, 
 RotateCcw,
 RotateCw,
 Search, 
 Upload, 
 XCircle, 
 Users, 
 Trophy, 
 Percent, 
 TrendingUp,
 Save,
 AlertCircle,
 Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";


import { useSchoolId } from "@/hooks/useSchoolId";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonList, SkeletonTableRows } from "@/components/ui/Skeleton";
import { useTeacherPortalScope } from "@/contexts/TeacherPortalScopeContext";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import { filterGradesByScope, filterSectionsByScope, matchesClassScope } from "@/lib/teacherClassScope";
import Link from "next/link";
import { buildPath, fetchOne, fetchMany, upsertData, subscribeData, db, auth } from "@/lib/db-client";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import { marksDocId as buildMarksDocId } from "@/lib/loadBranchMarks";
import { fetchMarksDocs, fetchMarksIndex } from "@/lib/marksApi";
import { CBSE_GRADES, gradeBarTone, gradeForMarks, gradeTone } from "@/lib/marksGrades";

const SafeLink = Link as any;
;

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type SubjectMarkCell = {
 marks: number | "";
 gradeLabel?: string;
 maxMarks?: number | null;
};

type MarksRow = {
 studentId: string;
 roll: string;
 name: string;
 grade: string;
 section: string;
 subjectMarks: Record<string, SubjectMarkCell>;
};

type DisplayMarkRow = {
 key: string;
 studentId: string;
 roll: string;
 name: string;
 grade: string;
 section: string;
 subject: string;
 marks: number | "";
 gradeLabel?: string;
 maxMarks?: number | null;
};

type StoredMarks = {
 exam: string;
 grade: string;
 section: string;
 subject: string;
 maxMarks?: number | null;
 rows: Array<{
  studentId: string;
  roll?: string;
  marks: number | null;
  gradeLabel?: string;
  maxMarks?: number | null;
  absent?: boolean;
 }>;
 updatedAt?: string;
 academicYear?: string;
}

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", 
 "bg-amber-100 text-amber-700", "bg-green-100 text-green-700", 
 "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", 
 "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", 
 "bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", 
 "bg-purple-100 text-purple-700", "bg-fuchsia-100 text-fuchsia-700", 
 "bg-pink-100 text-pink-700", "bg-rose-100 text-rose-700",
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

function SubjectMultiSelect({
 options,
 selected,
 onChange,
 disabled,
}: {
 options: string[];
 selected: string[];
 onChange: (next: string[]) => void;
 disabled?: boolean;
}) {
 const [open, setOpen] = useState(false);
 const rootRef = useRef<HTMLDivElement | null>(null);
 const allSelected = options.length > 0 && selected.length === options.length;
 const label =
  selected.length === 0
   ? "Select subjects"
   : allSelected
    ? "All subjects"
    : `${selected.length} subject${selected.length === 1 ? "" : "s"} selected`;

 useEffect(() => {
  if (!open) return;
  const onPointerDown = (event: MouseEvent) => {
   if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
  };
  document.addEventListener("mousedown", onPointerDown);
  return () => document.removeEventListener("mousedown", onPointerDown);
 }, [open]);

 const toggleSubject = (subject: string) => {
  if (selected.includes(subject)) {
   onChange(selected.filter((s) => s !== subject));
   return;
  }
  onChange([...selected, subject].sort((a, b) => a.localeCompare(b)));
 };

 return (
  <div ref={rootRef} className="relative">
   <button
    type="button"
    disabled={disabled || options.length === 0}
    onClick={() => setOpen((v) => !v)}
    className={cn(
     "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-left text-xs font-semibold text-gray-800 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
     open && "border-[#144835]/30 bg-white ring-2 ring-[#144835]/20"
    )}
   >
    <span className={cn("truncate", selected.length === 0 && "text-gray-500")}>{label}</span>
    <ChevronDown size={14} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180 text-[#144835]")} />
   </button>
   {open && options.length > 0 ? (
    <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
     <label className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
      <input
       type="checkbox"
       className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
       checked={allSelected}
       onChange={() => onChange(allSelected ? [] : [...options])}
      />
      Select All
     </label>
     {options.map((subject) => (
      <label
       key={subject}
       className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
       <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
        checked={selected.includes(subject)}
        onChange={() => toggleSubject(subject)}
       />
       <span className="truncate">{subject}</span>
      </label>
     ))}
    </div>
   ) : null}
  </div>
 );
}

export default function MarksFeedingTab() {
 const schoolId = useSchoolId();
 const academicYearCtx = useAcademicYearOptional();
 const academicYear = academicYearCtx?.currentYear?.name ?? null;
 const teacherPortal = useTeacherPortalScope();
 const { grades: branchGrades, sections: branchSections, sectionsForGrade } = useBranchClassOptions(schoolId);
 const allClassesKey = "All";
 const allSectionsKey = "All";

 const marksDocId = (examName: string, grade: string, section: string, subjectName: string) =>
  buildMarksDocId(examName, grade, section, subjectName, academicYear);

 const classLabel = (g: string) => {
  if (g === allClassesKey) return "All Classes";
  return /^\d+$/.test(g) ? `Grade ${g}` : g;
 };

 const sectionLabel = (s: string) => {
  if (s === allSectionsKey) return "All Sections";
  return s;
 };
 const [exam, setExam] = useState("");
 const [examOptions, setExamOptions] = useState<string[]>([]);
 const [cls, setCls] = useState(allClassesKey);
 const [sec, setSec] = useState(allSectionsKey);
 const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
 const [subjectsForClass, setSubjectsForClass] = useState<string[]>([]);
 const [marksClassSections, setMarksClassSections] = useState<Record<string, string[]>>({});
 const [rows, setRows] = useState<MarksRow[]>([]);
 const [defaultMaxMarks, setDefaultMaxMarks] = useState(100);
 const [isLoading, setIsLoading] = useState(false);
 const [buildQuery, setQuery] = useState("");
 const [isSaving, setIsSaving] = useState(false);
 const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const fileRef = useRef<HTMLInputElement | null>(null);

 const classOptions = useMemo(() => {
  const scopedGrades = teacherPortal?.allowedClassKeys.size
   ? filterGradesByScope(branchGrades, teacherPortal.allowedClassKeys)
   : branchGrades;
  return [allClassesKey, ...scopedGrades];
 }, [branchGrades, allClassesKey, teacherPortal?.allowedClassKeys]);

 const sectionOptions = useMemo(() => {
  let sections: string[];
  if (cls === allClassesKey) {
   const scopedSections = teacherPortal?.allowedClassKeys.size
    ? filterSectionsByScope(branchSections, allClassesKey, teacherPortal.allowedClassKeys, allClassesKey)
    : branchSections;
   const fromMarks = Object.values(marksClassSections).flat();
   sections = Array.from(new Set([...scopedSections, ...fromMarks])).sort((a, b) => a.localeCompare(b));
  } else {
   const fromBranch = sectionsForGrade(cls);
   const fromMarks = marksClassSections[cls] ?? [];
   sections = Array.from(new Set([...fromBranch, ...fromMarks])).sort((a, b) => a.localeCompare(b));
   if (teacherPortal?.allowedClassKeys.size) {
    sections = filterSectionsByScope(sections, cls, teacherPortal.allowedClassKeys, allClassesKey);
   }
  }
  return [allSectionsKey, ...sections];
 }, [
  branchSections,
  allSectionsKey,
  allClassesKey,
  cls,
  sectionsForGrade,
  marksClassSections,
  teacherPortal?.allowedClassKeys,
 ]);

 // Load Exam Types (reload when academic year changes)
 useEffect(() => {
  if (schoolId && academicYear) setActiveAcademicYear(schoolId, academicYear);
  const unsub = subscribeData(buildPath(db, "schools", schoolId, "exam_types"), (snap: any) => {
   const names: string[] = snap.docs
    .map((d: any) => String(d.data().name || "").trim())
    .filter(Boolean);
   const unique = Array.from(new Set(names)).sort((a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true })
   );
   setExamOptions(unique);
  });
  return () => unsub();
 }, [schoolId, academicYear]);

 const loadStudents = useCallback(async (nextCls: string, nextSec: string, subjects: string[]) => {
 try {
 if (!exam || subjects.length === 0) {
  setRows([]);
  return;
 }
 setIsLoading(true);
 setBanner(null);
 const snap = await fetchMany(buildPath(db, "schools", schoolId, "students"));
 const allStudents = snap.docs
 .map((d: any) => ({ id: d.id, ...d.data() }))
 .map((s: any) => {
 const grade = String(s.classId || "").trim();
 const section = String(s.section || "").trim().toUpperCase();
 return { ...s, grade, section };
 })
 .filter((s: any) => s.grade && s.section);

 const selectedStudents = allStudents.filter((s: any) => {
 const matchClass = nextCls === allClassesKey || s.grade === nextCls;
 const matchSection = nextSec === allSectionsKey || s.section === nextSec;
 const inScope = teacherPortal?.allowedClassKeys.size
  ? matchesClassScope(s.grade, s.section, teacherPortal.allowedClassKeys)
  : true;
 return matchClass && matchSection && inScope;
 });

 const baseRows: MarksRow[] = selectedStudents.map((s: any, idx) => ({
 studentId: String(s.id || ""),
 roll: String(s.rollNumber || idx + 1),
 name: `${String(s.firstName || "").trim()} ${String(s.lastName || "").trim()}`.trim() || "Unnamed",
 grade: String(s.grade || ""),
 section: String(s.section || "").toUpperCase(),
 subjectMarks: {},
 }));

 if (!baseRows.length) {
 setRows([]);
 setIsLoading(false);
 return;
 }

 const groups = Array.from(new Set(baseRows.map((r) => `${r.grade}:::${r.section}`)));
 const marksByStudentSubject = new Map<string, SubjectMarkCell>();
 let resolvedMax = 100;

 const marksLoads = await Promise.all(
  groups
   .map((c) => {
    const [g, s] = String(c || "").split(":::");
    const grade = String(g || "").trim();
    const sec = String(s || "").trim().toUpperCase();
    if (!grade || !sec) return null;
    return { grade, sec };
   })
   .filter(Boolean)
   .map(({ grade, sec }: any) =>
    fetchMarksDocs(schoolId, academicYear, { grade, section: sec, exam })
   )
 );

 for (const marksDocs of marksLoads) {
  for (const saved of marksDocs) {
   const subjectName = String(saved.subject || "").trim();
   if (!subjectName || !subjects.includes(subjectName)) continue;
   if (typeof saved.maxMarks === "number" && saved.maxMarks > 0) {
    resolvedMax = saved.maxMarks;
   }
   (saved?.rows || []).forEach((r: any) => {
    const rowMax =
     typeof r?.maxMarks === "number" && r.maxMarks > 0 ? r.maxMarks : saved.maxMarks ?? resolvedMax;
    if (typeof r?.maxMarks === "number" && r.maxMarks > 0) {
     resolvedMax = r.maxMarks;
    }
    if (typeof r?.marks === "number" && Number.isFinite(r.marks)) {
     marksByStudentSubject.set(`${String(r.studentId)}:::${subjectName}`, {
      marks: r.marks,
      gradeLabel: String(r.gradeLabel ?? "").trim() || undefined,
      maxMarks: rowMax,
     });
    }
   });
  }
 }

 setDefaultMaxMarks(resolvedMax);
 const finalRows: MarksRow[] = baseRows.map((r) => {
  const subjectMarks: Record<string, SubjectMarkCell> = {};
  subjects.forEach((subjectName) => {
   const saved = marksByStudentSubject.get(`${r.studentId}:::${subjectName}`);
   subjectMarks[subjectName] = saved ?? { marks: "", maxMarks: resolvedMax };
  });
  return { ...r, subjectMarks };
 });

 setRows(finalRows);
  } catch (e: any) {
   console.error("Failed to load students/marks:", e);
   setBanner({ type: "error", text: "Failed to load student marks." });
   setRows([]);
  } finally {
   setIsLoading(false);
  }
 }, [exam, schoolId, allClassesKey, allSectionsKey, academicYear, teacherPortal?.allowedClassKeys]);

 const loadSubjects = useCallback(async (nextCls: string, nextSec: string) => {
  try {
   const [snap, marksIndex] = await Promise.all([
     fetchMany(buildPath(db, "schools", schoolId, "subjects")),
     fetchMarksIndex(schoolId, academicYear),
   ]);
   const raw = snap.docs.map((d: any) => d.data());

   const list = raw.filter((s: any) => {
    const matchClass = nextCls === allClassesKey || String(s.classId || "").trim() === nextCls;
    const matchSection = nextSec === allSectionsKey || String(s.section || "").trim().toUpperCase() === nextSec;
    return matchClass && matchSection;
   });

   const fromCatalog = list.map((s: any) => String(s.name || "").trim()).filter(Boolean);
   // Prefer timetable-backed catalog subjects; keep marks-only names as extras for feeding.
   const fromMarks = marksIndex
     .filter((m) => {
       if (exam && String(m.exam ?? "") !== exam) return false;
       const matchClass = nextCls === allClassesKey || String(m.grade || "").trim() === nextCls;
       const matchSection =
         nextSec === allSectionsKey || String(m.section || "").trim().toUpperCase() === nextSec;
       return matchClass && matchSection && String(m.subject || "").trim();
     })
     .map((m) => String(m.subject || "").trim());

   const sectionsFromMarks: Record<string, string[]> = {};
   marksIndex.forEach((m) => {
    if (exam && String(m.exam ?? "") !== exam) return;
    const grade = String(m.grade || "").trim();
    const section = String(m.section || "").trim().toUpperCase();
    if (!grade || !section) return;
    if (!sectionsFromMarks[grade]) sectionsFromMarks[grade] = [];
    if (!sectionsFromMarks[grade].includes(section)) sectionsFromMarks[grade].push(section);
   });
   Object.keys(sectionsFromMarks).forEach((grade) => {
    sectionsFromMarks[grade].sort((a, b) => a.localeCompare(b));
   });
   setMarksClassSections(sectionsFromMarks);

   // Catalog (timetable-derived for the active year) first, then any marks-only extras.
   const names = Array.from(
     new Set(fromCatalog.length ? [...fromCatalog, ...fromMarks] : fromMarks)
   ).sort((a: any, b: any) => a.localeCompare(b));
   setSubjectsForClass(names);
  } catch {
   setSubjectsForClass([]);
   setMarksClassSections({});
  }
 }, [allClassesKey, allSectionsKey, schoolId, exam, academicYear]);

 useEffect(() => {
  if (!classOptions.length) return;
  if (!classOptions.includes(cls)) setCls(allClassesKey);
 }, [classOptions, cls, allClassesKey]);

 useEffect(() => {
  if (!sectionOptions.includes(sec)) setSec(allSectionsKey);
 }, [sectionOptions, sec, allSectionsKey]);

 useEffect(() => {
  setSelectedSubjects((prev) => prev.filter((s) => subjectsForClass.includes(s)));
 }, [subjectsForClass]);

 useEffect(() => {
  loadSubjects(cls, sec);
 }, [cls, sec, exam, loadSubjects]);

 useEffect(() => {
  if (!exam || selectedSubjects.length === 0) {
   setRows([]);
   return;
  }
  loadStudents(cls, sec, selectedSubjects);
 }, [cls, sec, exam, selectedSubjects, loadStudents]);

 const updateSubjectMark = (
  studentId: string,
  subjectName: string,
  nextMarks: number | ""
 ) => {
  setRows((prev) =>
   prev.map((row) => {
    if (row.studentId !== studentId) return row;
    const current = row.subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
    const rowMax = current.maxMarks && current.maxMarks > 0 ? current.maxMarks : defaultMaxMarks;
    return {
     ...row,
     subjectMarks: {
      ...row.subjectMarks,
      [subjectName]: {
       ...current,
       marks: nextMarks,
       gradeLabel: undefined,
       maxMarks: rowMax,
      },
     },
    };
   })
  );
 };

 const stats = useMemo(() => {
 const cells: Array<{ marks: number; maxMarks: number }> = [];
 rows.forEach((row) => {
  selectedSubjects.forEach((subjectName) => {
   const cell = row.subjectMarks[subjectName];
   if (!cell || typeof cell.marks !== "number") return;
   const rowMax = cell.maxMarks && cell.maxMarks > 0 ? cell.maxMarks : defaultMaxMarks;
   cells.push({ marks: cell.marks, maxMarks: rowMax });
  });
 });
 const values = cells.map((c) => c.marks);
 const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
 const highest = values.length ? Math.max(...values) : 0;
 const lowest = values.length ? Math.min(...values) : 0;
 const passCount = cells.filter((c) => (c.marks / c.maxMarks) * 100 >= 33).length;
 const passPercentage = values.length ? (passCount / values.length) * 100 : 0;

 return { average, highest, lowest, passPercentage, totalStudents: rows.length, gradedStudents: values.length };
 }, [rows, selectedSubjects, defaultMaxMarks]);

 const filtered = useMemo(() => {
 const q = buildQuery.trim().toLowerCase();
 if (!q) return rows;
 return rows.filter((r) => `${r.name} ${r.roll} ${r.grade}-${r.section}`.toLowerCase().includes(q));
 }, [buildQuery, rows]);

 const displayRows = useMemo(() => {
  const out: DisplayMarkRow[] = [];
  filtered.forEach((row) => {
   selectedSubjects.forEach((subjectName) => {
    const cell = row.subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
    out.push({
     key: `${row.studentId}:::${subjectName}`,
     studentId: row.studentId,
     roll: row.roll,
     name: row.name,
     grade: row.grade,
     section: row.section,
     subject: subjectName,
     marks: cell.marks,
     gradeLabel: cell.gradeLabel,
     maxMarks: cell.maxMarks ?? defaultMaxMarks,
    });
   });
  });
  return out;
 }, [filtered, selectedSubjects, defaultMaxMarks]);

 const distribution = useMemo(() => {
 const buckets: Record<string, number> = Object.fromEntries([
  ...CBSE_GRADES.map((g) => [g, 0]),
  ["-", 0],
 ]);
 displayRows.forEach((r) => {
  const rowMax = r.maxMarks && r.maxMarks > 0 ? r.maxMarks : defaultMaxMarks;
  const g =
   r.gradeLabel && CBSE_GRADES.includes(r.gradeLabel as (typeof CBSE_GRADES)[number])
    ? r.gradeLabel
    : gradeForMarks(r.marks, rowMax);
  buckets[g] = (buckets[g] ?? 0) + 1;
 });
 return buckets;
 }, [displayRows, defaultMaxMarks]);

 async function persistMarks(nextRows: MarksRow[], subjectsToSave: string[]) {
  for (const subjectName of subjectsToSave) {
   if (cls === allClassesKey || sec === allSectionsKey) {
    const byClass = new Map<string, MarksRow[]>();
    nextRows.forEach((r) => {
     const grade = String(r.grade || "").trim();
     const section = String(r.section || "").trim().toUpperCase();
     if (!grade || !section) return;
     const key = `${grade}:::${section}`;
     if (!byClass.has(key)) byClass.set(key, []);
     byClass.get(key)!.push(r);
    });

    await Promise.all(
     Array.from(byClass.entries()).map(async ([key, list]) => {
      const [grade, targetSec] = key.split(":::");
      const subjectCells = list
       .map((r) => {
        const cell = r.subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
        const rowMax = cell.maxMarks && cell.maxMarks > 0 ? cell.maxMarks : defaultMaxMarks;
        const marks = typeof cell.marks === "number" ? cell.marks : null;
        return {
         studentId: r.studentId,
         roll: r.roll,
         marks,
         maxMarks: rowMax,
         gradeLabel: marks == null ? "" : gradeForMarks(marks, rowMax),
        };
       })
       .filter((row) => row.marks != null);
      if (!subjectCells.length) return;

      const rowMax = subjectCells[0]?.maxMarks ?? defaultMaxMarks;
      const payload: StoredMarks = {
       exam,
       grade,
       section: targetSec,
       subject: subjectName,
       maxMarks: rowMax,
       academicYear: academicYear ?? undefined,
       rows: list.map((r) => {
        const cell = r.subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
        const maxForRow = cell.maxMarks && cell.maxMarks > 0 ? cell.maxMarks : defaultMaxMarks;
        const marks = typeof cell.marks === "number" ? cell.marks : null;
        return {
         studentId: r.studentId,
         roll: r.roll,
         marks,
         maxMarks: maxForRow,
         gradeLabel: marks == null ? "" : gradeForMarks(marks, maxForRow),
        };
       }),
       updatedAt: new Date().toISOString(),
      };
      const ref = buildPath(db, "schools", schoolId, "marks", marksDocId(exam, grade, targetSec, subjectName));
      await upsertData(ref, payload, { merge: true });
     })
    );
    continue;
   }

   const rowMax =
    nextRows
     .map((r) => r.subjectMarks[subjectName]?.maxMarks)
     .find((max) => typeof max === "number" && max > 0) ?? defaultMaxMarks;
   const payload: StoredMarks = {
    exam,
    grade: cls,
    section: sec,
    subject: subjectName,
    maxMarks: rowMax,
    academicYear: academicYear ?? undefined,
    rows: nextRows.map((r) => {
     const cell = r.subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
     const maxForRow = cell.maxMarks && cell.maxMarks > 0 ? cell.maxMarks : defaultMaxMarks;
     const marks = typeof cell.marks === "number" ? cell.marks : null;
     return {
      studentId: r.studentId,
      roll: r.roll,
      marks,
      maxMarks: maxForRow,
      gradeLabel: marks == null ? "" : gradeForMarks(marks, maxForRow),
     };
    }),
    updatedAt: new Date().toISOString(),
   };
   const ref = buildPath(db, "schools", schoolId, "marks", marksDocId(exam, cls, sec, subjectName));
   await upsertData(ref, payload, { merge: true });
  }
 }

 const handleSave = async () => {
 try {
 setBanner(null);
 setIsSaving(true);
 await persistMarks(rows, selectedSubjects);
 setBanner({ type: "success", text: "Marks saved successfully." });
 } catch (e: any) {
 setBanner({ type: "error", text: e?.message || "Failed to save marks." });
 } finally {
 setIsSaving(false);
 }
 };

 function exportExcel() {
 const sheetRows = displayRows.map((r) => ({
  "Student ID": r.studentId,
  Roll: r.roll,
  Name: r.name,
  Subject: r.subject,
  Marks: r.marks === "" ? "" : r.marks,
  Grade: gradeForMarks(r.marks, r.maxMarks && r.maxMarks > 0 ? r.maxMarks : defaultMaxMarks),
  Class: r.grade,
  Section: r.section,
  Exam: exam,
 }));
 const ws = XLSX.utils.json_to_sheet(sheetRows, { skipHeader: false });
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "Marks");
 XLSX.writeFile(wb, `Marks_${cls}_${sec}.xlsx`);
 setBanner({ type: "success", text: "Exported Excel successfully." });
 }

 async function importExcel(file: File) {
 setBanner(null);
 const buf = await file.arrayBuffer();
 const wb = XLSX.read(buf, { type: "array" });
 const name = wb.SheetNames[0];
 const ws = wb.Sheets[name];
 const table = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as Array<Array<any>>;
 if (!table.length) throw new Error("Empty sheet");

 const header = (table[0] || []).map((h) => String(h || "").trim().toLowerCase());
 const idxId = header.findIndex((h) => ["student id", "studentid", "id"].includes(h));
 const idxRoll = header.findIndex((h) => ["roll", "roll no", "roll no.", "roll number"].includes(h));
 const idxName = header.findIndex((h) => ["name", "student", "student name"].includes(h));
 const idxMarks = header.findIndex((h) => ["marks", "score", "mark"].includes(h));
 const idxSubject = header.findIndex((h) => ["subject"].includes(h));

 if (idxMarks === -1 || (idxId === -1 && idxRoll === -1 && idxName === -1)) {
 throw new Error("Excel format not recognized. Required columns: Marks + (Student ID or Roll or Name).");
 }

 const byId = new Map(rows.map((r) => [String(r.studentId), r]));
 const byRoll = new Map(rows.map((r) => [String(r.roll), r]));
 const byName = new Map(rows.map((r) => [String(r.name).toLowerCase(), r]));

 const updates = new Map<string, { subject: string; marks: number | "" }>();
 for (let i = 1; i < table.length; i++) {
 const row = table[i] || [];
 const rawSubject = idxSubject !== -1 ? String(row[idxSubject] || "").trim() : selectedSubjects[0] || "";
 if (!rawSubject || !selectedSubjects.some((s) => s.toLowerCase() === rawSubject.toLowerCase())) continue;

 const id = idxId !== -1 ? String(row[idxId] || "").trim() : "";
 const roll = idxRoll !== -1 ? String(row[idxRoll] || "").trim() : "";
 const nameVal = idxName !== -1 ? String(row[idxName] || "").trim().toLowerCase() : "";
 const marksRaw = idxMarks !== -1 ? row[idxMarks] : "";
 const marksNum = marksRaw === "" ? "" : Number(marksRaw);

 const target = id ? byId.get(id) : roll ? byRoll.get(roll) : nameVal ? byName.get(nameVal) : undefined;
 if (!target) continue;

 const matchedSubject =
  selectedSubjects.find((s) => s.toLowerCase() === rawSubject.toLowerCase()) || selectedSubjects[0];
 const cellMax = target.subjectMarks[matchedSubject]?.maxMarks ?? defaultMaxMarks;
 const marks =
  typeof marksNum === "number" && Number.isFinite(marksNum)
   ? Math.max(0, Math.min(cellMax, Math.round(marksNum)))
   : "";
 updates.set(`${target.studentId}:::${matchedSubject}`, { subject: matchedSubject, marks });
 }

 const nextRows = rows.map((r) => {
  let changed = false;
  const subjectMarks = { ...r.subjectMarks };
  selectedSubjects.forEach((subjectName) => {
   const key = `${r.studentId}:::${subjectName}`;
   if (!updates.has(key)) return;
   changed = true;
   const current = subjectMarks[subjectName] ?? { marks: "", maxMarks: defaultMaxMarks };
   subjectMarks[subjectName] = { ...current, marks: updates.get(key)!.marks, gradeLabel: undefined };
  });
  return changed ? { ...r, subjectMarks } : r;
 });
 setRows(nextRows);
 await persistMarks(nextRows, selectedSubjects);
 setBanner({ type: "success", text: `Imported ${updates.size} marks from Excel and saved.` });
 }

 return (
  <div className="space-y-6 animate-in fade-in duration-500">
 {/* Top Filter Bar */}
 <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 flex flex-col xl:flex-row gap-5 xl:gap-6 justify-between items-start xl:items-center">
 <div className="flex flex-wrap items-end gap-4 w-full xl:w-auto">
 <div className="flex-1 min-w-[200px] space-y-1.5">
 <label className="erp-label block">Examination</label>
 <div className="relative">
 <select
 value={exam}
 onChange={(e) => setExam(e.target.value)}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 cursor-pointer"
 >
 <option value="">Select examination</option>
 {examOptions.length ? (
  examOptions.map((e: any) => <option key={e} value={e}>{e}</option>)
 ) : (
  <option value="" disabled>No exams defined</option>
 )}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
 </div>
 </div>
 </div>
 <div className="flex-1 min-w-[140px] space-y-1.5">
 <label className="erp-label block">Class</label>
 <div className="relative">
 <select
 value={cls}
 onChange={(e) => {
  setCls(e.target.value);
  setSec(allSectionsKey);
 }}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 cursor-pointer"
 >
 {classOptions.map((c) => (
 <option key={c} value={c}>{classLabel(c)}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
 </div>
 </div>
 </div>
 <div className="flex-1 min-w-[140px] space-y-1.5">
 <label className="erp-label block">Section</label>
 <div className="relative">
 <select
 value={sec}
 onChange={(e) => setSec(e.target.value)}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 cursor-pointer"
 >
 {sectionOptions.map((s) => (
 <option key={s} value={s}>{sectionLabel(s)}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
 </div>
 </div>
 </div>
 <div className="flex-1 min-w-[160px] space-y-1.5">
 <label className="erp-label block">Subject</label>
 <SubjectMultiSelect
  options={subjectsForClass}
  selected={selectedSubjects}
  onChange={setSelectedSubjects}
  disabled={!exam}
 />
 </div>
 <div className="pt-4 flex items-center gap-2">
 <button
 onClick={() => {
 setExam("");
 setCls(allClassesKey);
 setSec(allSectionsKey);
 setSelectedSubjects([]);
 setQuery("");
 }}
 className="h-9 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
 title="Reset Filters"
 >
 <RotateCcw size={14} /> Reset
 </button>
 <ExportButton data={displayRows.map(r => ({
   "Student ID": r.studentId,
   "Roll": r.roll,
   "Name": r.name,
   "Subject": r.subject,
   "Marks": r.marks === "" ? "" : r.marks,
   "Grade": gradeForMarks(r.marks, r.maxMarks && r.maxMarks > 0 ? r.maxMarks : defaultMaxMarks),
   "Class": r.grade,
   "Section": r.section,
   "Exam": exam
 }))} filename={`Marks_${cls}_${sec}`} className="h-9 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold" iconSize={14} />
 </div>
 </div>
 </div>

 {banner && (
 <div className={cn(
 "mx-1 rounded-lg border px-3 py-2 text-xs font-bold",
 banner.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
 )}>
 {banner.text}
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <div className="lg:col-span-3 space-y-4">
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
<div className="hidden lg:block overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-gray-50/80 border-b border-gray-100">
<th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 {(cls === allClassesKey || sec === allSectionsKey) ? (
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Class</th>
 ) : null}
 {selectedSubjects.length > 1 ? (
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Subject</th>
 ) : null}
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-32">Marks</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-24">Grade</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-20">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
  {isLoading ? (
  <SkeletonTableRows rows={8} columns={7} />
  ) : !exam ? (
  <tr>
  <td colSpan={8} className="px-4 py-12 text-center">
  <div className="flex flex-col items-center justify-center gap-2">
  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
  <Info size={20} />
  </div>
  <p className="text-xs font-bold text-gray-900 mt-2">Examination Required</p>
  <p className="text-xs text-gray-500">Please select an examination to view or enter marks.</p>
  </div>
  </td>
  </tr>
  ) : selectedSubjects.length === 0 ? (
  <tr>
  <td colSpan={8} className="px-4 py-12 text-center">
  <div className="flex flex-col items-center justify-center gap-2">
  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
  <Info size={20} />
  </div>
  <p className="text-xs font-bold text-gray-900 mt-2">Subject Selection Required</p>
  <p className="text-xs text-gray-500">Select one or more subjects using the checkbox list.</p>
  </div>
  </td>
  </tr>
  ) : displayRows.length > 0 ? (
  displayRows.map((r) => {
 const initials = r.name.split(" ").map(n => n[0]).join("").substring(0, 2);
 const rowMax = r.maxMarks && r.maxMarks > 0 ? r.maxMarks : defaultMaxMarks;
 const grade =
  r.gradeLabel && CBSE_GRADES.includes(r.gradeLabel as (typeof CBSE_GRADES)[number])
   ? r.gradeLabel
   : gradeForMarks(r.marks, rowMax);
 const isLow = grade === "E" || grade === "D";
 const avatarColor = getAvatarColor(r.name);

 return (
 <tr key={r.key} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{r.roll}</span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{r.name}</p>
 {isLow && <p className="text-xs font-bold text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle size={10}/> Needs Attention</p>}
 </div>
 </div>
 </td>
 {(cls === allClassesKey || sec === allSectionsKey) ? (
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
 {r.grade}-{r.section}
 </span>
 </td>
 ) : null}
 {selectedSubjects.length > 1 ? (
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-gray-700">{r.subject}</span>
 </td>
 ) : null}
 <td className="px-4 py-3">
 <div className="flex justify-center">
 <input
 type="number"
 min={0}
 max={rowMax}
 value={r.marks === "" ? "" : r.marks}
 onChange={(e) => {
 const val = e.target.value;
 let next: number | "" = val === "" ? "" : parseInt(val);
 if (typeof next === 'number') {
 next = isNaN(next) ? "" : Math.max(0, Math.min(rowMax, next));
 }
 updateSubjectMark(r.studentId, r.subject, next);
 }}
 onFocus={(e) => e.target.select()}
 className={cn(
 "w-16 h-8 rounded-lg border text-center font-extrabold text-xs transition-all focus:outline-none",
 isLow 
 ? "bg-red-50 border-red-200 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
 : "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 hover:border-gray-300"
 )}
 placeholder="--"
 />
 </div>
 </td>
 <td className="px-4 py-3 text-center">
 <span className={cn("inline-flex items-center justify-center min-w-[2.5rem] rounded-md text-xs font-extrabold border px-2 py-1 shadow-sm", gradeTone(grade))}>
 {grade}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <SafeLink
 href={`/schools/${schoolId}/admin/academic/students/${r.studentId}/profile?tab=Performance`}
 className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:bg-gray-100 hover:text-[#144835] transition-colors shadow-sm border border-transparent hover:border-gray-200"
 title="View History"
 >
 <BarChart3 size={14} />
 </SafeLink>
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={5} className="px-4 py-8 text-center">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
 <Search size={16} className="text-gray-400" />
 </div>
 <p className="text-xs font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search buildQuery.</p>
 <button 
 onClick={() => setQuery("")}
 className="mt-2 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear search
 </button>
 </td>
 </tr>
)}
</tbody>
</table>
</div>

{/* Mobile cards */}
<div className="lg:hidden divide-y divide-gray-100">
{isLoading ? (
<SkeletonList rows={6} />
) : !exam ? (
<div className="px-4 py-12 flex flex-col items-center justify-center gap-2 text-center">
<div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
<Info size={20} />
</div>
<p className="text-xs font-bold text-gray-900 mt-2">Examination Required</p>
<p className="text-xs text-gray-500">Please select an examination to view or enter marks.</p>
</div>
) : selectedSubjects.length === 0 ? (
<div className="px-4 py-12 flex flex-col items-center justify-center gap-2 text-center">
<div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
<Info size={20} />
</div>
<p className="text-xs font-bold text-gray-900 mt-2">Subject Selection Required</p>
<p className="text-xs text-gray-500">Select one or more subjects using the checkbox list.</p>
</div>
) : displayRows.length > 0 ? (
displayRows.map((r) => {
const initials = r.name.split(" ").map(n => n[0]).join("").substring(0, 2);
const rowMax = r.maxMarks && r.maxMarks > 0 ? r.maxMarks : defaultMaxMarks;
const grade =
 r.gradeLabel && CBSE_GRADES.includes(r.gradeLabel as (typeof CBSE_GRADES)[number])
  ? r.gradeLabel
  : gradeForMarks(r.marks, rowMax);
const isLow = grade === "E" || grade === "D";
const avatarColor = getAvatarColor(r.name);
return (
<div key={r.key} className="p-4 flex items-center gap-3">
<div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor)}>
{initials}
</div>
<div className="min-w-0 flex-1">
<div className="flex items-center gap-2">
<p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
<span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">#{r.roll}</span>
</div>
{selectedSubjects.length > 1 ? (
<p className="text-xs font-semibold text-[#144835] mt-0.5">{r.subject}</p>
) : null}
{(cls === allClassesKey || sec === allSectionsKey) ? (
<p className="text-xs font-semibold text-gray-500 mt-0.5">{r.grade}-{r.section}</p>
) : null}
{isLow && <p className="text-xs font-bold text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle size={10}/> Needs Attention</p>}
</div>
<span className={cn("inline-flex items-center justify-center min-w-[2.25rem] rounded-md text-xs font-extrabold border px-2 py-1 shrink-0", gradeTone(grade))}>
{grade}
</span>
<input
type="number"
min={0}
max={rowMax}
value={r.marks === "" ? "" : r.marks}
onChange={(e) => {
const val = e.target.value;
let next: number | "" = val === "" ? "" : parseInt(val);
if (typeof next === 'number') {
next = isNaN(next) ? "" : Math.max(0, Math.min(rowMax, next));
}
updateSubjectMark(r.studentId, r.subject, next);
}}
onFocus={(e) => e.target.select()}
className={cn(
"w-14 h-9 rounded-lg border text-center font-extrabold text-xs transition-all focus:outline-none shrink-0",
isLow
? "bg-red-50 border-red-200 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
: "bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 hover:border-gray-300"
)}
placeholder="--"
/>
</div>
);
})
) : (
<div className="px-4 py-8 text-center">
<div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 mb-2">
<Search size={16} className="text-gray-400" />
</div>
<p className="text-xs font-bold text-gray-900">No students found</p>
<p className="text-xs text-gray-500 mt-1">Try adjusting your search.</p>
<button
onClick={() => setQuery("")}
className="mt-2 text-xs font-bold text-[#144835] hover:underline"
>
Clear search
</button>
</div>
)}
</div>
</div>
</div>

{/* Right Side: Analysis & Actions (Col span 1) */}
 <div className="lg:col-span-1 space-y-4">
 <div className="flex items-center justify-between px-1">
 <h2 className="text-lg font-bold text-gray-800 tracking-tight">Analysis</h2>
 <button className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-xs font-bold text-white shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition-colors">
 <Check size={12} /> Publish
 </button>
 </div>

 {/* Grade Distribution */}
 <div className="bg-white rounded-xl border border-gray-200 p-4">
 <h3 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
 <BarChart3 size={14} className="text-gray-400" />
 Grade Distribution
 </h3>
 <div className="space-y-3 mt-4">
 {CBSE_GRADES.map((g) => {
 const count = distribution[g] ?? 0;
 const totalGraded = stats.gradedStudents;
 const pct = totalGraded === 0 ? 0 : Math.round((count / totalGraded) * 100);
 const tone = gradeBarTone(g);

 return (
 <div key={g} className="group">
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 <span className={cn("inline-flex items-center justify-center w-8 rounded-md border text-xs font-extrabold py-0.5", gradeTone(g))}>{g}</span>
 <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{count} students</span>
 </div>
 <span className="text-xs font-bold text-gray-400">{pct}%</span>
 </div>
 <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
 <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", tone)} style={{ width: `${pct}%` }} />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Actions Card */}
 <div className="bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#144835]/5 to-transparent rounded-bl-full pointer-events-none" />
 <h3 className="text-xs font-bold text-gray-800 mb-4 flex items-center gap-2">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
 Quick Actions
 </h3>
 <div className="space-y-3">
 <button
 onClick={handleSave}
 disabled={isSaving}
 className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[#144835] text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
 >
 {isSaving ? (
 <RotateCw size={14} className="animate-spin" />
 ) : (
 <Save size={14} />
 )}
 {isSaving ? "Saving..." : "Save Marks to Database"}
 </button>
 <button
 onClick={() =>
  setRows((prev) =>
   prev.map((row) => ({
    ...row,
    subjectMarks: Object.fromEntries(
     Object.entries(row.subjectMarks).map(([subjectName, cell]) => [
      subjectName,
      { ...cell, marks: "", gradeLabel: undefined },
     ])
    ),
   }))
  )
 }
 className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-red-100 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
 >
 <XCircle size={14} />
 Clear All Marks
 </button>
 </div>
 <p className="text-xs text-center text-gray-400 mt-4 font-bold uppercase tracking-wide flex items-center justify-center gap-1.5">
 <RotateCw size={10} /> Last saved: Just now
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
