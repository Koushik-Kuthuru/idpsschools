"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RotateCw, Search, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import StudentsSectionNav from "@/components/admin/students/StudentsSectionNav";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { adminFetch } from "@/lib/adminApi";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

type Member = {
  admissionNo: string;
  name?: string;
  className?: string;
  section?: string;
  fatherName?: string;
};

type Group = {
  sr: number;
  fatherName?: string;
  members: Member[];
};

type FlatRow = {
  key: string;
  sr: number;
  showSr: boolean;
  groupIndex: number;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  fatherName: string;
};

export default function AdminSiblingsReportView() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!currentYear?.name) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId, academicYear: currentYear.name });
      const res = await adminFetch(`/api/admin/siblings?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load siblings");
      setGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch (err) {
      setGroups([]);
      setError(err instanceof Error ? err.message : "Failed to load siblings");
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = [...groups].sort((a, b) => a.sr - b.sr);
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((g) => {
      const hay = [
        String(g.sr),
        g.fatherName,
        ...g.members.map(
          (m) => `${m.admissionNo} ${m.name} ${m.className} ${m.section} ${m.fatherName}`
        ),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [groups, query]);

  const rows = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];
    filtered.forEach((g, groupIndex) => {
      g.members.forEach((m, memberIndex) => {
        out.push({
          key: `${g.sr}-${m.admissionNo}-${memberIndex}`,
          sr: g.sr,
          showSr: memberIndex === 0,
          groupIndex,
          admissionNo: m.admissionNo,
          name: m.name || "",
          className: m.className || "",
          section: m.section || "",
          fatherName: m.fatherName || g.fatherName || "",
        });
      });
    });
    return out;
  }, [filtered]);

  const memberCount = rows.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Sibling Report"
        description={
          currentYear?.name
            ? `AccEvate sibling report for ${currentYear.name}`
            : "Sibling groups"
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
              data={rows.map((r) => ({
                SR: r.showSr ? r.sr : "",
                "ADM NO": r.admissionNo,
                "STUDENT NAME": r.name,
                CLASS: r.className,
                SEC: r.section,
                "FATHER NAME": r.fatherName,
              }))}
              filename={`siblings-${currentYear?.name ?? "all"}`}
            />
          </div>
        }
      />

      <StudentsSectionNav schoolId={schoolId} active="siblings" />

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Groups</p>
          <p className="text-lg font-extrabold text-[#144835] mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Students</p>
          <p className="text-lg font-extrabold text-[#144835] mt-1">{memberCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SR, father, student, admission…"
              className="w-full h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-rose-400 mb-2" size={28} />
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : loading ? (
          <SkeletonTable rows={8} columns={6} showHeader={false} className="rounded-none border-0" />
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">No sibling groups found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-xs border-collapse">
              <thead>
                <tr className="bg-[#144835] text-white">
                  <th className="text-left font-bold px-3 py-2.5 w-14">SR</th>
                  <th className="text-left font-bold px-3 py-2.5 w-24">ADM NO</th>
                  <th className="text-left font-bold px-3 py-2.5">STUDENT NAME</th>
                  <th className="text-left font-bold px-3 py-2.5 w-28">CLASS</th>
                  <th className="text-left font-bold px-3 py-2.5 w-40">SEC</th>
                  <th className="text-left font-bold px-3 py-2.5">FATHER NAME</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className={
                      r.groupIndex % 2 === 0
                        ? "bg-white border-b border-gray-100"
                        : "bg-slate-50/80 border-b border-gray-100"
                    }
                  >
                    <td className="px-3 py-2 font-extrabold text-[#144835] align-top">
                      {r.showSr ? r.sr : ""}
                    </td>
                    <td className="px-3 py-2 font-bold text-gray-800 align-top">{r.admissionNo}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900 align-top">{r.name || "—"}</td>
                    <td className="px-3 py-2 text-gray-700 align-top">{r.className || "—"}</td>
                    <td className="px-3 py-2 text-gray-700 align-top">{r.section || "—"}</td>
                    <td className="px-3 py-2 text-gray-700 align-top">{r.fatherName || "—"}</td>
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
