"use client";

import React, { useEffect, useState } from "react";


import {
  Search,
  RotateCw,
  FileText,
  Download,
  Printer,
  Sparkles,
  Radio,
} from "lucide-react";
import AttendanceTabGuide from "@/components/admin/attendance/AttendanceTabGuide";
import { useSchoolId } from "@/hooks/useSchoolId";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, fetchMany, db, auth } from "@/lib/db-client";
import { uniqueGradesFromClasses, uniqueSectionsFromClasses } from "@/lib/classSectionOptions";
import { useAcademicYear } from "@/contexts/AcademicYearContext";


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

type ReportCardsPanelProps = {
  initialTab?: ReportCardTabId;
};

export default function ReportCardsPanel({ initialTab = "report-card" }: ReportCardsPanelProps) {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const [activeTab, setActiveTab] = useState<ReportCardTabId>(initialTab);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [examOptions, setExamOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tabMeta = REPORT_CARD_TABS.find((t) => t.id === activeTab) ?? REPORT_CARD_TABS[0];

  useEffect(() => {
    async function loadMeta() {
      try {
        const [classSnap, examSnap] = await Promise.all([
          fetchMany(buildPath(db, "schools", schoolId, "classes")),
          fetchMany(buildPath(db, "schools", schoolId, "exam_types")),
        ]);
        const raw = classSnap.docs.map((d: any) => d.data());
        const grades = uniqueGradesFromClasses(raw);
        const sections = uniqueSectionsFromClasses(raw);
        const exams = examSnap.docs.map((d: any) => String(d.data().name ?? d.id).trim()).filter(Boolean);
        setClassOptions(grades);
        setSectionOptions(sections);
        setExamOptions(exams);
        if (grades.length > 0) setSelectedClass(grades[0]);
        if (sections.length > 0) setSelectedSection(sections[0]);
        if (exams.length > 0) setSelectedExam(exams[0]);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, [schoolId, currentYear?.name]);

  const handleTabChange = (tabId: ReportCardTabId) => {
    setActiveTab(tabId);
    setHasGenerated(false);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setHasGenerated(false);
    await new Promise((r) => setTimeout(r, 500));
    setHasGenerated(true);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
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

      <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 shadow-sm w-full min-w-0">
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
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            >
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            >
              <option value="">Select exam</option>
              {examOptions.map((e: any) => (
                <option key={e} value={e}>{e}</option>
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

      {!hasGenerated && !isLoading ? (
        <AttendanceTabGuide
          icon={tabMeta.icon}
          title={tabMeta.label}
          subtitle={tabMeta.description}
          steps={[
            { icon: Search, label: "Select class", hint: "Class & section", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { icon: FileText, label: "Pick exam", hint: "Exam term", color: "bg-blue-50 text-blue-600 border-blue-100" },
            { icon: Printer, label: "Print", hint: "PDF or Excel", color: "bg-amber-50 text-amber-600 border-amber-100" },
          ]}
          chips={[
            { icon: Printer, label: "Print PDF" },
            { icon: Download, label: "Export Excel" },
          ]}
        />
      ) : null}

      {hasGenerated && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{tabMeta.label}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-md transition-all"
              >
                <Printer size={14} />
                Print PDF
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-[#7ac2cf] hover:bg-[#68b5c2] rounded-md transition-all"
              >
                <Download size={14} />
                Export Excel
              </button>
            </div>
          </div>
          <div className="p-10 text-center">
            <div className="h-14 w-14 bg-[#144835]/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <tabMeta.icon size={24} className="text-[#144835]/60" />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">{tabMeta.label}</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {gradeLabel(selectedClass)} — Section {selectedSection}, {selectedExam}.
              {activeTab === "live" ? " Live preview will refresh as marks are saved." : " Full report rendering connects to marks data next."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
