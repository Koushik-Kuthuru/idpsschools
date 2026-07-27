"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  Download,
  List,
  RotateCw,
  TrendingUp,
} from "lucide-react";
import { fetchMarksDocs, type MarksDoc } from "@/lib/marksApi";
import { gradeForMarks } from "@/lib/marksGrades";
import { overallGradeFromTotalPercent } from "@/lib/term1ReportCard";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SubjectRow = {
  key: string;
  exam: string;
  subject: string;
  max: number;
  obtained: number | null;
  absent: boolean;
  grade: string;
  remark: string;
  percentage: number | null;
};

type Props = {
  schoolId: string;
  studentId: string;
  academicYear?: string | null;
  grade?: string;
  section?: string;
  studentName?: string;
  admissionNo?: string;
};

function remarkForPercent(pct: number | null, absent: boolean) {
  if (absent) return "Absent";
  if (pct == null) return "—";
  if (pct >= 91) return "Outstanding";
  if (pct >= 81) return "Excellent";
  if (pct >= 71) return "Very Good";
  if (pct >= 61) return "Good";
  if (pct >= 51) return "Satisfactory";
  if (pct >= 33) return "Needs Improvement";
  return "Needs Focus";
}

function performanceLabel(pct: number) {
  if (pct >= 91) return "Outstanding performance";
  if (pct >= 81) return "Excellent performance";
  if (pct >= 71) return "Very good performance";
  if (pct >= 61) return "Good performance";
  if (pct >= 33) return "Average performance";
  return "Needs improvement";
}

function extractStudentRows(docs: MarksDoc[], studentId: string): SubjectRow[] {
  const out: SubjectRow[] = [];
  for (const doc of docs) {
    const row = (doc.rows ?? []).find(
      (entry) => String((entry as { studentId?: unknown }).studentId ?? "") === studentId
    ) as
      | {
          marks?: unknown;
          maxMarks?: unknown;
          gradeLabel?: unknown;
          absent?: unknown;
          remark?: unknown;
        }
      | undefined;
    if (!row) continue;

    const absent = Boolean(row.absent);
    const max = Number(row.maxMarks ?? doc.maxMarks ?? 100) || 100;
    const obtainedRaw = row.marks;
    const obtained =
      absent || obtainedRaw === "" || obtainedRaw == null || !Number.isFinite(Number(obtainedRaw))
        ? null
        : Number(obtainedRaw);
    const percentage =
      obtained == null || max <= 0 ? null : Math.round((obtained / max) * 1000) / 10;
    const grade =
      String(row.gradeLabel ?? "").trim() ||
      (obtained == null ? "-" : gradeForMarks(obtained, max));

    out.push({
      key: `${doc.id}-${studentId}`,
      exam: String(doc.exam ?? "Exam").trim() || "Exam",
      subject: String(doc.subject ?? "Subject").trim() || "Subject",
      max,
      obtained,
      absent,
      grade,
      remark: String(row.remark ?? "").trim() || remarkForPercent(percentage, absent),
      percentage,
    });
  }
  return out.sort(
    (a, b) => a.exam.localeCompare(b.exam) || a.subject.localeCompare(b.subject)
  );
}

function computeStats(visibleRows: SubjectRow[]) {
  const scored = visibleRows.filter((r) => r.obtained != null && !r.absent);
  const totalObtained = scored.reduce((s, r) => s + Number(r.obtained), 0);
  const totalMax = scored.reduce((s, r) => s + r.max, 0);
  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const overallGrade =
    scored.length === 0
      ? "-"
      : overallGradeFromTotalPercent(percentage) || gradeForMarks(totalObtained, totalMax);

  let needsFocus = "-";
  let lowestPct: number | null = null;
  for (const row of scored) {
    const pct = row.percentage ?? 0;
    if (lowestPct == null || pct < lowestPct) {
      lowestPct = pct;
      needsFocus = row.subject;
    }
  }

  return {
    overallGrade: String(overallGrade),
    totalObtained,
    totalMax,
    percentage,
    needsFocus,
    lowestPct,
    subjectCount: scored.length,
  };
}

