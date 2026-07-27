"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock4, RotateCw } from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

type ActivityRow = {
  id: string;
  date: string;
  module: string;
  message: string;
  user: string;
};

type Props = {
  schoolId: string;
  studentId: string;
  academicYear?: string | null;
};

function moduleTone(module: string) {
  const m = module.toLowerCase();
  if (m.includes("transport")) return "bg-sky-50 text-sky-700";
  if (m.includes("discount")) return "bg-amber-50 text-amber-700";
  if (m.includes("detail")) return "bg-indigo-50 text-indigo-700";
  if (m.includes("fee") || m.includes("transaction") || m.includes("payment")) {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-gray-100 text-gray-600";
}

export default function StudentActivityLogPanel({ schoolId, studentId, academicYear }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityRow[]>([]);

  const load = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      const res = await adminFetch(
        `/api/admin/students/${encodeURIComponent(studentId)}/activity?${params}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load activity log");
      setRows(Array.isArray(data.activities) ? data.activities : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, academicYear]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Activity Log</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">
            Fee payments, discounts, fee detail changes and transport fee activity
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center"
          title="Refresh"
        >
          <RotateCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
                  #
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Date & Time
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Module
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Activity Details
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">
                  Changed By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows rows={6} columns={5} />
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide"
                  >
                    No Activity Logs Found
                  </td>
                </tr>
              ) : (
                rows.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Clock4 size={12} /> {log.date || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${moduleTone(
                          log.module
                        )}`}
                      >
                        {log.module || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[420px]">
                      <p className="text-xs font-medium text-gray-800 leading-snug">{log.message}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-bold text-[#144835] uppercase tracking-wider">
                        {log.user || "System"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
