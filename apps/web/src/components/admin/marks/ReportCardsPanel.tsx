"use client";

import { adminFetch } from "@/lib/adminApi";
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RotateCw,
  FileText,
  Download,
  Printer,
  Sparkles,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AttendanceTabGuide from "@/components/admin/attendance/AttendanceTabGuide";
import Term1ReportCard from "@/components/admin/marks/Term1ReportCard";
import Term2ReportCard from "@/components/admin/marks/Term2ReportCard";
import Pt1ReportCard from "@/components/admin/marks/Pt1ReportCard";
import { useSchoolId } from "@/hooks/useSchoolId";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, fetchMany, db } from "@/lib/db-client";
import { gradesMatchForClass } from "@/lib/gradeOrder";
import { setActiveAcademicYear } from "@/lib/activeAcademicYear";
import { fetchMarksDocs, fetchMarksIndex } from "@/lib/marksApi";
import { fetchStudentReportFields } from "@/lib/studentReportFieldsApi";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import {
  defaultTerm1SchoolMeta,
  emptyCoScholastic,
  emptyGradeOnly,
  formatReportDate,
  isTerm1GradeOnlySubject,
  normalizeReportSubject,
  parseComponentMarks,
  collectTermComponentsByStudent,
  term1CoreSubjectsForGrade,
  toScholasticRow,
  type Term1ComponentMarks,
  type Term1ReportCardData,
  type Term1ScholasticRow,
} from "@/lib/term1ReportCard";
import { buildTerm2ScholasticRows, emptyTerm2GradeOnly, TERM2_CORE_SUBJECTS, type Term2ReportCardData } from "@/lib/term2ReportCard";
import { buildPt1SubjectRows, type Pt1ReportCardData } from "@/lib/pt1ReportCard";
import {
  loadPt1ReportCardTemplate,
  loadReportCardTemplate,
  loadTerm2ReportCardTemplate,
} from "@/lib/documentTemplatesStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normalize section labels for matching (DAISY, KOALAS(CO-SPARK), etc.). */
function normalizeSectionKey(section: string): string {
  return String(section ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s+/g, " ");
}

function marksMatchClassSection(
  mark: { grade?: string; section?: string },
  grade: string,
  section: string
): boolean {
  if (!gradesMatchForClass(String(mark.grade ?? "").trim(), grade)) return false;
  return normalizeSectionKey(String(mark.section ?? "")) === normalizeSectionKey(section);
}

function studentMatchClassSection(student: StudentLite, grade: string, section: string): boolean {
  if (!gradesMatchForClass(student.grade, grade)) return false;
  return normalizeSectionKey(student.section) === normalizeSectionKey(section);
}

const REPORT_CARD_TABS = [
  {
    id: "report-card",
    label: "Report Card",
    description: "Preview and print individual student report cards for the selected exam.",
    icon: FileText,
  },
  {
    id: "generate",
    label: "Generate ReportCard",
    description: "Batch-generate report cards for an entire class or section.",
    icon: Sparkles,
  },
  {
    id: "live",
    label: "ReportCard Live",
    description: "Live report card view that updates as marks are entered.",
    icon: Radio,
  },
] as const;

type ReportCardTabId = (typeof REPORT_CARD_TABS)[number]["id"];

const gradeLabel = (grade: string) => {
  if (!grade || grade === "All") return "All Classes";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  return `Grade ${grade}`;
};

type StudentLite = {
  id: string;
  name: string;
  admissionNo: string;
  grade: string;
  section: string;
  roll: string;
  fatherName?: string;
  parentPhone?: string;
};

type ProfileLite = {
  fatherName: string;
  motherName: string;
  aadharNo: string;
  house: string;
  dob: string;
  address: string;
  phone: string;
  coScholastic?: Record<string, string>;
  disciplineGrade?: string;
  remarks?: string;
  heightCm?: string;
  weightKg?: string;
  workingDays?: number | null;
  daysPresent?: number | null;
};

function isTerm1Exam(name: string) {
  const n = name.toLowerCase();
  return (
    n.includes("term 1") ||
    n.includes("term-1") ||
    n.includes("term1") ||
    n.includes("terminal - i") ||
    n.includes("terminal-i") ||
    n.includes("terminal i") ||
    n === "t1"
  );
}

