import React, { useState, useEffect, useMemo } from "react";
import { Plus, RotateCw, Save, Trash2, Calendar as CalendarIcon, Clock, BookOpen } from "lucide-react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSchoolId } from "@/hooks/useSchoolId";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ExamEntry = {
  id: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  syllabus: string;
};

export default function AddUpdateFinalTestTab() {
  const schoolId = useSchoolId();
  const [term, setTerm] = useState("Term 1");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [sectionsByClass, setSectionsByClass] = useState<Record<string, string[]>>({});
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Classes
  useEffect(() => {
    async function loadMeta() {
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
        const grades = new Set<string>();
        const byClass: Record<string, Set<string>> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const g = String(data.grade ?? data.name ?? "").trim();
          const s = String(data.section ?? "").trim().toUpperCase();
          if (!g) return;
          grades.add(g);
          if (!byClass[g]) byClass[g] = new Set();
          if (s) byClass[g].add(s);
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
        if (sortedGrades.length > 0) {
          setGrade(sortedGrades[0]);
          setSection(mapped[sortedGrades[0]]?.[0] ?? "");
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    }
    loadMeta();
  }, []);

  const sectionOptions = useMemo(
    () => (grade ? sectionsByClass[grade] ?? [] : []),
    [grade, sectionsByClass]
  );

  useEffect(() => {
    if (section && sectionOptions.length > 0 && !sectionOptions.includes(section)) {
      setSection(sectionOptions[0] ?? "");
    }
  }, [grade, section, sectionOptions]);

  // Load Subjects
  useEffect(() => {
    async function loadSubjects() {
      if (!grade || !section) {
        setSubjectOptions([]);
        return;
      }
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "subjects"));
        const names = snap.docs
          .map((d) => d.data())
          .filter(
            (s) =>
              String(s.classId ?? "").trim() === grade &&
              String(s.section ?? "").trim().toUpperCase() === section
          )
          .map((s) => String(s.name ?? "").trim())
          .filter(Boolean);
        setSubjectOptions(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
      } catch {
        setSubjectOptions([]);
      }
    }
    loadSubjects();
  }, [grade, section]);

  const examDocId = `${term.replace(/ /g, "_")}__${grade}__${section}`;

  // Load Exams
  useEffect(() => {
    async function fetchExams() {
      if (!grade || !section || !term) return;
      setIsLoading(true);
      setError(null);
      setSaveMessage(null);
      try {
        const ref = doc(db, "schools", schoolId, "exams", examDocId);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().schedule) {
          setExams(snap.data().schedule as ExamEntry[]);
        } else {
          setExams([]);
        }
      } catch (err: unknown) {
        setError("Failed to load exam timetable.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchExams();
  }, [examDocId, grade, section, term]);

  const addExam = () => {
    setExams([
      ...exams,
      {
        id: Math.random().toString(36).substr(2, 9),
        subject: "",
        date: "",
        startTime: "09:00",
        endTime: "12:00",
        syllabus: "",
      },
    ]);
  };

  const updateExam = (id: string, field: keyof ExamEntry, value: string) => {
    setExams(exams.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    setSaveMessage(null);
  };

  const removeExam = (id: string) => {
    setExams(exams.filter((e) => e.id !== id));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!grade || !section || !term) return;
    // Validate
    const invalid = exams.some((e) => !e.subject || !e.date || !e.startTime || !e.endTime);
    if (invalid) {
      setError("Please fill in all required fields (Subject, Date, Times).");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const ref = doc(db, "schools", schoolId, "exams", examDocId);
      await setDoc(
        ref,
        {
          term,
          grade,
          section,
          schedule: exams,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveMessage("Saved successfully");
    } catch (err: unknown) {
      setError("Failed to save exam timetable.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Header Filters */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Exam Term:</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="h-9 w-32 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835]"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Pre-Board">Pre-Board</option>
              <option value="Final Exam">Final Exam</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Grade:</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="h-9 w-28 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835]"
            >
              {classOptions.map((g) => (
                <option key={g} value={g}>
                  {/^\d+$/.test(g) ? `Grade ${g}` : g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Section:</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!grade}
              className="h-9 w-24 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835] disabled:opacity-50"
            >
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1" />

          {saveMessage && <span className="text-xs font-bold text-emerald-600">{saveMessage}</span>}
          {error && <span className="text-xs font-bold text-red-600">{error}</span>}
          
          <button
            onClick={handleSave}
            disabled={isSaving || exams.length === 0}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Timetable
          </button>
        </div>
        
        {/* Editor Area */}
        <div className="p-5 relative min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
              <RotateCw size={24} className="animate-spin text-[#144835]" />
            </div>
          )}

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Exams Scheduled</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                There are no exams scheduled for {grade}-{section} in {term}. Click below to add an exam.
              </p>
              <button
                onClick={addExam}
                className="mt-6 h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:text-[#144835] hover:border-[#144835]/30 transition-colors"
              >
                <Plus size={16} /> Add First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wide">
                <div className="col-span-3">Subject</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Start Time</div>
                <div className="col-span-2">End Time</div>
                <div className="col-span-2">Syllabus / Notes</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {exams.map((exam) => (
                <div key={exam.id} className="grid grid-cols-12 gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm items-start">
                  <div className="col-span-3 relative">
                    <BookOpen size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <select
                      value={exam.subject}
                      onChange={(e) => updateExam(exam.id, "subject", e.target.value)}
                      className={cn(inputCls, "pl-9", !exam.subject && "text-gray-400")}
                    >
                      <option value="">Select Subject</option>
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {/* Allow custom subjects not in the list if needed */}
                      {!subjectOptions.includes(exam.subject) && exam.subject && (
                        <option value={exam.subject}>{exam.subject}</option>
                      )}
                    </select>
                  </div>
                  
                  <div className="col-span-2 relative">
                    <CalendarIcon size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="date"
                      value={exam.date}
                      onChange={(e) => updateExam(exam.id, "date", e.target.value)}
                      className={cn(inputCls, "pl-9")}
                    />
                  </div>

                  <div className="col-span-2 relative">
                    <Clock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="time"
                      value={exam.startTime}
                      onChange={(e) => updateExam(exam.id, "startTime", e.target.value)}
                      className={cn(inputCls, "pl-9")}
                    />
                  </div>

                  <div className="col-span-2 relative">
                    <Clock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="time"
                      value={exam.endTime}
                      onChange={(e) => updateExam(exam.id, "endTime", e.target.value)}
                      className={cn(inputCls, "pl-9")}
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="e.g. Chapters 1-4"
                      value={exam.syllabus}
                      onChange={(e) => updateExam(exam.id, "syllabus", e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeExam(exam.id)}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove Exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  onClick={addExam}
                  className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#144835]/30 bg-[#144835]/5 text-xs font-bold text-[#144835] hover:bg-[#144835]/10 transition-colors"
                >
                  <Plus size={14} /> Add Subject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
