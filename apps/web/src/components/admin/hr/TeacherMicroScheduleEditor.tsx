"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ArrowLeft,
  BookOpen,
  CalendarRange,
  ChevronDown,
  Pencil,
  Plus,
  Printer,
  RotateCw,
  Save,
  Search,
  Trash2,
  UserSquare2,
} from "lucide-react";
import { gradesMatchForClass } from "@/lib/gradeOrder";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useBranchClassOptions } from "@/hooks/useBranchClassOptions";
import { useTimetableTermKey } from "@/components/admin/timetable/useTimetableTermKey";
import { SkeletonCard, SkeletonForm, SkeletonMatrix } from "@/components/ui/Skeleton";
import type { MicroScheduleRow } from "@/lib/microScheduleStore";
import { emptyMicroScheduleRow } from "@/lib/microScheduleStore";
import type { BranchMicroScheduleRecord } from "@/lib/loadBranchMicroSchedules";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fieldCls =
  "h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

const cellCls =
  "w-full min-w-[120px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#144835]/30 focus:border-[#144835]";

type StaffTeacherOption = {
  name: string;
  mobile: string;
};

function staffTeacherName(data: Record<string, unknown>) {
  const first = String(data.firstName ?? "").trim();
  const last = String(data.lastName ?? "").trim();
  return (
    `${first} ${last}`.trim() ||
    String(data.name ?? "").trim() ||
    String(data.employeeId ?? data.employee_id ?? "").trim()
  );
}

function staffTeacherMobile(data: Record<string, unknown>) {
  return String(data.mobile ?? data.phone ?? "").trim();
}