function isTerm2Exam(name: string) {
  const n = name.toLowerCase();
  return (
    n.includes("term 2") ||
    n.includes("term-2") ||
    n.includes("term2") ||
    n.includes("terminal - ii") ||
    n.includes("terminal-ii") ||
    n.includes("terminal ii") ||
    n === "t2"
  );
}

function isPtExam(name: string) {
  if (isTerm1Exam(name) || isTerm2Exam(name)) return false;
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  const compact = n.replace(/\s+/g, "");
  return (
    n.includes("periodic") ||
    /\bpt\s*[-]?\s*[1-4]\b/.test(n) ||
    /\bpa\s*[-]?\s*[1-4]\b/.test(n) ||
    /\bppt\s*[-]?\s*[1-4]\b/.test(n) ||
    /^ppt[1-4]$/.test(compact) ||
    /^pt[1-4]$/.test(compact) ||
    n.includes("pt1") ||
    n.includes("pt2") ||
    n.includes("ppt1") ||
    n.includes("ppt2") ||
    n === "pt" ||
    n === "pa"
  );
}

function isComponentExam(name: string) {
  const compact = String(name ?? "").replace(/\s+/g, "").toUpperCase();
  return /^(PPT|PT|PA|SE|MA|NB)[1-4]$/.test(compact);
}

function ptAssessmentTitle(examName: string, templateTitle?: string) {
  if (templateTitle?.trim()) return templateTitle.trim();
  const n = examName.toLowerCase();
  if (n.includes("2") || n.includes("ii") || n.includes("second")) {
    return "PERIODIC ASSESSMENT – II";
  }
  return "PERIODIC ASSESSMENT – I";
}

type ReportCardEntry =
  | { kind: "term1"; data: Term1ReportCardData }
  | { kind: "term2"; data: Term2ReportCardData }
  | { kind: "pt1"; data: Pt1ReportCardData };

function collectMarksByStudent(
  marksDocs: Array<Record<string, unknown> & { rows?: Record<string, unknown>[] }>
) {
  const byStudentSubject = new Map<string, Map<string, Term1ComponentMarks>>();
  marksDocs.forEach((doc) => {
    const subject = normalizeReportSubject(String(doc.subject || ""));
    (doc.rows || []).forEach((row: Record<string, unknown>) => {
      const studentId = String(row.studentId || "").trim();
      if (!studentId) return;
      if (!byStudentSubject.has(studentId)) byStudentSubject.set(studentId, new Map());
      const parsed = parseComponentMarks({
        ...row,
        maxMarks: row.maxMarks ?? doc.maxMarks,
        t1: row.t1 ?? row.T1 ?? row.t2 ?? row.T2,
      });
      byStudentSubject.get(studentId)!.set(subject, parsed);
    });
  });
  return byStudentSubject;
}

function buildScholasticRows(
  marksBySubject: Map<string, Term1ComponentMarks>,
  preferredOrder: readonly string[]
): Term1ScholasticRow[] {
  const preferred = new Set(preferredOrder.map((s) => normalizeReportSubject(s)));
  const rows: Term1ScholasticRow[] = preferredOrder.map((subject) =>
    toScholasticRow(subject, marksBySubject.get(normalizeReportSubject(subject)) || {})
  );

  const extras = Array.from(marksBySubject.keys())
    .filter((subject) => !preferred.has(subject))
    .filter((subject) => !isTerm1GradeOnlySubject(subject))
    .sort((a, b) => a.localeCompare(b))
    .map((subject) => toScholasticRow(subject, marksBySubject.get(subject)!));

  return [...rows, ...extras];
}

type ReportCardsPanelProps = {
  initialTab?: ReportCardTabId;
};

