"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { 
 BarChart3, 
 Check, 
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
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

type MarksRow = {
 studentId: string;
 roll: string;
 name: string;
 grade: string;
 section: string;
 marks: number | "";
};

type StoredMarks = {
 exam: string;
 grade: string;
 section: string;
 subject: string;
 rows: Array<{ studentId: string; roll?: string; marks: number | null }>;
 updatedAt?: string;
};

function keyPart(v: string) {
 return encodeURIComponent(String(v || "").trim()).replace(/%/g, "_");
}

function marksDocId(exam: string, grade: string, section: string, subject: string) {
 return `${keyPart(exam)}__${keyPart(grade)}__${keyPart(section)}__${keyPart(subject)}`;
}

function gradeForMarks(marks: number | "") {
 if (marks === "") return "-";
 if (marks >= 90) return "A+";
 if (marks >= 80) return "A";
 if (marks >= 70) return "B";
 if (marks >= 60) return "C";
 if (marks >= 50) return "D";
 return "F";
}

function gradeTone(grade: string) {
 if (grade === "A+") return "bg-emerald-100 text-emerald-800 border-emerald-200";
 if (grade === "A") return "bg-green-100 text-green-800 border-green-200";
 if (grade === "B") return "bg-blue-100 text-blue-800 border-blue-200";
 if (grade === "C") return "bg-amber-100 text-amber-800 border-amber-200";
 if (grade === "D") return "bg-orange-100 text-orange-800 border-orange-200";
 if (grade === "F") return "bg-red-100 text-red-800 border-red-200";
 return "bg-slate-100 text-slate-700 border-slate-200";
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

export default function AdminMarksPage() {
 const schoolId = "idpscherukupalli";
 const allClassesKey = "All";
 const allSectionsKey = "All";
 const allSubjectsKey = "All";
 const [exam, setExam] = useState("");
 const [examOptions, setExamOptions] = useState<string[]>([]);
 const [cls, setCls] = useState(allClassesKey);
 const [sec, setSec] = useState(allSectionsKey);
 const [subject, setSubject] = useState(allSubjectsKey);
 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);
 const [subjectsForClass, setSubjectsForClass] = useState<string[]>([]);
 const [rows, setRows] = useState<MarksRow[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [query, setQuery] = useState("");
 const [isSaving, setIsSaving] = useState(false);
 const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const fileRef = useRef<HTMLInputElement | null>(null);

 // Load Exam Types
 useEffect(() => {
  const unsub = onSnapshot(collection(db, "schools", schoolId, "exam_types"), (snap) => {
   const names = snap.docs.map(d => String(d.data().name || "").trim()).filter(Boolean);
   setExamOptions(names);
   if (names.length && !exam) setExam(names[0]);
  });
  return () => unsub();
 }, [schoolId, exam]);

 const loadStudents = useCallback(async (nextCls: string, nextSec: string) => {
 try {
 setIsLoading(true);
 setBanner(null);
 const snap = await getDocs(collection(db, "schools", schoolId, "students"));
 const allStudents = snap.docs
 .map((d) => ({ id: d.id, ...d.data() }))
 .map((s: any) => {
 const grade = String(s.classId || "").trim();
 const section = String(s.section || "").trim().toUpperCase();
 return { ...s, grade, section };
 })
 .filter((s: any) => s.grade && s.section);

 const selectedStudents = allStudents.filter((s: any) => {
 const matchClass = nextCls === allClassesKey || s.grade === nextCls;
 const matchSection = nextSec === allSectionsKey || s.section === nextSec;
 return matchClass && matchSection;
 });

 const baseRows: MarksRow[] = selectedStudents.map((s: any, idx) => ({
 studentId: String(s.id || ""),
 roll: String(s.rollNumber || idx + 1),
 name: `${String(s.firstName || "").trim()} ${String(s.lastName || "").trim()}`.trim() || "Unnamed",
 grade: String(s.grade || ""),
 section: String(s.section || "").toUpperCase(),
 marks: "",
 }));

 if (!baseRows.length) {
 setRows([]);
 setIsLoading(false);
 return;
 }

 const groups = Array.from(new Set(baseRows.map((r) => `${r.grade}:::${r.section}`)));
 const marksByStudentId = new Map<string, number>();

 await Promise.all(
 groups
 .map((c) => {
 const [g, s] = String(c || "").split(":::");
 const grade = String(g || "").trim();
 const sec = String(s || "").trim().toUpperCase();
 if (!grade || !sec) return null;
 return { grade, sec };
 })
 .filter(Boolean)
 .map(async ({ grade, sec }: any) => {
 const savedRef = doc(db, "schools", schoolId, "marks", marksDocId(exam, grade, sec, subject));
 const savedSnap = await getDoc(savedRef);
 if (savedSnap.exists()) {
 const saved = savedSnap.data() as StoredMarks;
 (saved?.rows || []).forEach((r) => {
 if (typeof r?.marks === "number" && Number.isFinite(r.marks)) {
 marksByStudentId.set(String(r.studentId), r.marks);
 }
 });
 }
 })
 );

 const finalRows: MarksRow[] = baseRows.map((r) => {
    const m = marksByStudentId.get(r.studentId);
    return { ...r, marks: typeof m === "number" ? m : "" };
   });

   setRows(finalRows);
  } catch (e: any) {
   console.error("Failed to load students/marks:", e);
   setBanner({ type: "error", text: "Failed to load student marks." });
   setRows([]);
  } finally {
   setIsLoading(false);
  }
 }, [exam, schoolId, subject, allClassesKey, allSectionsKey, allSubjectsKey]);

 const loadSubjects = useCallback(async (nextCls: string, nextSec: string) => {
  try {
   const snap = await getDocs(collection(db, "schools", schoolId, "subjects"));
   const raw = snap.docs.map((d) => d.data());

   const list = raw.filter((s: any) => {
    const matchClass = nextCls === allClassesKey || String(s.classId || "").trim() === nextCls;
    const matchSection = nextSec === allSectionsKey || String(s.section || "").trim().toUpperCase() === nextSec;
    return matchClass && matchSection;
   });

   const names = Array.from(new Set(list.map((s: any) => String(s.name || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
   setSubjectsForClass(names);
  } catch {
   setSubjectsForClass([]);
  }
 }, [allClassesKey, allSectionsKey, schoolId]);

 useEffect(() => {
  let cancelled = false;
  async function loadAll() {
   try {
    const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
    const raw = snap.docs.map((d) => d.data());
    
    const grades = raw.map(c => String(c.grade ?? c.name ?? "").trim()).filter(Boolean);
    const sections = raw.map(c => String(c.section ?? "").trim().toUpperCase()).filter(Boolean);

    const uniqueGrades = Array.from(new Set(grades)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const uniqueSections = Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b));

    if (!cancelled) {
     setClassOptions([allClassesKey, ...uniqueGrades]);
     setSectionOptions([allSectionsKey, ...uniqueSections]);
    }
   } catch (e: any) {
    if (!cancelled) {
     setClassOptions([]);
     setSectionOptions([]);
     setBanner({ type: "error", text: e?.message || "Failed to load classes" });
    }
   }
  }
  loadAll();
  return () => {
   cancelled = true;
  };
 }, [allClassesKey, allSectionsKey, schoolId]);

 useEffect(() => {
  if (!classOptions.length) return;
  if (!classOptions.includes(cls)) setCls(classOptions[0]);
 }, [classOptions, cls]);

 useEffect(() => {
  if (!sectionOptions.length) return;
  if (!sectionOptions.includes(sec)) setSec(sectionOptions[0]);
 }, [sectionOptions, sec]);

 const subjectOptions = useMemo(() => {
  return [allSubjectsKey, ...subjectsForClass];
 }, [subjectsForClass, allSubjectsKey]);

 useEffect(() => {
  if (subject !== allSubjectsKey && !subjectOptions.includes(subject)) {
   setSubject(allSubjectsKey);
  }
 }, [subjectOptions, subject, allSubjectsKey]);

 useEffect(() => {
  loadSubjects(cls, sec);
 }, [cls, sec, loadSubjects]);

 useEffect(() => {
  if (subject === allSubjectsKey) {
   // Fetch all students without subject-specific marks for now, or clear rows
   setRows([]); 
   return;
  }
  loadStudents(cls, sec);
 }, [cls, sec, exam, subject, loadStudents, allSubjectsKey]);

 const stats = useMemo(() => {
 const validMarks = rows.filter(r => typeof r.marks === 'number') as { roll: string; name: string; marks: number }[];
 const values = validMarks.map((r) => r.marks);
 const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
 const highest = values.length ? Math.max(...values) : 0;
 const lowest = values.length ? Math.min(...values) : 0;
 const passCount = values.filter(m => m >= 50).length;
 const passPercentage = values.length ? (passCount / values.length) * 100 : 0;
 
 return { average, highest, lowest, passPercentage, totalStudents: rows.length, gradedStudents: values.length };
 }, [rows]);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 if (!q) return rows;
 return rows.filter((r) => `${r.name} ${r.roll} ${r.grade}-${r.section}`.toLowerCase().includes(q));
 }, [query, rows]);

 const distribution = useMemo(() => {
 const buckets: Record<string, number> = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0, "-": 0 };
 rows.forEach((r) => {
 buckets[gradeForMarks(r.marks)] += 1;
 });
 return buckets;
 }, [rows]);

 async function persistMarks(nextRows: MarksRow[]) {
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
 const payload: StoredMarks = {
 exam,
 grade,
 section: targetSec,
 subject,
 rows: list.map((r) => ({
 studentId: r.studentId,
 roll: r.roll,
 marks: typeof r.marks === "number" ? r.marks : null,
 })),
 updatedAt: new Date().toISOString(),
 };
 const ref = doc(db, "schools", schoolId, "marks", marksDocId(exam, grade, targetSec, subject));
 await setDoc(ref, payload, { merge: true });
 })
 );
 return;
 }

 const payload: StoredMarks = {
 exam,
 grade: cls,
 section: sec,
 subject,
 rows: nextRows.map((r) => ({
 studentId: r.studentId,
 roll: r.roll,
 marks: typeof r.marks === "number" ? r.marks : null,
 })),
 updatedAt: new Date().toISOString(),
 };
 const ref = doc(db, "schools", schoolId, "marks", marksDocId(exam, cls, sec, subject));
 await setDoc(ref, payload, { merge: true });
 }

 const handleSave = async () => {
 try {
 setBanner(null);
 setIsSaving(true);
 await persistMarks(rows);
 setBanner({ type: "success", text: "Marks saved successfully." });
 } catch (e: any) {
 setBanner({ type: "error", text: e?.message || "Failed to save marks." });
 } finally {
 setIsSaving(false);
 }
 };

 function exportExcel() {
 const sheetRows = rows.map((r) => ({
 "Student ID": r.studentId,
 Roll: r.roll,
 Name: r.name,
 Subject: subject,
 Marks: r.marks === "" ? "" : r.marks,
 Grade: gradeForMarks(r.marks),
 Class: r.grade,
 Section: r.section,
 Exam: exam,
 }));
 const ws = XLSX.utils.json_to_sheet(sheetRows, { skipHeader: false });
 const wb = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb, ws, "Marks");
 XLSX.writeFile(wb, `Marks_${cls}_${subject.replace(/\s+/g, "_")}.xlsx`);
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

 const updates = new Map<string, number | "">();
 for (let i = 1; i < table.length; i++) {
 const row = table[i] || [];
 const rawSubject = idxSubject !== -1 ? String(row[idxSubject] || "").trim() : "";
 if (rawSubject && rawSubject.toLowerCase() !== subject.toLowerCase()) continue;

 const id = idxId !== -1 ? String(row[idxId] || "").trim() : "";
 const roll = idxRoll !== -1 ? String(row[idxRoll] || "").trim() : "";
 const nameVal = idxName !== -1 ? String(row[idxName] || "").trim().toLowerCase() : "";
 const marksRaw = idxMarks !== -1 ? row[idxMarks] : "";
 const marksNum = marksRaw === "" ? "" : Number(marksRaw);
 const marks = typeof marksNum === "number" && Number.isFinite(marksNum) ? Math.max(0, Math.min(100, Math.round(marksNum))) : "";

 const target = id ? byId.get(id) : roll ? byRoll.get(roll) : nameVal ? byName.get(nameVal) : undefined;
 if (!target) continue;
 updates.set(target.studentId, marks);
 }

 const nextRows = rows.map((r) => (updates.has(r.studentId) ? { ...r, marks: updates.get(r.studentId)! } : r));
 setRows(nextRows);
 await persistMarks(nextRows);
 setBanner({ type: "success", text: `Imported ${updates.size} marks from Excel and saved.` });
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
 <AdminPageHeader
  title="Marks & Grading"
  description="Manage student examination scores and view performance analytics"
 />
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
 {examOptions.length ? (
  examOptions.map((e) => <option key={e} value={e}>{e}</option>)
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
 onChange={(e) => setCls(e.target.value)}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 cursor-pointer"
 >
 {classOptions.map((c) => (
 <option key={c} value={c}>{c}</option>
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
 <option key={s} value={s}>{s}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
 </div>
 </div>
 </div>
 <div className="flex-1 min-w-[160px] space-y-1.5">
 <label className="erp-label block">Subject</label>
 <div className="relative">
 <select
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 className="w-full h-9 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 cursor-pointer"
 >
 {subjectOptions.length ? (
 subjectOptions.map((s) => (
 <option key={s} value={s}>
 {s}
 </option>
 ))
 ) : (
 <option value="" disabled>
 No subjects found
 </option>
 )}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
 </div>
 </div>
 </div>
 <div className="pt-4 flex items-center gap-2">
 <button
 onClick={() => {
 setCls(allClassesKey);
 setSec(allSectionsKey);
 setSubject(allSubjectsKey);
 setQuery("");
 setExam("Midterm Examination 2023");
 }}
 className="h-9 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold"
 title="Reset Filters"
 >
 <RotateCcw size={14} /> Reset
 </button>
 <ExportButton data={rows.map(r => ({
   "Student ID": r.studentId,
   "Roll": r.roll,
   "Name": r.name,
   "Subject": subject,
   "Marks": r.marks === "" ? "" : r.marks,
   "Grade": gradeForMarks(r.marks),
   "Class": r.grade,
   "Section": r.section,
   "Exam": exam
 }))} filename={`Marks_${cls}_${sec}_${subject.replace(/\s+/g, "_")}`} className="h-9 px-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold" iconSize={14} />
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
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 {(cls === allClassesKey || sec === allSectionsKey) ? (
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Class</th>
 ) : null}
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-32">Marks</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-24">Grade</th>
 <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-20">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
  {isLoading ? (
  <tr>
  <td colSpan={7} className="px-4 py-8 text-center">
  <div className="flex items-center justify-center gap-2">
  <div className="w-4 h-4 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
  <span className="text-xs font-bold text-gray-500">Loading marks...</span>
  </div>
  </td>
  </tr>
  ) : subject === allSubjectsKey ? (
  <tr>
  <td colSpan={7} className="px-4 py-12 text-center">
  <div className="flex flex-col items-center justify-center gap-2">
  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
  <Info size={20} />
  </div>
  <p className="text-xs font-bold text-gray-900 mt-2">Subject Selection Required</p>
  <p className="text-xs text-gray-500">Please select a specific subject from the dropdown to enter or view marks.</p>
  </div>
  </td>
  </tr>
  ) : filtered.length > 0 ? (
  filtered.map((r) => {
 const initials = r.name.split(" ").map(n => n[0]).join("").substring(0, 2);
 const grade = gradeForMarks(r.marks);
 const isLow = typeof r.marks === 'number' && r.marks < 50;
 const avatarColor = getAvatarColor(r.name);

 return (
 <tr key={r.studentId} className="hover:bg-gray-50/50 transition-colors group">
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
 <td className="px-4 py-3">
 <div className="flex justify-center">
 <input
 type="number"
 min={0}
 max={100}
 value={r.marks === "" ? "" : r.marks}
 onChange={(e) => {
 const val = e.target.value;
 let next: number | "" = val === "" ? "" : parseInt(val);
 if (typeof next === 'number') {
 next = isNaN(next) ? "" : Math.max(0, Math.min(100, next));
 }
 setRows((prev) => prev.map((x) => (x.studentId === r.studentId ? { ...x, marks: next } : x)));
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
 <Link
 href={`/schools/idpscherukupalli/admin/academic/students/${r.studentId}/profile?tab=Performance`}
 className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:bg-gray-100 hover:text-[#144835] transition-colors shadow-sm border border-transparent hover:border-gray-200"
 title="View History"
 >
 <BarChart3 size={14} />
 </Link>
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
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
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
 {(["A+", "A", "B", "C", "D", "F"] as const).map((g) => {
 const count = distribution[g];
 const totalGraded = stats.gradedStudents;
 const pct = totalGraded === 0 ? 0 : Math.round((count / totalGraded) * 100);
 const tone =
 g === "A+" ? "bg-emerald-500"
 : g === "A" ? "bg-green-500"
 : g === "B" ? "bg-blue-500"
 : g === "C" ? "bg-amber-500"
 : g === "D" ? "bg-orange-500"
 : "bg-red-500";

 return (
 <div key={g} className="group">
 <div className="flex items-center justify-between mb-1.5">
 <div className="flex items-center gap-2">
 <span className={cn("inline-flex items-center justify-center w-7 rounded-md border text-xs font-extrabold py-0.5", gradeTone(g))}>{g}</span>
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
 onClick={() => setRows(rows.map(r => ({ ...r, marks: "" })))}
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
