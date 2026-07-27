"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RotateCw, Search, User } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonList, SkeletonMatrix } from "@/components/ui/Skeleton";
import TimetableGridTable from "@/components/admin/timetable/TimetableGridTable";
import { useTeacherTimetable } from "@/components/admin/timetable/useTimetableData";
import { adminFetch } from "@/lib/adminApi";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

type TeacherRow = {
  teacherName: string;
  totalPeriods?: number;
  dayLoads?: Record<string, number>;
  summary: { classLabel: string; subject: string; periodCount: number }[];
};

export default function AdminTeacherTimetablesView() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("");

  const load = useCallback(async () => {
    if (!currentYear?.name) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId, academicYear: currentYear.name });
      const res = await adminFetch(`/api/admin/teacher-timetables?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load teacher timetables");
      const list = Array.isArray(data.teachers) ? data.teachers : [];
      setTeachers(list);
      setSelected((prev) => {
        if (prev && list.some((t: TeacherRow) => t.teacherName === prev)) return prev;
        return list[0]?.teacherName || "";
      });
    } catch (err) {
      setTeachers([]);
      setError(err instanceof Error ? err.message : "Failed to load teacher timetables");
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.teacherName.toLowerCase().includes(q));
  }, [teachers, query]);

  const active = filtered.find((t) => t.teacherName === selected) || filtered[0] || null;
  const activeName = active?.teacherName || "";

  const {
    grid,
    subject,
    template,
    loading: gridLoading,
    term,
  } = useTeacherTimetable(schoolId, activeName);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Teacher Timetables"
        description={
          currentYear?.name
            ? `Weekly teacher schedules for ${currentYear.name}`
            : "Teacher timetable summaries"
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <ExportButton
              data={filtered.flatMap((t) =>
                (t.summary || []).map((s) => ({
                  Teacher: t.teacherName,
                  Class: s.classLabel,
                  Subject: s.subject,
                  Periods: s.periodCount,
                  Total: t.totalPeriods ?? "",
                }))
              )}
              filename={`teacher-timetables-${currentYear?.name ?? "all"}`}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teacher…"
                className="w-full h-9 rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-semibold"
              />
            </div>
          </div>
          <div className="max-h-[640px] overflow-y-auto divide-y divide-gray-50">
            {loading && teachers.length === 0 ? (
              <SkeletonList rows={8} avatar={false} />
            ) : null}
            {filtered.map((t) => (
              <button
                key={t.teacherName}
                type="button"
                onClick={() => setSelected(t.teacherName)}
                className={`w-full text-left px-4 py-3 text-xs hover:bg-gray-50 ${
                  active?.teacherName === t.teacherName ? "bg-[#144835]/5" : ""
                }`}
              >
                <p className="font-bold text-gray-900">{t.teacherName}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                  {t.totalPeriods ?? 0} periods · {(t.summary || []).length} classes
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto text-rose-400 mb-2" size={28} />
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          ) : loading ? (
            <div className="p-5">
              <SkeletonMatrix rows={7} columns={6} className="border-0" />
            </div>
          ) : !active ? (
            <div className="p-12 text-center">
              <User className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm font-bold text-gray-500">No teacher timetables found</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{active.teacherName}</h2>
                  <p className="text-xs font-semibold text-gray-500 mt-1">
                    Total {active.totalPeriods ?? 0} periods
                    {subject ? ` · ${subject}` : ""}
                    {term ? ` · ${term}` : ""}
                  </p>
                </div>
                {active.dayLoads && Object.keys(active.dayLoads).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(active.dayLoads).map(([day, n]) => (
                      <span
                        key={day}
                        className="inline-flex px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-700"
                      >
                        {day.slice(0, 3)} · {n}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                  Weekly schedule
                </p>
                {gridLoading ? (
                  <SkeletonMatrix rows={7} columns={6} className="border-0" />
                ) : (
                  <TimetableGridTable
                    grid={grid}
                    template={template}
                    showTeachers={false}
                    emptyMessage={`No period grid found for ${active.teacherName} (${term}).`}
                  />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                  Class / subject load
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                        <th className="px-3 py-2 text-left">Class</th>
                        <th className="px-3 py-2 text-left">Subject</th>
                        <th className="px-3 py-2 text-right">Periods</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(active.summary || []).map((s, i) => (
                        <tr key={`${s.classLabel}-${s.subject}-${i}`}>
                          <td className="px-3 py-2 font-bold text-gray-900">{s.classLabel}</td>
                          <td className="px-3 py-2 font-semibold text-gray-600">{s.subject}</td>
                          <td className="px-3 py-2 text-right font-extrabold text-[#144835]">
                            {s.periodCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
