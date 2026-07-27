"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RotateCw, Save, Search, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";
import type {
  MessAttendanceEntry,
  MessAttendanceStatus,
  MessMealType,
} from "@/lib/messStore";

const MEALS: { id: MessMealType; label: string }[] = [
  { id: "breakfast", label: "Morning Breakfast" },
  { id: "lunch", label: "Afternoon Lunch" },
  { id: "snacks", label: "Evening Snacks" },
  { id: "dinner", label: "Night Dinner" },
];

const STATUS_OPTIONS: { id: MessAttendanceStatus; label: string; className: string }[] = [
  { id: "present", label: "Present", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "absent", label: "Absent", className: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "leave", label: "Leave", className: "bg-amber-50 text-amber-700 border-amber-200" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function MessAttendanceView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [date, setDate] = useState(todayIso);
  const [meal, setMeal] = useState<MessMealType>("lunch");
  const [entries, setEntries] = useState<Record<string, MessAttendanceStatus>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    const params = new URLSearchParams({ schoolId });
    if (academicYear) params.set("academicYear", academicYear);
    const res = await adminFetch(`/api/admin/hostel/students?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to load students");
    setStudents((data.students ?? []) as BranchHostelStudentRow[]);
  }, [schoolId, academicYear]);

  const loadAttendance = useCallback(async () => {
    const params = new URLSearchParams({ schoolId, date, meal });
    const res = await adminFetch(`/api/admin/mess/attendance?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to load attendance");
    const map: Record<string, MessAttendanceStatus> = {};
    for (const entry of (data.attendance?.entries ?? []) as MessAttendanceEntry[]) {
      map[entry.studentId] = entry.status;
    }
    setEntries(map);
  }, [schoolId, date, meal]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadStudents(), loadAttendance()]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadStudents, loadAttendance]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      [student.name, student.className, student.section, student.admissionNo, student.roomNo]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [students, search]);

  const counts = useMemo(() => {
    const result = { present: 0, absent: 0, leave: 0 };
    for (const student of students) {
      const status = entries[student.id] ?? "present";
      result[status] += 1;
    }
    return result;
  }, [students, entries]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payloadEntries: MessAttendanceEntry[] = students.map((student) => ({
        studentId: student.id,
        status: entries[student.id] ?? "present",
      }));
      const res = await adminFetch("/api/admin/mess/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, date, meal, entries: payloadEntries }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMessage("Meal attendance saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Mess Attendance"
        description="Track attendance for morning breakfast, afternoon lunch, evening snacks, and night dinner."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Attendance
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
        />
        <select
          value={meal}
          onChange={(e) => setMeal(e.target.value as MessMealType)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
        >
          {MEALS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const next: Record<string, MessAttendanceStatus> = {};
            for (const student of students) next[student.id] = "present";
            setEntries(next);
          }}
          className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700"
        >
          Mark all present
        </button>
        {message ? <span className="text-xs font-bold text-emerald-600">{message}</span> : null}
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <Users size={12} /> {students.length} boarders
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
          {counts.present} present
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-xs font-bold text-rose-700">
          {counts.absent} absent
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
          {counts.leave} leave
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={4} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            No boarding students found for meal attendance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Room</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-extrabold text-gray-900">{student.name}</p>
                      <p className="text-[11px] text-gray-500">{student.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {student.className}-{student.section}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {student.block !== "—" ? `${student.block} / ` : ""}
                      {student.roomNo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {STATUS_OPTIONS.map((option) => {
                          const active = (entries[student.id] ?? "present") === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                setEntries((prev) => ({ ...prev, [student.id]: option.id }))
                              }
                              className={`h-7 px-2 rounded-md border text-[10px] font-bold ${
                                active ? option.className : "bg-white text-gray-500 border-gray-200"
                              }`}
                            >
                              {active ? <CheckCircle2 size={10} className="inline mr-1" /> : null}
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