function CheckboxMultiSelect({
  options,
  selected,
  onChange,
  disabled,
  emptyLabel,
  allLabel,
  countNoun,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  emptyLabel: string;
  allLabel: string;
  countNoun: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const allSelected = options.length > 0 && selected.length === options.length;
  const label =
    selected.length === 0
      ? emptyLabel
      : allSelected
        ? allLabel
        : `${selected.length} ${countNoun}${selected.length === 1 ? "" : "s"} selected`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
      return;
    }
    onChange([...selected, value].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
  };

  return (
    <div ref={rootRef} className="relative min-w-[180px]">
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-[#144835]/30 bg-white ring-2 ring-[#144835]/20"
        )}
      >
        <span className={cn("truncate", selected.length === 0 && "text-gray-400")}>{label}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180 text-[#144835]")}
          strokeWidth={3}
        />
      </button>
      {open && options.length > 0 ? (
        <div className="absolute left-0 z-50 mt-1 w-72 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <label className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
              checked={allSelected}
              onChange={() => onChange(allSelected ? [] : [...options])}
            />
            Select All
          </label>
          {options.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835]/30"
                checked={selected.includes(value)}
                onChange={() => toggle(value)}
              />
              <span className="truncate uppercase tracking-wide">{value}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadPerformanceReport(opts: {
  studentName: string;
  admissionNo: string;
  classLabel: string;
  academicYear: string;
  examsLabel: string;
  subjectsLabel: string;
  rows: SubjectRow[];
  stats: ReturnType<typeof computeStats>;
}) {
  const {
    studentName,
    admissionNo,
    classLabel,
    academicYear,
    examsLabel,
    subjectsLabel,
    rows,
    stats,
  } = opts;

  const bodyRows = rows
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.exam)}</td>
        <td>${escapeHtml(row.subject)}</td>
        <td class="num">${row.max}</td>
        <td class="num">${row.absent ? "AB" : row.obtained ?? "—"}</td>
        <td class="num">${row.percentage == null ? "—" : `${row.percentage}%`}</td>
        <td class="num">${escapeHtml(row.grade)}</td>
        <td>${escapeHtml(row.remark)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Performance Report — ${escapeHtml(studentName)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 18px; margin: 0 0 4px; color: #144835; }
    .meta { font-size: 12px; color: #555; margin-bottom: 18px; line-height: 1.5; }
    .cards { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; min-width: 120px; }
    .card .label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
    .card .value { font-size: 16px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
    td.num, th.num { text-align: center; }
    tfoot td { font-weight: 700; background: #ecf4ef; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Student Performance Report</h1>
  <div class="meta">
    <div><strong>Student:</strong> ${escapeHtml(studentName || "—")}</div>
    <div><strong>Admission No:</strong> ${escapeHtml(admissionNo || "—")}</div>
    <div><strong>Class:</strong> ${escapeHtml(classLabel || "—")}</div>
    <div><strong>Academic Year:</strong> ${escapeHtml(academicYear || "—")}</div>
    <div><strong>Exam Types:</strong> ${escapeHtml(examsLabel)}</div>
    <div><strong>Subjects:</strong> ${escapeHtml(subjectsLabel)}</div>
  </div>
  <div class="cards">
    <div class="card"><div class="label">Overall Grade</div><div class="value">${escapeHtml(stats.overallGrade)}</div></div>
    <div class="card"><div class="label">Total Marks</div><div class="value">${stats.totalObtained} / ${stats.totalMax}</div></div>
    <div class="card"><div class="label">Percentage</div><div class="value">${stats.percentage}%</div></div>
    <div class="card"><div class="label">Needs Focus</div><div class="value">${escapeHtml(stats.needsFocus)}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Exam</th>
        <th>Subject</th>
        <th class="num">Max</th>
        <th class="num">Obtained</th>
        <th class="num">%</th>
        <th class="num">Grade</th>
        <th>Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows || `<tr><td colspan="7" style="text-align:center">No marks for selected subjects</td></tr>`}
    </tbody>
    ${
      rows.length
        ? `<tfoot>
      <tr>
        <td colspan="2">Grand Total</td>
        <td class="num">${stats.totalMax}</td>
        <td class="num">${stats.totalObtained}</td>
        <td class="num">${stats.percentage}%</td>
        <td class="num">${escapeHtml(stats.overallGrade)}</td>
        <td>${stats.percentage >= 33 ? "Pass" : stats.subjectCount ? "Fail" : "—"}</td>
      </tr>
    </tfoot>`
        : ""
    }
  </table>
  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${(studentName || "student").replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function StudentPerformancePanel({
  schoolId,
  studentId,
  academicYear,
  grade,
  section,
  studentName = "",
  admissionNo = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchMarksDocs(schoolId, academicYear, {
        grade: grade || undefined,
        section: section || undefined,
      });
      let next = extractStudentRows(docs, studentId);
      if (next.length === 0) {
        const all = await fetchMarksDocs(schoolId, academicYear);
        next = extractStudentRows(all, studentId);
      }
      setRows(next);
      const exams = Array.from(new Set(next.map((r) => r.exam))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
      const subjects = Array.from(new Set(next.map((r) => r.subject))).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
      setSelectedExams((prev) => {
        if (prev.length === 0) return exams;
        const kept = prev.filter((s) => exams.includes(s));
        return kept.length > 0 ? kept : exams;
      });
      setSelectedSubjects((prev) => {
        if (prev.length === 0) return subjects;
        const kept = prev.filter((s) => subjects.includes(s));
        return kept.length > 0 ? kept : subjects;
      });
    } catch (err) {
      setRows([]);
      setSelectedExams([]);
      setSelectedSubjects([]);
      setError(err instanceof Error ? err.message : "Failed to load marks");
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, academicYear, grade, section]);

  useEffect(() => {
    void load();
  }, [load]);

  const examOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.exam))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [rows]);

  const subjectOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.subject))).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (selectedExams.length === 0 || selectedSubjects.length === 0) return [];
    const exams = new Set(selectedExams);
    const subjects = new Set(selectedSubjects);
    return rows.filter((row) => exams.has(row.exam) && subjects.has(row.subject));
  }, [rows, selectedExams, selectedSubjects]);

  const stats = useMemo(() => computeStats(visibleRows), [visibleRows]);
  const classLabel = [grade, section].filter(Boolean).join(" · ") || "Current class";
  const examsLabel =
    selectedExams.length === 0
      ? "None"
      : selectedExams.length === examOptions.length
        ? "All exam types"
        : selectedExams.join(", ");
  const subjectsLabel =
    selectedSubjects.length === 0
      ? "None"
      : selectedSubjects.length === subjectOptions.length
        ? "All subjects"
        : selectedSubjects.join(", ");
  const showExamCol = useMemo(
    () => new Set(visibleRows.map((r) => r.exam)).size > 1,
    [visibleRows]
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 inline-flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
            {classLabel}
            {academicYear ? ` · ${academicYear}` : ""}
          </div>

          <CheckboxMultiSelect
            options={examOptions}
            selected={selectedExams}
            onChange={setSelectedExams}
            disabled={loading || examOptions.length === 0}
            emptyLabel="Select exam types"
            allLabel="All exam types"
            countNoun="exam"
          />

          <CheckboxMultiSelect
            options={subjectOptions}
            selected={selectedSubjects}
            onChange={setSelectedSubjects}
            disabled={loading || subjectOptions.length === 0}
            emptyLabel="Select subjects"
            allLabel="All subjects"
            countNoun="subject"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center"
            title="Refresh"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            disabled={loading || visibleRows.length === 0}
            onClick={() =>
              downloadPerformanceReport({
                studentName,
                admissionNo,
                classLabel,
                academicYear: academicYear || "",
                examsLabel,
                subjectsLabel,
                rows: visibleRows,
                stats,
              })
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#144835]/10 text-[#144835] text-xs font-bold uppercase tracking-wider hover:bg-[#144835]/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} strokeWidth={2.5} />
            Download Report
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-rose-100 p-6 text-center">
          <AlertCircle className="mx-auto text-rose-400 mb-2" size={22} />
          <p className="text-xs font-bold text-rose-600">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-emerald-50 to-transparent" />
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-emerald-100/50 text-[#144835] flex items-center justify-center shrink-0">
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overall Grade</p>
              <h4 className="text-base font-bold text-gray-900 leading-none mt-1">
                {loading ? "…" : stats.overallGrade}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 inline-flex px-2 py-1 rounded-md">
            <TrendingUp size={12} strokeWidth={3} />
            {stats.subjectCount} subject{stats.subjectCount === 1 ? "" : "s"} scored
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <Award size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Marks</p>
              <h4 className="text-base font-bold text-gray-900 leading-none mt-1">
                {loading ? "…" : stats.totalObtained}
                <span className="text-xs text-gray-400 ml-1 font-bold">/ {stats.totalMax}</span>
              </h4>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Percentage</p>
              <h4 className="text-base font-bold text-gray-900 leading-none mt-1">
                {loading ? "…" : `${stats.percentage}%`}
              </h4>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 mt-2">
            {stats.subjectCount ? performanceLabel(stats.percentage) : "No scored subjects"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Needs Focus</p>
              <h4 className="text-sm font-bold text-gray-900 leading-tight mt-1">
                {loading ? "…" : stats.needsFocus}
              </h4>
            </div>
          </div>
          <p className="text-xs font-bold text-amber-600 bg-amber-50 inline-flex px-2 py-1 rounded-md mt-1">
            {stats.lowestPct == null ? "—" : `Lowest score: ${stats.lowestPct}%`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
              <List size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Subject Wise Performance
              </h3>
              <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">
                Showing: {examsLabel} · {subjectsLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {showExamCol ? (
                  <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Exam
                  </th>
                ) : null}
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Subject
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Max Marks
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Marks Obtained
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Percentage
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Grade
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows rows={6} columns={showExamCol ? 7 : 6} />
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={showExamCol ? 7 : 6}
                    className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide"
                  >
                    {rows.length === 0
                      ? `No marks found for this student in ${academicYear || "selected year"}`
                      : selectedExams.length === 0
                        ? "Select at least one exam type"
                        : "Select at least one subject"}
                  </td>
                </tr>
              ) : (
                visibleRows.map((item) => {
                  const percentage = item.percentage ?? 0;
                  return (
                    <tr key={item.key} className="hover:bg-gray-50/50 transition-colors">
                      {showExamCol ? (
                        <td className="py-2.5 px-4">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {item.exam}
                          </span>
                        </td>
                      ) : null}
                      <td className="py-2.5 px-4">
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                          {item.subject}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-xs font-bold text-gray-500">{item.max}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-xs font-bold text-gray-900">
                          {item.absent ? "AB" : item.obtained ?? "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-[#144835] w-10">
                            {item.percentage == null ? "—" : `${item.percentage}%`}
                          </span>
                          {item.percentage != null ? (
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden md:block">
                              <div
                                className={`h-1.5 rounded-full ${
                                  percentage >= 90
                                    ? "bg-[#144835]"
                                    : percentage >= 80
                                      ? "bg-emerald-500"
                                      : percentage >= 70
                                        ? "bg-amber-400"
                                        : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold tracking-wider ${
                            item.grade === "A1"
                              ? "bg-[#144835]/10 text-[#144835]"
                              : item.grade === "A2"
                                ? "bg-emerald-50 text-emerald-600"
                                : item.grade === "B1"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          {item.remark}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {visibleRows.length > 0 ? (
              <tfoot className="bg-[#144835]/5 border-t border-gray-100">
                <tr>
                  {showExamCol ? <td className="py-2.5 px-4" /> : null}
                  <td className="py-2.5 px-4">
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Grand Total
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-xs font-bold text-gray-900">{stats.totalMax}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-xs font-bold text-[#144835]">{stats.totalObtained}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="text-xs font-bold text-[#144835]">{stats.percentage}%</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#144835] text-white text-xs font-bold tracking-wider">
                      {stats.overallGrade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="text-xs font-bold text-[#144835] uppercase tracking-wide">
                      {stats.percentage >= 33 ? "Pass" : stats.subjectCount ? "Fail" : "—"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}
