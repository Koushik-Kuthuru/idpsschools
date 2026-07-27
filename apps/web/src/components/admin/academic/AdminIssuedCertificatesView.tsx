"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, RotateCw, Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { adminFetch } from "@/lib/adminApi";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CertRow = {
  kind: string;
  certNo: string;
  admissionNo: string;
  studentName?: string;
  fatherName?: string;
  classLabel?: string;
  issuedOn?: string;
};

function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN");
}

export default function AdminIssuedCertificatesView() {
  const schoolId = useSchoolId();
  const { currentYear } = useAcademicYear();
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");

  const load = useCallback(async () => {
    if (!currentYear?.name) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId, academicYear: currentYear.name, kind: "all" });
      const res = await adminFetch(`/api/admin/issued-certificates?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load certificates");
      setRows(Array.isArray(data.certificates) ? data.certificates : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }, [schoolId, currentYear?.name]);

  useEffect(() => {
    void load();
  }, [load]);

  const kinds = useMemo(() => {
    const set = new Set(rows.map((r) => r.kind).filter(Boolean));
    return ["all", ...[...set].sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.kind.toLowerCase() !== kind.toLowerCase()) return false;
      if (!q) return true;
      return (
        r.certNo.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        String(r.studentName ?? "").toLowerCase().includes(q) ||
        String(r.fatherName ?? "").toLowerCase().includes(q) ||
        String(r.classLabel ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, kind]);

  const byKindCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) map[r.kind] = (map[r.kind] || 0) + 1;
    return map;
  }, [rows]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1400px] mx-auto">
      <AdminPageHeader
        title="Issued Certificates"
        description={
          currentYear?.name
            ? `Birth, Study, Character & Fee certificates issued in ${currentYear.name}`
            : "Issued certificates"
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
              data={filtered.map((r) => ({
                Kind: r.kind,
                CertNo: r.certNo,
                Admission: r.admissionNo,
                Student: r.studentName || "",
                Father: r.fatherName || "",
                Class: r.classLabel || "",
                IssuedOn: r.issuedOn || "",
              }))}
              filename={`issued-certificates-${currentYear?.name ?? "all"}`}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Total issued</p>
          <p className="text-lg font-extrabold text-[#144835] mt-1">{rows.length}</p>
        </div>
        {Object.entries(byKindCounts).map(([k, n]) => (
          <div key={k} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{k}</p>
            <p className="text-lg font-extrabold text-gray-800 mt-1">{n}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cert no, admission, student…"
              className="w-full h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
            />
          </div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-700 bg-white"
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k === "all" ? "All kinds" : k}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-rose-400 mb-2" size={28} />
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        ) : loading ? (
          <SkeletonTable rows={8} columns={5} showHeader={false} className="rounded-none border-0" />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-sm font-bold text-gray-500">No issued certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Kind</th>
                  <th className="px-4 py-3">Cert No</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r, idx) => (
                  <tr key={`${r.kind}-${r.certNo}-${r.admissionNo}-${idx}`} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      {formatDisplayDate(r.issuedOn || "")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}
                      >
                        {r.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-700">{r.certNo || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900">{r.studentName || "—"}</p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">Adm. {r.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-600">{r.classLabel || "—"}</td>
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
