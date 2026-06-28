"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Coffee, Plus, RotateCw, Save, Settings2, Trash2 } from "lucide-react";


import { useSchoolId } from "@/hooks/useSchoolId";
import TimetableTemplatePanel from "./TimetableTemplatePanel";
import {
  DEFAULT_TERM_KEY,
  emptyPeriodEntry,
  emptyPeriodGrid,
  normalizePeriodGrid,
  remapPeriodGrid,
  timetableDays,
  timetableDocId,
  type PeriodEntry,
  type PeriodGrid,
  type TimetableDay,
} from "./timetablePeriodGrid";
import { buildPath, fetchOne, fetchMany, upsertData, db, auth } from "@/lib/db-client";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import {
  buildTableColumns,
  defaultTimetableTemplate,
  formatTimeRange,
  normalizeTimetableTemplate,
  TIMETABLE_TEMPLATE_DOC,
  type TableColumn,
  type TimetableTemplate,
} from "./timetableTemplate";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const selectCls =
  "h-8 flex-1 min-w-0 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835]";

function gradeLabel(grade: string) {
  if (!grade) return "—";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  return `Grade ${grade}`;
}

function teacherName(data: Record<string, unknown>) {
  const first = String(data.firstName ?? "").trim();
  const last = String(data.lastName ?? "").trim();
  return `${first} ${last}`.trim() || String(data.employeeId ?? "Teacher").trim();
}

type PeriodCellProps = {
  entries: PeriodEntry[];
  subjectOptions: string[];
  teacherOptions: string[];
  onChange: (next: PeriodEntry[]) => void;
};

