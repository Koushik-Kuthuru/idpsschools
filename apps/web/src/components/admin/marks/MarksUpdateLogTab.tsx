"use client";

import React, { useState, useEffect, useMemo } from "react";


import { useSchoolId } from "@/hooks/useSchoolId";
import { Search, Save, User, XCircle, RotateCw, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, fetchOne, fetchMany, upsertData, subscribeData, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

type Student = {
  id: string;
  name: string;
  roll: string;
  grade: string;
  section: string;
};

type SubjectMarks = {
  subject: string;
  marks: number | "";
  originalMarks: number | "";
};

export default function MarksUpdateLogTab() {
  const schoolId = useSchoolId();
  const [exam, setExam] = useState("");
  const [examOptions, setExamOptions] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [subjects, setSubjects] = useState<SubjectMarks[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Exam Types
  useEffect(() => {
    const unsub = subscribeData(buildPath(db, "schools", schoolId, "exam_types"), (snap: any) => {
      const names = snap.docs.map((d: any) => String(d.data().name || "").trim()).filter(Boolean);
      setExamOptions(names);
      if (names.length && !exam) setExam(names[0]);
    });
    return () => unsub();
  }, [schoolId, exam]);

  // Load all students for searching
  useEffect(() => {
    async function loadAllStudents() {
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "students"));
        const all = snap.docs.map((d, idx) => {
          const s = d.data();
          return {
            id: d.id,
            name: `${String(s.firstName || "").trim()} ${String(s.lastName || "").trim()}`.trim() || "Unnamed",
            roll: String(s.rollNumber || idx + 1),
            grade: String(s.classId || s.grade || "").trim(),
            section: String(s.section || "").trim().toUpperCase(),
          };
        }).filter(s => s.grade && s.section);
        setStudents(all);
      } catch (err) {
        console.error("Failed to load students", err);
      }
    }
    loadAllStudents();
  }, [schoolId]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.roll.toLowerCase().includes(q) || 
      `${s.grade}-${s.section}`.toLowerCase().includes(q)
    ).slice(0, 5); // show max 5 results
  }, [searchQuery, students]);

  // Load marks for the selected student
  useEffect(() => {
    if (!selectedStudent || !exam) {
      setSubjects([]);
      return;
    }
    
    async function fetchMarks() {
      setIsLoading(true);
      setBanner(null);
      try {
        // 1. Fetch subjects for this student's class
        const subSnap = await fetchMany(buildPath(db, "schools", schoolId, "subjects"));
        const classSubjects = subSnap.docs
          .map((d: any) => d.data())
          .filter(s => 
            String(s.classId || "").trim() === selectedStudent!.grade && 
            String(s.section || "").trim().toUpperCase() === selectedStudent!.section
          )
          .map(s => String(s.name || "").trim())
          .filter(Boolean);

        const uniqueSubjects = Array.from(new Set(classSubjects)).sort((a: any, b: any) => a.localeCompare(b));

        // 2. Fetch marks for each subject
        const subMarks: SubjectMarks[] = [];
        for (const sub of uniqueSubjects) {
          const docId = marksDocId(exam, selectedStudent!.grade, selectedStudent!.section, sub);
          const snap = await fetchOne(buildPath(db, "schools", schoolId, "marks", docId));
          let val: number | "" = "";
          
          if (snap.exists()) {
            const data = snap.data();
            const row = (data.rows || []).find((r: any) => r.studentId === selectedStudent!.id);
            if (row && typeof row.marks === "number") {
              val = row.marks;
            }
          }
          
          subMarks.push({ subject: sub, marks: val, originalMarks: val });
        }
        
        setSubjects(subMarks);
      } catch (err: any) {
        setBanner({ type: "error", text: "Failed to load marks: " + err.message });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMarks();
  }, [selectedStudent, exam, schoolId]);

  const handleSave = async () => {
    if (!selectedStudent || !exam) return;
    setIsSaving(true);
    setBanner(null);

    try {
      // Find subjects that have changed
      const changed = subjects.filter(s => s.marks !== s.originalMarks);
      if (changed.length === 0) {
        setBanner({ type: "success", text: "No changes to save." });
        setIsSaving(false);
        return;
      }

      for (const s of changed) {
        const docId = marksDocId(exam, selectedStudent.grade, selectedStudent.section, s.subject);
        const ref = buildPath(db, "schools", schoolId, "marks", docId);
        
        const snap = await fetchOne(ref);
        
        if (snap.exists()) {
          const data = snap.data();
          let rows = [...(data.rows || [])];
          const idx = rows.findIndex(r => r.studentId === selectedStudent.id);
          
          if (idx >= 0) {
            rows[idx].marks = typeof s.marks === "number" ? s.marks : null;
          } else {
            rows.push({
              studentId: selectedStudent.id,
              roll: selectedStudent.roll,
              marks: typeof s.marks === "number" ? s.marks : null
            });
          }
          
          await upsertData(ref, { rows, updatedAt: new Date().toISOString() }, { merge: true });
        } else {
          // Document doesn't exist, create it
          await upsertData(ref, {
            exam,
            grade: selectedStudent.grade,
            section: selectedStudent.section,
            subject: s.subject,
            updatedAt: new Date().toISOString(),
            rows: [{
              studentId: selectedStudent.id,
              roll: selectedStudent.roll,
              marks: typeof s.marks === "number" ? s.marks : null
            }]
          });
        }
      }
      
      // Update originalMarks
      setSubjects(prev => prev.map(s => ({ ...s, originalMarks: s.marks })));
      setBanner({ type: "success", text: "Marks updated successfully!" });
    } catch (err: any) {
      setBanner({ type: "error", text: "Failed to save: " + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Update Student Marks</h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-1/3 space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Examination</label>
            <div className="relative">
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full h-10 appearance-none rounded-lg border border-gray-200 bg-gray-50/50 pl-3 pr-8 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all cursor-pointer"
              >
                {examOptions.map((e: any) => <option key={e} value={e}>{e}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search Student</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedStudent) setSelectedStudent(null);
                }}
                className="w-full h-10 pl-9 pr-8 rounded-lg border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedStudent(null); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            {searchQuery && !selectedStudent && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                {filteredStudents.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {filteredStudents.map(s => (
                      <li key={s.id}>
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setSearchQuery(`${s.name} (${s.roll}) - ${s.grade}-${s.section}`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex flex-col"
                        >
                          <span className="text-sm font-bold text-gray-800">{s.name} <span className="text-gray-400 text-xs font-normal">#{s.roll}</span></span>
                          <span className="text-xs text-gray-500 font-semibold">{s.grade} - {s.section}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 font-semibold">No students found.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {banner && (
        <div className={cn(
          "rounded-lg border px-4 py-3 text-sm font-bold shadow-sm",
          banner.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
        )}>
          {banner.text}
        </div>
      )}

      {selectedStudent && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#144835]/10 flex items-center justify-center text-[#144835]">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">{selectedStudent.name}</h3>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  Roll: {selectedStudent.roll} | Class: {selectedStudent.grade}-{selectedStudent.section}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading || !subjects.length}
              className="h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#144835] text-sm font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} />}
              Save Updates
            </button>
          </div>

          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Subject</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Marks</th>
                  <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#144835] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold text-gray-500">Loading student marks...</span>
                      </div>
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-xs font-bold text-gray-400">
                      No subjects found for this class.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub, idx) => {
                    const grade = gradeForMarks(sub.marks);
                    const isLow = typeof sub.marks === 'number' && sub.marks < 50;
                    const isChanged = sub.marks !== sub.originalMarks;

                    return (
                      <tr key={idx} className={cn("hover:bg-gray-50/50 transition-colors", isChanged && "bg-amber-50/30")}>
                        <td className="px-5 py-3 font-bold text-gray-800 text-sm">
                          {sub.subject}
                          {isChanged && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={sub.marks === "" ? "" : sub.marks}
                            onChange={(e) => {
                              const val = e.target.value;
                              let next: number | "" = val === "" ? "" : parseInt(val);
                              if (typeof next === 'number') {
                                next = isNaN(next) ? "" : Math.max(0, Math.min(100, next));
                              }
                              setSubjects((prev) => prev.map((x, i) => (i === idx ? { ...x, marks: next } : x)));
                            }}
                            onFocus={(e) => e.target.select()}
                            className={cn(
                              "w-20 h-9 rounded-lg border text-center font-extrabold text-sm transition-all focus:outline-none",
                              isLow 
                              ? "bg-red-50 border-red-200 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                              : "bg-white border-gray-200 text-gray-900 focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 hover:border-gray-300",
                              isChanged && "border-amber-300 bg-amber-50/50"
                            )}
                            placeholder="--"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center justify-center min-w-[3rem] rounded-md text-xs font-extrabold border px-2 py-1 shadow-sm", gradeTone(grade))}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