export default function ReportCardsPanel({ initialTab = "report-card" }: ReportCardsPanelProps) {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const { grades: branchGrades, sectionsForGrade } = useBranchClassOptions(schoolId);
  const [schoolMeta, setSchoolMeta] = useState(() => defaultTerm1SchoolMeta(schoolId));

  const [activeTab, setActiveTab] = useState<ReportCardTabId>(initialTab);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [marksSectionsByGrade, setMarksSectionsByGrade] = useState<Record<string, string[]>>({});
  const [examOptions, setExamOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [cards, setCards] = useState<ReportCardEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabMeta = REPORT_CARD_TABS.find((t) => t.id === activeTab) ?? REPORT_CARD_TABS[0];

  useEffect(() => {
    const t = loadReportCardTemplate(schoolId);
    setSchoolMeta({
      schoolName: t.schoolName,
      schoolSubtitle1: t.schoolSubtitle1,
      schoolSubtitle2: t.schoolSubtitle2,
      schoolAddress: t.schoolAddress,
      affiliationNo: t.affiliationNo,
      udiseCode: t.udiseCode,
      schoolLogoUrl: t.schoolLogoUrl,
      boardLogoUrl: t.boardLogoUrl,
      showSchoolLogo: t.showSchoolLogo,
      showBoardLogo: t.showBoardLogo,
      defaultTermTitle: t.defaultTermTitle,
    });
  }, [schoolId]);

  const sectionOptions = useMemo(() => {
    if (!selectedClass) return [];
    const fromClasses = sectionsForGrade(selectedClass);
    const fromMarks = marksSectionsByGrade[selectedClass] ?? [];
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const s of [...fromClasses, ...fromMarks]) {
      const key = normalizeSectionKey(s);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(s);
    }
    return merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [selectedClass, sectionsForGrade, marksSectionsByGrade]);

  useEffect(() => {
    setCards([]);
    setActiveIndex(0);
    setError(null);
  }, [currentYear?.name]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const academicYear = currentYear?.name ?? "";
        if (academicYear) setActiveAcademicYear(schoolId, academicYear);

        const [examSnap, marksIndex] = await Promise.all([
          fetchMany(buildPath(db, "schools", schoolId, "exam_types")),
          fetchMarksIndex(schoolId, academicYear),
        ]);

        let exams = examSnap.docs
          .map((d: any) => String(d.data().name ?? d.id).trim())
          .filter(Boolean);

        const fromMarksExams = Array.from(
          new Set(marksIndex.map((m) => String(m.exam ?? "").trim()).filter(Boolean))
        );
        exams = Array.from(new Set([...exams, ...fromMarksExams]));

        const fromMarksGrades = Array.from(
          new Set(marksIndex.map((m) => String(m.grade ?? "").trim()).filter(Boolean))
        );
        const grades = Array.from(new Set([...branchGrades, ...fromMarksGrades]));

        const sectionMap: Record<string, Set<string>> = {};
        for (const m of marksIndex) {
          const g = String(m.grade ?? "").trim();
          const s = String(m.section ?? "").trim();
          if (!g || !s) continue;
          const matchedGrade =
            grades.find((grade) => gradesMatchForClass(g, grade)) ?? g;
          if (!sectionMap[matchedGrade]) sectionMap[matchedGrade] = new Set();
          sectionMap[matchedGrade].add(s);
        }
        const marksSections: Record<string, string[]> = {};
        for (const [g, set] of Object.entries(sectionMap)) {
          marksSections[g] = [...set].sort((a, b) => a.localeCompare(b));
        }
        setMarksSectionsByGrade(marksSections);

        setClassOptions(grades.length ? grades : branchGrades);
        setExamOptions(exams);
        if (!selectedClass && grades.length > 0) setSelectedClass(grades[0]);
        const term1 = exams.find(isTerm1Exam);
        if (!selectedExam && (term1 || exams[0])) setSelectedExam(term1 || exams[0]);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, currentYear?.name, branchGrades.join("|")]);

  useEffect(() => {
    if (!sectionOptions.length) {
      setSelectedSection("");
      return;
    }
    if (!sectionOptions.includes(selectedSection)) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [sectionOptions, selectedSection]);

  const handleTabChange = (tabId: ReportCardTabId) => {
    setActiveTab(tabId);
    setCards([]);
    setActiveIndex(0);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedSection || !selectedExam) return;
    setIsLoading(true);
    setError(null);
    setCards([]);
    setActiveIndex(0);

    try {
      const academicYear = currentYear?.name ?? "";
      if (academicYear) setActiveAcademicYear(schoolId, academicYear);

      const [studentsSnap, classSectionMarks] = await Promise.all([
        fetchMany(buildPath(db, "schools", schoolId, "students")),
        fetchMarksDocs(schoolId, academicYear, {
          grade: selectedClass,
          section: selectedSection,
        }),
      ]);

      let students: StudentLite[] = studentsSnap.docs
        .map((d: any) => {
          const s = d.data();
          return {
            id: d.id,
            name:
              String(s.name || s.studentName || "").trim() ||
              `${String(s.firstName || "").trim()} ${String(s.lastName || "").trim()}`.trim() ||
              "Unnamed",
            admissionNo: String(s.admissionNo || s.admissionNumber || s.admission_no || "").trim(),
            grade: String(s.classId || s.grade || "").trim(),
            section: String(s.section || "").trim().toUpperCase(),
            roll: String(s.rollNumber || s.roll || "").trim(),
            fatherName: String(s.fatherName ?? "").trim(),
            parentPhone: String(s.parentPhone ?? "").trim(),
          };
        })
        .filter((s) => studentMatchClassSection(s, selectedClass, selectedSection))
        .sort((a, b) => {
          const ra = Number(a.roll) || 0;
          const rb = Number(b.roll) || 0;
          if (ra && rb && ra !== rb) return ra - rb;
          return a.name.localeCompare(b.name);
        });

      if (!students.length && classSectionMarks.length) {
        const fromMarks = new Map<string, StudentLite>();
        for (const doc of classSectionMarks) {
          for (const row of doc.rows ?? []) {
            const id = String(row.studentId ?? "").trim();
            if (!id || fromMarks.has(id)) continue;
            fromMarks.set(id, {
              id,
              name: String(row.studentName ?? "Unnamed").trim() || "Unnamed",
              admissionNo: String(row.admissionNo ?? row.roll ?? "").trim(),
              grade: selectedClass,
              section: normalizeSectionKey(selectedSection),
              roll: String(row.roll ?? row.admissionNo ?? "").trim(),
            });
          }
        }
        students = [...fromMarks.values()].sort((a, b) => {
          const ra = Number(a.roll) || 0;
          const rb = Number(b.roll) || 0;
          if (ra && rb && ra !== rb) return ra - rb;
          return a.name.localeCompare(b.name);
        });
      }

      if (!students.length) {
        setError(
          academicYear
            ? `No students found for ${selectedClass} · ${selectedSection} in ${academicYear}. Switch academic year or check marks import.`
            : "No students found for this class & section."
        );
        setIsLoading(false);
        return;
      }

      if (!classSectionMarks.length) {
        setError(
          academicYear
            ? `No marks found for ${selectedClass} · ${selectedSection} in ${academicYear}.`
            : "No marks found for this class & section."
        );
        setIsLoading(false);
        return;
      }

      const filterMarks = (examName: string) =>
        classSectionMarks.filter((m) => String(m.exam ?? "") === examName);

      const term2Mode = isTerm2Exam(selectedExam);
      const pt1Mode = !term2Mode && (isPtExam(selectedExam) || isComponentExam(selectedExam));

      const byStudentSubject = term2Mode || isTerm1Exam(selectedExam)
        ? collectTermComponentsByStudent(classSectionMarks, 1)
        : collectMarksByStudent(filterMarks(selectedExam));

      const byStudentSubjectTerm1 = term2Mode
        ? collectTermComponentsByStudent(classSectionMarks, 1)
        : byStudentSubject;

      const byStudentSubjectTerm2 = term2Mode
        ? collectTermComponentsByStudent(classSectionMarks, 2)
        : new Map<string, Map<string, Term1ComponentMarks>>();

      const reportFields = await fetchStudentReportFields(
        schoolId,
        academicYear,
        students.map((s) => s.id)
      ).catch((err) => {
        console.warn("Report card profile batch load failed:", err);
        return {} as Record<string, ProfileLite>;
      });

      const profiles = new Map<string, ProfileLite>();
      for (const student of students) {
        const loaded = reportFields[student.id];
        profiles.set(student.id, {
          fatherName: loaded?.fatherName || student.fatherName || "",
          motherName: loaded?.motherName || "",
          aadharNo: loaded?.aadharNo || "",
          house: loaded?.house || "",
          dob: loaded?.dob || "",
          address: loaded?.address || "",
          phone: loaded?.phone || student.parentPhone || "",
          coScholastic: loaded?.coScholastic,
          disciplineGrade: loaded?.disciplineGrade,
          remarks: loaded?.remarks,
          heightCm: loaded?.heightCm,
          weightKg: loaded?.weightKg,
          workingDays: loaded?.workingDays,
          daysPresent: loaded?.daysPresent,
        });
      }

      const yearLabel = academicYear || new Date().getFullYear().toString();
      const termTitle = isTerm1Exam(selectedExam)
        ? schoolMeta.defaultTermTitle || "TERMINAL - I RESULT"
        : `${selectedExam.toUpperCase()} RESULT`;
      const generatedOn = formatReportDate(new Date());
      const {
        defaultTermTitle: _defaultTermTitle,
        ...letterhead
      } = schoolMeta;
      const term2Template = term2Mode ? loadTerm2ReportCardTemplate(schoolId) : null;
      const pt1Template = pt1Mode ? loadPt1ReportCardTemplate(schoolId) : null;
      const term2Letterhead = term2Template
        ? {
            schoolName: term2Template.schoolName,
            schoolSubtitle1: term2Template.schoolSubtitle1,
            schoolSubtitle2: term2Template.schoolSubtitle2,
            schoolAddress: term2Template.schoolAddress,
            affiliationNo: term2Template.affiliationNo,
            udiseCode: term2Template.udiseCode,
            schoolLogoUrl: term2Template.schoolLogoUrl,
            boardLogoUrl: term2Template.boardLogoUrl,
            showSchoolLogo: term2Template.showSchoolLogo,
            showBoardLogo: term2Template.showBoardLogo,
          }
        : letterhead;

      const nextCards: ReportCardEntry[] = students.map((student) => {
        const marksMap = byStudentSubject.get(student.id) || new Map();
        const term1MarksMap = byStudentSubjectTerm1.get(student.id) || new Map();
        const profile = profiles.get(student.id);
        const gradeOnlySource = term2Mode ? emptyTerm2GradeOnly() : emptyGradeOnly();
        const gradeOnly = gradeOnlySource.map((row) => {
          const term2Components = byStudentSubjectTerm2.get(student.id);
          const t1Raw = term1MarksMap.get(row.subject);
          const t2Raw = term2Components?.get(row.subject);
          const gradeFromComponents = (raw: Term1ComponentMarks | undefined) => {
            if (!raw) return "";
            const label = String(raw.gradeLabel ?? "").trim().toUpperCase();
            if (label) return label;
            return toScholasticRow(row.subject, raw).grade;
          };
          const fromT2 = gradeFromComponents(t2Raw);
          const fromT1 = gradeFromComponents(t1Raw);
          const fromAlias =
            row.subject === "ROBOTICS"
              ? gradeFromComponents(term1MarksMap.get("ROBOTICS CODING")) ||
                gradeFromComponents(t2Raw ? term2Components?.get("ROBOTICS CODING") : undefined)
              : row.subject === "SPACE"
                ? gradeFromComponents(term1MarksMap.get("SPACE ASTRONOMY")) ||
                  gradeFromComponents(t2Raw ? term2Components?.get("SPACE ASTRONOMY") : undefined)
                : "";
          return { ...row, grade: fromT2 || fromT1 || fromAlias };
        });

        const ict = gradeOnly.find((g) => g.subject === "ICT");
        if (ict && !ict.grade) {
          const computer = marksMap.get("ICT") || marksMap.get("COMPUTER");
          if (computer) {
            ict.grade = toScholasticRow("ICT", computer).grade;
          }
        }

        const coScholastic = emptyCoScholastic().map((row) => ({
          ...row,
          grade: String(profile?.coScholastic?.[row.area] || "").trim().toUpperCase(),
        }));

        if (term2Mode) {
          const term2Data: Term2ReportCardData = {
            ...term2Letterhead,
            academicYear: yearLabel,
            profileTitle: term2Template?.profileTitle || "PERFORMANCE PROFILE",
            studentName: student.name,
            admissionNo: student.admissionNo || student.roll,
            fatherName: profile?.fatherName || "",
            motherName: profile?.motherName || "",
            classSection: `${selectedClass}-${selectedSection}`,
            className: selectedClass,
            sectionName: selectedSection,
            aadharNo: profile?.aadharNo || "",
            dateOfBirth: profile?.dob || "",
            house: profile?.house || "",
            residentialAddress: profile?.address || "",
            telephoneNo: profile?.phone || "",
            heightCm: profile?.heightCm || "",
            weightKg: profile?.weightKg || "",
            scholastic: buildTerm2ScholasticRows(
              term1MarksMap,
              byStudentSubjectTerm2.get(student.id) || new Map(),
              TERM2_CORE_SUBJECTS
            ),
            gradeOnlySubjects: gradeOnly,
            coScholastic,
            disciplineGrade: profile?.disciplineGrade || "",
            workingDays: profile?.workingDays ?? null,
            daysPresent: profile?.daysPresent ?? null,
            remarks: profile?.remarks || "",
            generatedOn,
          };
          return { kind: "term2" as const, data: term2Data };
        }

        if (pt1Mode && pt1Template) {
          const gradeMap = new Map(
            Array.from(marksMap.entries()).map(([subject, raw]) => {
              const row = toScholasticRow(subject, raw);
              return [
                subject,
                {
                  gradeLabel: row.grade,
                  total: row.total,
                  maxMarks: 100 as number | null,
                },
              ] as const;
            })
          );
          const pt1Data: Pt1ReportCardData = {
            schoolName: pt1Template.schoolName,
            schoolAddress: pt1Template.schoolAddress,
            affiliationNo: pt1Template.affiliationNo,
            academicYear: yearLabel,
            assessmentTitle: ptAssessmentTitle(selectedExam, pt1Template.assessmentTitle),
            studentName: student.name,
            className: selectedClass,
            sectionName: selectedSection,
            house: profile?.house || "",
            subjects: buildPt1SubjectRows(gradeMap),
            remarks: profile?.remarks || "",
            generatedOn,
            schoolLogoUrl: pt1Template.schoolLogoUrl,
            showSchoolLogo: pt1Template.showSchoolLogo,
          };
          return { kind: "pt1" as const, data: pt1Data };
        }

        const term1Data: Term1ReportCardData = {
          ...letterhead,
          academicYear: yearLabel,
          termTitle,
          studentName: student.name,
          admissionNo: student.admissionNo || student.roll,
          fatherName: profile?.fatherName || "",
          motherName: profile?.motherName || "",
          classSection: `${selectedClass}-${selectedSection}`,
          aadharNo: profile?.aadharNo || "",
          dateOfBirth: profile?.dob || "",
          house: profile?.house || "",
          residentialAddress: profile?.address || "",
          telephoneNo: profile?.phone || "",
          scholastic: buildScholasticRows(marksMap, term1CoreSubjectsForGrade(selectedClass)),
          gradeOnlySubjects: gradeOnly,
          coScholastic,
          disciplineGrade: profile?.disciplineGrade || "",
          workingDays: profile?.workingDays ?? null,
          daysPresent: profile?.daysPresent ?? null,
          remarks: profile?.remarks || "",
          generatedOn,
        };
        return { kind: "term1" as const, data: term1Data };
      });

      setCards(nextCards);
      setActiveIndex(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to generate report cards.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeCard = cards[activeIndex] ?? null;
  const showAll = activeTab === "generate";
  const printPortrait = cards.some((c) => c.kind === "pt1");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide print:hidden">
        {REPORT_CARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2 shrink-0",
              activeTab === tab.id
                ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 shadow-sm w-full min-w-0 print:hidden">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            >
              <option value="">Select class</option>
              {classOptions.map((g) => (
                <option key={g} value={g}>
                  {gradeLabel(g)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            >
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            >
              <option value="">Select exam</option>
              {examOptions.map((e: any) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !selectedClass || !selectedSection || !selectedExam}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
          >
            {isLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isLoading ? "Loading..." : activeTab === "generate" ? "Generate" : "Load"}
          </button>
        </div>
      </div>

      {!cards.length && !isLoading ? (
        <div className="print:hidden">
          <AttendanceTabGuide
            icon={tabMeta.icon}
            title={tabMeta.label}
            subtitle={
              isPtExam(selectedExam || "")
                ? "PT report cards use the official A4 portrait Periodic Assessment layout (subject grades)."
                : isTerm2Exam(selectedExam || "")
                  ? "Term-2 report cards use the official 4-page PERFORMANCE PROFILE layout (Terminal I + II)."
                  : isTerm1Exam(selectedExam || "Term 1")
                    ? "Term-1 report cards (grades I–X) use the official IDPS CBSE Terminal-I layout (PA / SE / MA / NB / TERM)."
                    : tabMeta.description
            }
            steps={[
              { icon: Search, label: "Select class", hint: "Class & section", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
              {
                icon: FileText,
                label: isPtExam(selectedExam || "")
                  ? "Pick PT exam"
                  : isTerm2Exam(selectedExam || "")
                    ? "Pick Term 2"
                    : "Pick Term 1",
                hint: "Exam term",
                color: "bg-blue-50 text-blue-600 border-blue-100",
              },
              {
                icon: Printer,
                label: "Print",
                hint: isPtExam(selectedExam || "") ? "21 × 29.7 cm" : "29.7 × 21 cm",
                color: "bg-amber-50 text-amber-600 border-amber-100",
              },
            ]}
            chips={[
              { icon: Printer, label: "Print PDF" },
              { icon: Download, label: "Export Excel" },
            ]}
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 print:hidden">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="print:hidden">
          <SkeletonCard lines={10} className="mx-auto max-w-4xl" />
        </div>
      ) : null}

      {cards.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{tabMeta.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {gradeLabel(selectedClass)} — {selectedSection} · {selectedExam} · {cards.length}{" "}
                student{cards.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!showAll && cards.length > 1 ? (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                    disabled={activeIndex === 0}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-bold text-gray-600 min-w-[4rem] text-center">
                    {activeIndex + 1} / {cards.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => Math.min(cards.length - 1, i + 1))}
                    disabled={activeIndex >= cards.length - 1}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-md transition-all"
              >
                <Printer size={14} />
                Print PDF
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto bg-neutral-100 print:bg-white print:p-0">
            <div
              className={cn(
                "report-card-print-root mx-auto w-fit max-w-full space-y-6 print:space-y-0 print:w-auto print:max-w-none",
                cards[0]?.kind === "pt1" && "report-card-print-root--portrait"
              )}
            >
              {showAll
                ? cards.map((card, idx) => (
                    <div
                      key={`${card.data.studentName}-${idx}`}
                      className={cn(
                        "report-card-page bg-white shadow-sm print:shadow-none",
                        card.kind === "pt1" && "report-card-page--portrait"
                      )}
                    >
                      {card.kind === "term2" ? (
                        <Term2ReportCard data={card.data} />
                      ) : card.kind === "pt1" ? (
                        <Pt1ReportCard data={card.data} />
                      ) : (
                        <Term1ReportCard data={card.data} />
                      )}
                    </div>
                  ))
                : activeCard ? (
                    <div
                      className={cn(
                        "report-card-page bg-white shadow-sm print:shadow-none",
                        activeCard.kind === "pt1" && "report-card-page--portrait"
                      )}
                    >
                      {activeCard.kind === "term2" ? (
                        <Term2ReportCard data={activeCard.data} />
                      ) : activeCard.kind === "pt1" ? (
                        <Pt1ReportCard data={activeCard.data} />
                      ) : (
                        <Term1ReportCard data={activeCard.data} />
                      )}
                    </div>
                  ) : null}
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: ${printPortrait ? "21cm 29.7cm" : "29.7cm 21cm"};
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          .report-card-print-root,
          .report-card-print-root * {
            visibility: visible !important;
          }
          .report-card-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: ${printPortrait ? "21cm" : "29.7cm"};
          }
          .report-card-page {
            width: ${printPortrait ? "21cm" : "29.7cm"} !important;
            height: ${printPortrait ? "29.7cm" : "21cm"} !important;
            break-after: page;
            page-break-after: always;
            overflow: hidden;
            box-shadow: none !important;
          }
          .report-card-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .term1-rc,
          .term1-rc-page,
          .term2-rc,
          .term2-rc-page {
            width: 29.7cm !important;
            height: 21cm !important;
            max-width: none !important;
            min-height: 0 !important;
            box-shadow: none !important;
          }
          .pt1-rc,
          .pt1-rc-page {
            width: 21cm !important;
            height: 29.7cm !important;
            max-width: none !important;
            min-height: 0 !important;
            box-shadow: none !important;
          }
        }
      `,
        }}
      />
    </div>
  );
}