function PeriodCell({ entries, subjectOptions, teacherOptions, onChange }: PeriodCellProps) {
  const updateEntry = (index: number, patch: Partial<PeriodEntry>) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyPeriodEntry()]);
  };

  return (
    <div className="space-y-1.5">
      {entries.map((entry, index) => (
        <div key={index} className="flex items-center gap-1">
          <select
            value={entry.subject}
            onChange={(e) => updateEntry(index, { subject: e.target.value })}
            className={selectCls}
          >
            <option value="">Subject</option>
            {subjectOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={entry.teacher}
            onChange={(e) => updateEntry(index, { teacher: e.target.value })}
            className={selectCls}
          >
            <option value="">Teacher</option>
            {teacherOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeEntry(index)}
            aria-label="Clear slot"
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, emptyPeriodEntry()])}
        className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-[#144835]/20 bg-[#144835]/5 text-[#144835] hover:bg-[#144835]/10 transition-colors"
        title="Add another subject"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function columnKey(col: TableColumn) {
  return col.type === "period" ? col.period.id : col.break.id;
}

export default function AddUpdateTimetableTab() {
  const schoolId = useSchoolId();
  const { grades: classOptionsFromHook, sectionsByClass } = useBranchClassOptions(schoolId);
  const [template, setTemplate] = useState<TimetableTemplate>(defaultTimetableTemplate);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [grid, setGrid] = useState<PeriodGrid>(() => emptyPeriodGrid(defaultTimetableTemplate));
  const classOptions = classOptionsFromHook;
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const columns = useMemo(() => buildTableColumns(template), [template]);

  useEffect(() => {
    if (!classOptions.length) return;
    setGrade((prev) => (classOptions.includes(prev) ? prev : classOptions[0]));
  }, [classOptions]);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const ref = buildPath(db, "schools", schoolId, "settings", TIMETABLE_TEMPLATE_DOC);
        const snap = await fetchOne(ref);
        const next = snap.exists()
          ? normalizeTimetableTemplate(snap.data())
          : defaultTimetableTemplate;
        setTemplate(next);
        setGrid((prev) => remapPeriodGrid(prev, next));
      } catch {
        setTemplate(defaultTimetableTemplate);
      }
    }
    loadTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    async function loadTeachers() {
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "teaching_staff"));
        const names = snap.docs.map((d: any) => teacherName(d.data())).filter(Boolean);
        setTeacherOptions(Array.from(new Set(names)).sort((a: any, b: any) => a.localeCompare(b)));
      } catch {
        setTeacherOptions([]);
      }
    }
    loadTeachers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      if (!grade || !section) {
        setSubjectOptions([]);
        return;
      }
      try {
        const snap = await fetchMany(buildPath(db, "schools", schoolId, "subjects"));
        const names = snap.docs
          .map((d: any) => d.data())
          .filter(
            (s) =>
              String(s.classId ?? "").trim() === grade &&
              String(s.section ?? "").trim().toUpperCase() === section
          )
          .map((s) => String(s.name ?? "").trim())
          .filter(Boolean);
        setSubjectOptions(Array.from(new Set(names)).sort((a: any, b: any) => a.localeCompare(b)));
      } catch {
        setSubjectOptions([]);
      }
    }
    loadSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, section]);

  const loadSchedule = useCallback(async () => {
    if (!grade || !section) {
      setGrid(emptyPeriodGrid(template));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const ref = buildPath(db, "schools", schoolId, "timetables", timetableDocId(DEFAULT_TERM_KEY, grade, section));
      const snap = await fetchOne(ref);
      if (!snap.exists()) {
        setGrid(emptyPeriodGrid(template));
        return;
      }
      const data = snap.data();
      setGrid(normalizePeriodGrid(data?.periodGrid ?? data?.timetable, template));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load timetable");
      setGrid(emptyPeriodGrid(template));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, section, template]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const updateCell = (day: TimetableDay, periodId: string, entries: PeriodEntry[]) => {
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [periodId]: entries },
    }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!grade || !section) return;
    setIsSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const ref = buildPath(db, "schools", schoolId, "timetables", timetableDocId(DEFAULT_TERM_KEY, grade, section));
      await upsertData(
        ref,
        {
          scope: "term",
          key: DEFAULT_TERM_KEY,
          grade,
          section,
          periodGrid: grid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveMessage("Saved");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async (next: TimetableTemplate) => {
    setIsSavingTemplate(true);
    setError(null);
    try {
      const ref = buildPath(db, "schools", schoolId, "settings", TIMETABLE_TEMPLATE_DOC);
      await upsertData(ref, { ...next, updatedAt: new Date().toISOString() }, { merge: true });
      setTemplate(next);
      setGrid((prev) => remapPeriodGrid(prev, next));
      setTemplateOpen(false);
      setSaveMessage("Template updated");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const filterCls =
    "h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={cn(filterCls, "w-[130px]")}>
            {classOptions.map((g) => (
              <option key={g} value={g}>{gradeLabel(g)}</option>
            ))}
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!grade}
            className={cn(filterCls, "w-[90px] disabled:opacity-60")}
          >
            {sectionOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs font-semibold text-gray-400 hidden sm:inline">·</span>
          <span className="text-xs font-semibold text-gray-500">{DEFAULT_TERM_KEY}</span>

          <div className="flex-1" />

          {saveMessage ? (
            <span className="text-xs font-bold text-emerald-600">{saveMessage}</span>
          ) : null}
          {error ? (
            <span className="text-xs font-bold text-red-600">{error}</span>
          ) : null}

          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30 transition-colors"
          >
            <Settings2 size={14} />
            Template
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !grade || !section}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60 transition-all"
          >
            {isSaving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>

        <div className="relative overflow-x-auto">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <RotateCw size={18} className="animate-spin text-[#144835]" />
            </div>
          ) : null}

          <table className="w-full min-w-[960px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#144835] text-white">
                <th className="sticky left-0 z-20 bg-[#144835] px-3 py-2.5 text-left font-bold w-[88px] border-r border-white/10">
                  Day
                </th>
                {columns.map((col) =>
                  col.type === "period" ? (
                    <th
                      key={columnKey(col)}
                      className="px-2 py-2.5 text-center font-bold border-r border-white/10 min-w-[200px]"
                    >
                      <div>{col.period.label}</div>
                      <div className="text-[10px] font-medium text-white/65 mt-0.5">
                        {formatTimeRange(col.period.startTime, col.period.endTime)}
                      </div>
                    </th>
                  ) : (
                    <th
                      key={columnKey(col)}
                      className="px-1 py-2.5 text-center font-bold bg-[#0f3a2b] border-r border-white/10 w-[52px] min-w-[52px]"
                    >
                      <Coffee size={14} className="mx-auto text-amber-200" />
                      <div className="text-[9px] font-semibold text-amber-100/80 mt-1 leading-tight">
                        {formatTimeRange(col.break.startTime, col.break.endTime)}
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {timetableDays.map((day, i) => (
                <tr key={day} className={cn("border-t border-gray-100", i % 2 === 1 && "bg-gray-50/50")}>
                  <td className="sticky left-0 z-10 px-3 py-2 font-bold text-gray-700 bg-inherit border-r border-gray-100">
                    {day.slice(0, 3)}
                  </td>
                  {columns.map((col) =>
                    col.type === "period" ? (
                      <td key={columnKey(col)} className="px-2 py-2 align-top border-r border-gray-100">
                        <PeriodCell
                          entries={grid[day]?.[col.period.id] ?? [emptyPeriodEntry()]}
                          subjectOptions={subjectOptions}
                          teacherOptions={teacherOptions}
                          onChange={(next) => updateCell(day, col.period.id, next)}
                        />
                      </td>
                    ) : (
                      <td
                        key={columnKey(col)}
                        className="px-1 py-2 text-center align-middle bg-amber-50/50 border-r border-amber-100"
                      >
                        <span className="text-[9px] font-bold text-amber-700 leading-tight block">
                          {col.break.label}
                        </span>
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TimetableTemplatePanel
        open={templateOpen}
        template={template}
        isSaving={isSavingTemplate}
        onClose={() => setTemplateOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