function SearchableTeacherSelect({
  value,
  options,
  onSelect,
  placeholder = "Search teacher…",
}: {
  value: string;
  options: StaffTeacherOption[];
  onSelect: (teacher: StaffTeacherOption) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(q) || option.mobile.includes(q)
    );
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative mt-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            const typed = query.trim();
            if (!typed) {
              onSelect({ name: "", mobile: "" });
              return;
            }
            const match =
              options.find((option) => option.name.toLowerCase() === typed.toLowerCase()) ??
              options.find((option) => option.name.toLowerCase().includes(typed.toLowerCase()));
            if (match) {
              onSelect(match);
              setQuery(match.name);
            } else {
              onSelect({ name: typed, mobile: "" });
            }
          }}
          placeholder={placeholder}
          className={cn(fieldCls, "w-full pl-8 pr-8")}
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-gray-500">No teachers found</p>
          ) : (
            filtered.map((option) => (
              <button
                key={`${option.name}-${option.mobile}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(option);
                  setQuery(option.name);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-[#144835]/5 transition-colors",
                  option.name === value ? "bg-[#144835]/5" : ""
                )}
              >
                <p className="text-xs font-bold text-gray-800">{option.name}</p>
                {option.mobile ? (
                  <p className="text-[10px] text-gray-500">{option.mobile}</p>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function weekdayName(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/** Build one row per calendar day between from/to, keeping existing topics/activities by date. */
function buildRowsForDateRange(
  fromDate: string,
  toDate: string,
  existingRows: MicroScheduleRow[] = []
): MicroScheduleRow[] {
  const from = String(fromDate ?? "").trim();
  const to = String(toDate ?? "").trim();
  if (!from || !to) return existingRows;

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return existingRows;
  }

  const byDate = new Map<string, MicroScheduleRow>();
  for (const row of existingRows) {
    const key = String(row.date ?? "").trim();
    if (key) byDate.set(key, row);
  }

  const rows: MicroScheduleRow[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = toIsoDate(cursor);
    const day = weekdayName(cursor);
    const existing = byDate.get(date);
    const isSunday = cursor.getDay() === 0;

    rows.push({
      date,
      day,
      periods: existing?.periods ?? (isSunday ? null : 1),
      board: existing?.board ?? "",
      topics: existing?.topics ?? (isSunday ? "Sunday" : ""),
      activity: existing?.activity ?? "",
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

function classLabel(schedule: BranchMicroScheduleRecord) {
  const grade = String(schedule.grade ?? "").trim();
  const section = String(schedule.section ?? "").trim();
  if (grade && section) return `${grade}-${section}`;
  return grade || section || "—";
}

function scheduleHeaderTitle(doc: BranchMicroScheduleRecord) {
  const board = doc.board || "CBSE";
  const from = doc.fromDate ? formatDisplayDate(doc.fromDate) : "";
  const to = doc.toDate ? formatDisplayDate(doc.toDate) : "";
  if (from && to) return `${board} Micro Schedule from ${from} to ${to}`;
  return doc.title || `${board} Micro Schedule`;
}

function emptyDoc(termKey: string): BranchMicroScheduleRecord {
  return {
    id: "",
    label: "",
    teacherName: "",
    mobile: "",
    grade: "",
    section: "",
    subject: "",
    board: "CBSE",
    fromDate: "",
    toDate: "",
    termKey,
    title: "",
    rows: [],
  };
}

function MicroSchedulePrintable({ doc }: { doc: BranchMicroScheduleRecord }) {
  const title = scheduleHeaderTitle(doc);
  const rows = doc.rows ?? [];

  return (
    <div className="micro-schedule-print space-y-4">
      <div className="rounded-lg border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 print:border print:bg-white">
        <p className="text-sm font-bold text-[#144835] print:text-black">{title}</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[12px] text-gray-700 print:text-black">
          <p>
            <span className="font-bold">Name of the Teacher:</span> {doc.teacherName || "—"}
          </p>
          <p>
            <span className="font-bold">Class:</span> {classLabel(doc)}
          </p>
          <p>
            <span className="font-bold">Mobile Number:</span> {doc.mobile || "—"}
          </p>
          <p>
            <span className="font-bold">Subject:</span> {doc.subject || "—"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 print:overflow-visible print:border-black">
        <table className="w-full min-w-[900px] border-collapse print:min-w-0 print:text-[11px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-28 print:border print:border-black">
                Date
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-24 print:border print:border-black">
                Day
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-center w-20 print:border print:border-black">
                Periods
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-24 print:border print:border-black">
                Board
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left print:border print:border-black">
                Topics to be Taught
              </th>
              <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-48 print:border print:border-black">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 print:border print:border-black">
                  No day rows yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-2 text-[12px] font-semibold text-gray-800 whitespace-nowrap print:border print:border-black">
                    {row.date ? formatDisplayDate(row.date) : "—"}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-700 print:border print:border-black">
                    {row.day || "—"}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-center text-gray-700 print:border print:border-black">
                    {row.periods ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-700 print:border print:border-black">
                    {row.board || "—"}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-800 whitespace-pre-wrap print:border print:border-black">
                    {row.topics || "—"}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-gray-700 whitespace-pre-wrap print:border print:border-black">
                    {row.activity || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeacherMicroScheduleEditor() {
  const schoolId = useSchoolId();
  const term = useTimetableTermKey(schoolId);
  const { grades, sectionsByClass } = useBranchClassOptions(schoolId);

  const [schedules, setSchedules] = useState<BranchMicroScheduleRecord[]>([]);
  const [staffTeachers, setStaffTeachers] = useState<StaffTeacherOption[]>([]);
  const [classSubjects, setClassSubjects] = useState<string[]>([]);
  const [teacherFilter, setTeacherFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"list" | "view" | "edit">("list");
  const [doc, setDoc] = useState<BranchMicroScheduleRecord>(() => emptyDoc(term));
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const sectionOptions = useMemo(
    () => (doc.grade ? sectionsByClass[doc.grade] ?? [] : []),
    [doc.grade, sectionsByClass]
  );

  const teacherOptions = useMemo(() => {
    const byName = new Map<string, StaffTeacherOption>();
    for (const teacher of staffTeachers) {
      const key = teacher.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, teacher);
    }
    for (const schedule of schedules) {
      const name = String(schedule.teacherName ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, {
          name,
          mobile: String(schedule.mobile ?? "").trim(),
        });
      }
    }
    return Array.from(byName.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [staffTeachers, schedules]);

  const subjectOptions = useMemo(() => {
    const names = [...classSubjects];
    const current = String(doc.subject ?? "").trim();
    if (current && !names.some((name) => name.toLowerCase() === current.toLowerCase())) {
      names.unshift(current);
    }
    return names;
  }, [classSubjects, doc.subject]);

  const headerTitle = useMemo(() => scheduleHeaderTitle(doc), [doc]);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId, termKey: term });
      const res = await adminFetch(`/api/admin/micro-schedules?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load micro schedules");
      setSchedules((data.schedules ?? []) as BranchMicroScheduleRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load micro schedules");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, term]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await fetch(
          `/api/admin/staff?schoolId=${encodeURIComponent(schoolId)}&kind=teaching`
        );
        const data = await res.json().catch(() => ({}));
        const fromApi = Array.isArray(data.staff)
          ? (data.staff as Record<string, unknown>[])
              .map((row) => ({
                name: staffTeacherName(row),
                mobile: staffTeacherMobile(row),
              }))
              .filter((row) => row.name)
          : [];
        setStaffTeachers(fromApi);
      } catch {
        setStaffTeachers([]);
      }
    }
    loadTeachers();
  }, [schoolId]);

  useEffect(() => {
    async function loadSubjectsForClass() {
      const grade = String(doc.grade ?? "").trim();
      const section = String(doc.section ?? "").trim();
      if (!grade || !section) {
        setClassSubjects([]);
        return;
      }

      try {
        const params = new URLSearchParams({ schoolId });
        const res = await adminFetch(`/api/admin/subjects?${params.toString()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setClassSubjects([]);
          return;
        }

        const names = ((data.subjects ?? []) as Record<string, unknown>[])
          .filter((subject) => {
            const subjectGrade = String(subject.classId ?? subject.grade ?? "").trim();
            const subjectSection = String(subject.section ?? "").trim();
            return (
              gradesMatchForClass(subjectGrade, grade) &&
              subjectSection.toUpperCase() === section.toUpperCase()
            );
          })
          .map((subject) => String(subject.name ?? "").trim())
          .filter(Boolean);

        setClassSubjects(
          Array.from(new Set(names)).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" })
          )
        );
      } catch {
        setClassSubjects([]);
      }
    }
    loadSubjectsForClass();
  }, [schoolId, doc.grade, doc.section]);

  const teachersWithSchedules = useMemo(() => {
    const names = schedules
      .map((s) => String(s.teacherName ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const teacher = String(schedule.teacherName ?? "").trim();
      if (teacherFilter !== "All" && teacher.toLowerCase() !== teacherFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const hay = [
        schedule.teacherName,
        schedule.subject,
        schedule.grade,
        schedule.section,
        schedule.mobile,
        schedule.label,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [schedules, teacherFilter, searchQuery]);

  const backToList = () => {
    setMode("list");
    setIsCreating(false);
    setDoc(emptyDoc(term));
    setSaveMessage(null);
    setError(null);
  };

  const backToView = () => {
    if (isCreating || !doc.id) {
      backToList();
      return;
    }
    setMode("view");
    setIsCreating(false);
    setSaveMessage(null);
    setError(null);
  };

  const applyDateRange = (fromDate: string, toDate: string) => {
    setDoc((prev) => {
      const nextFrom = fromDate;
      const nextTo = toDate;
      const rows =
        nextFrom && nextTo
          ? buildRowsForDateRange(nextFrom, nextTo, prev.rows ?? [])
          : prev.rows ?? [];
      return {
        ...prev,
        fromDate: nextFrom,
        toDate: nextTo,
        rows,
      };
    });
    setSaveMessage(null);
  };

  const startCreate = (prefillTeacher = "") => {
    setIsCreating(true);
    setMode("edit");
    setDoc({
      ...emptyDoc(term),
      board: "CBSE",
      teacherName: prefillTeacher || (teacherFilter !== "All" ? teacherFilter : ""),
      rows: [],
    });
    setSaveMessage(null);
    setError(null);
  };

  const openView = async (id: string) => {
    setIsCreating(false);
    setMode("view");
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const params = new URLSearchParams({ schoolId });
      const res = await fetch(
        `/api/admin/micro-schedules/${encodeURIComponent(id)}?${params.toString()}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load micro schedule");
      setDoc(data.schedule as BranchMicroScheduleRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load micro schedule");
      setMode("list");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setIsCreating(false);
    setMode("edit");
    setSaveMessage(null);
    setError(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const updateRow = (index: number, patch: Partial<MicroScheduleRow>) => {
    setDoc((prev) => ({
      ...prev,
      rows: (prev.rows ?? []).map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
    setSaveMessage(null);
  };

  const addRow = () => {
    setDoc((prev) => ({
      ...prev,
      rows: [...(prev.rows ?? []), emptyMicroScheduleRow()],
    }));
  };

  const removeRow = (index: number) => {
    setDoc((prev) => ({
      ...prev,
      rows: (prev.rows ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const payload = {
        schoolId,
        ...doc,
        termKey: term,
        title: headerTitle,
        id: isCreating ? undefined : doc.id,
      };

      const res = await fetch(
        isCreating || !doc.id
          ? "/api/admin/micro-schedules"
          : `/api/admin/micro-schedules/${encodeURIComponent(doc.id)}`,
        {
          method: isCreating || !doc.id ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save micro schedule");

      const saved = data.schedule as BranchMicroScheduleRecord;
      setDoc(saved);
      setIsCreating(false);
      setMode("view");
      setSaveMessage("Micro schedule saved");
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save micro schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doc.id || !confirm("Delete this micro schedule?")) return;
    setSaving(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      const res = await fetch(
        `/api/admin/micro-schedules/${encodeURIComponent(doc.id)}?${params.toString()}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      await refreshList();
      backToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "view") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .micro-schedule-print-root,
            .micro-schedule-print-root * { visibility: visible !important; }
            .micro-schedule-print-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm micro-schedule-print-root">
          <div className="no-print flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={backToList}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30"
            >
              <ArrowLeft size={14} />
              Back to cards
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">{doc.teacherName || "Micro Schedule"}</p>
              <p className="text-[11px] text-gray-500">
                {classLabel(doc)} · {doc.subject || "—"} · {term}
              </p>
            </div>
            {saveMessage ? (
              <span className="text-xs font-bold text-emerald-600">{saveMessage}</span>
            ) : null}
            {error ? <span className="text-xs font-bold text-red-600">{error}</span> : null}
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              type="button"
              onClick={startEdit}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>

          {loading ? (
            <div className="no-print p-4">
              <SkeletonMatrix rows={10} columns={5} />
            </div>
          ) : (
            <div className="p-4">
              <MicroSchedulePrintable doc={doc} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={backToView}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:text-[#144835] hover:border-[#144835]/30"
            >
              <ArrowLeft size={14} />
              {isCreating ? "Back to cards" : "Back to view"}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">
                {isCreating ? "New Micro Schedule" : "Edit Micro Schedule"}
              </p>
              <p className="text-[11px] text-gray-500">
                {doc.teacherName || "Teacher"} · {term}
              </p>
            </div>
            {saveMessage ? (
              <span className="text-xs font-bold text-emerald-600">{saveMessage}</span>
            ) : null}
            {error ? <span className="text-xs font-bold text-red-600">{error}</span> : null}
            {doc.id && !isCreating ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !doc.teacherName || !doc.grade || !doc.subject}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-50"
            >
              {saving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>

          {loading && !isCreating ? (
            <div className="p-4">
              <SkeletonForm fields={8} columns={2} />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Teacher</label>
                  <SearchableTeacherSelect
                    value={doc.teacherName ?? ""}
                    options={teacherOptions}
                    onSelect={(teacher) =>
                      setDoc((prev) => ({
                        ...prev,
                        teacherName: teacher.name,
                        mobile: teacher.mobile,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile</label>
                  <input
                    value={doc.mobile ?? ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Auto-filled from staff"
                    className={cn(fieldCls, "w-full mt-1")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Class</label>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={doc.grade ?? ""}
                      onChange={(e) => {
                        const grade = e.target.value;
                        const section = sectionsByClass[grade]?.[0] ?? "";
                        setDoc((prev) => ({
                          ...prev,
                          grade,
                          section,
                          subject: "",
                        }));
                      }}
                      className={cn(fieldCls, "flex-1")}
                    >
                      <option value="">Grade</option>
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <select
                      value={doc.section ?? ""}
                      onChange={(e) =>
                        setDoc((prev) => ({
                          ...prev,
                          section: e.target.value,
                          subject: "",
                        }))
                      }
                      className={cn(fieldCls, "flex-1")}
                      disabled={!doc.grade}
                    >
                      <option value="">Section</option>
                      {sectionOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label>
                  <select
                    value={doc.subject ?? ""}
                    onChange={(e) => setDoc((prev) => ({ ...prev, subject: e.target.value }))}
                    disabled={!doc.grade || !doc.section}
                    className={cn(fieldCls, "w-full mt-1 disabled:opacity-60")}
                  >
                    <option value="">
                      {!doc.grade || !doc.section
                        ? "Select class first"
                        : subjectOptions.length
                          ? "Select subject"
                          : "No subjects for this class"}
                    </option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Board</label>
                  <input
                    value={doc.board ?? "CBSE"}
                    onChange={(e) => setDoc((prev) => ({ ...prev, board: e.target.value }))}
                    className={cn(fieldCls, "w-full mt-1")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">From date</label>
                  <input
                    type="date"
                    value={doc.fromDate ?? ""}
                    onChange={(e) => applyDateRange(e.target.value, doc.toDate ?? "")}
                    className={cn(fieldCls, "w-full mt-1")}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">To date</label>
                  <input
                    type="date"
                    value={doc.toDate ?? ""}
                    onChange={(e) => applyDateRange(doc.fromDate ?? "", e.target.value)}
                    min={doc.fromDate || undefined}
                    className={cn(fieldCls, "w-full mt-1")}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-[#144835]/15 bg-[#144835]/5 px-4 py-3">
                <p className="text-sm font-bold text-[#144835]">{headerTitle}</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Name of the Teacher: {doc.teacherName || "—"} · Class: {doc.grade}
                  {doc.section ? `-${doc.section}` : ""} · Subject: {doc.subject || "—"}
                </p>
              </div>

              {doc.fromDate && doc.toDate ? (
                <p className="text-[11px] text-gray-500">
                  {(doc.rows ?? []).length} day{(doc.rows ?? []).length === 1 ? "" : "s"} auto-filled
                  from {formatDisplayDate(doc.fromDate)} to {formatDisplayDate(doc.toDate)}. Fill
                  topics and activities below.
                </p>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Select <span className="font-bold">From date</span> and{" "}
                  <span className="font-bold">To date</span> to auto-generate all dates and days in
                  the table.
                </p>
              )}

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-28">
                        Date
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-24">
                        Day
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-center w-20">
                        Periods
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-24">
                        Board
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left">
                        Topics to be Taught
                      </th>
                      <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left w-48">
                        Activity
                      </th>
                      <th className="px-3 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {(doc.rows ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                          No dates yet. Choose From date and To date above.
                        </td>
                      </tr>
                    ) : null}
                    {(doc.rows ?? []).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 align-top">
                        <td className="px-2 py-2">
                          <input
                            type="date"
                            value={row.date ?? ""}
                            onChange={(e) => updateRow(index, { date: e.target.value })}
                            className={cellCls}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.day ?? ""}
                            onChange={(e) => updateRow(index, { day: e.target.value })}
                            placeholder="Monday"
                            className={cellCls}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min={0}
                            value={row.periods ?? ""}
                            onChange={(e) =>
                              updateRow(index, {
                                periods: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className={cn(cellCls, "text-center")}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={row.board ?? ""}
                            onChange={(e) => updateRow(index, { board: e.target.value })}
                            className={cellCls}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={row.topics ?? ""}
                            onChange={(e) => updateRow(index, { topics: e.target.value })}
                            rows={2}
                            className={cn(cellCls, "min-h-[56px]")}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <textarea
                            value={row.activity ?? ""}
                            onChange={(e) => updateRow(index, { activity: e.target.value })}
                            rows={2}
                            className={cn(cellCls, "min-h-[56px]")}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#144835]/30 bg-[#144835]/5 text-xs font-bold text-[#144835] hover:bg-[#144835]/10"
              >
                <Plus size={14} />
                Add Day Row
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="h-8 w-8 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
            <UserSquare2 size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">CBSE Micro Schedule</p>
            <p className="text-[11px] text-gray-500">
              {schedules.length} plan{schedules.length === 1 ? "" : "s"} · {term}
            </p>
          </div>
          <button
            type="button"
            onClick={() => startCreate()}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90 transition-colors"
          >
            <Plus size={14} />
            New Micro Schedule
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Teacher</label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className={cn(fieldCls, "min-w-[200px]")}
            >
              <option value="All">All Teachers</option>
              {teachersWithSchedules.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {teacherOptions
                .filter(
                  (teacher) =>
                    !teachersWithSchedules.some(
                      (t) => t.toLowerCase() === teacher.name.toLowerCase()
                    )
                )
                .map((teacher) => (
                  <option key={`staff-${teacher.name}`} value={teacher.name}>
                    {teacher.name} (no plan yet)
                  </option>
                ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search class or subject…"
              className={cn(fieldCls, "w-full pl-9")}
            />
          </div>

          {teacherFilter !== "All" ? (
            <button
              type="button"
              onClick={() => startCreate(teacherFilter)}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-[#144835]/30 bg-[#144835]/5 text-xs font-bold text-[#144835] hover:bg-[#144835]/10"
            >
              <Plus size={14} />
              Add for {teacherFilter}
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mx-4 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="p-4 min-h-[280px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} lines={4} />
              ))}
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CalendarRange size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-700">No micro schedules found</p>
              <p className="text-xs text-gray-500 mt-1">
                {teacherFilter !== "All"
                  ? `No plans for ${teacherFilter} yet. Create one to get started.`
                  : "Create a new micro schedule or import from Excel."}
              </p>
              <button
                type="button"
                onClick={() => startCreate(teacherFilter !== "All" ? teacherFilter : "")}
                className="mt-4 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90"
              >
                <Plus size={14} />
                New Micro Schedule
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSchedules.map((schedule) => {
                const rows = schedule.rows ?? [];
                const teachingDays = rows.filter((r) => r.topics && r.topics !== "Sunday").length;
                const dateRange =
                  schedule.fromDate && schedule.toDate
                    ? `${formatDisplayDate(schedule.fromDate)} – ${formatDisplayDate(schedule.toDate)}`
                    : `${rows.length} day rows`;

                return (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={() => openView(schedule.id)}
                    className="text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#144835]/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center">
                        <UserSquare2 size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-gray-900 truncate group-hover:text-[#144835]">
                          {schedule.teacherName || "Unnamed teacher"}
                        </p>
                        {schedule.mobile ? (
                          <p className="text-[11px] text-gray-500 mt-0.5">{schedule.mobile}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <BookOpen size={13} className="text-[#144835] shrink-0" />
                        <span className="truncate">{schedule.subject || "No subject"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                          {classLabel(schedule)}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-[#144835]/5 border border-[#144835]/10 px-2 py-0.5 text-[11px] font-bold text-[#144835]">
                          {schedule.board || "CBSE"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <CalendarRange size={12} />
                        {dateRange}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-600">
                        {teachingDays} teaching day{teachingDays === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
