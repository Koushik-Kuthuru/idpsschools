"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, Search } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function MessBillingView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Paid" | "Partial" | "Pending">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      const res = await adminFetch(`/api/admin/hostel/students?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load billing");
      setStudents((data.students ?? []) as BranchHostelStudentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    return students.map((student) => {
      const messCharges = student.foodFeeTotal + student.laundryFeeTotal;
      const paidShare =
        student.hostelFeeTotal + student.foodFeeTotal + student.laundryFeeTotal > 0
          ? Math.min(
              student.hostelFeePaid,
              messCharges
            )
          : student.hostelFeePaid;
      const pending = Math.max(messCharges - paidShare, 0);
      const status: "Paid" | "Partial" | "Pending" =
        messCharges <= 0
          ? "Pending"
          : paidShare <= 0
            ? "Pending"
            : paidShare >= messCharges
              ? "Paid"
              : "Partial";
      return { student, messCharges, paidShare, pending, status };
    });
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const s = row.student;
      return [s.name, s.className, s.section, s.admissionNo, s.fatherName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    let food = 0;
    let laundry = 0;
    let paid = 0;
    let pending = 0;
    for (const row of rows) {
      food += row.student.foodFeeTotal;
      laundry += row.student.laundryFeeTotal;
      paid += row.paidShare;
      pending += row.pending;
    }
    return { food, laundry, paid, pending, charges: food + laundry };
  }, [rows]);

  const statusClass = (status: "Paid" | "Partial" | "Pending") => {
    if (status === "Paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Partial") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Mess Billing"
        description="Mess charges, adjustments, and payment status for boarding students."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Food charges", value: totals.food },
          { label: "Laundry charges", value: totals.laundry },
          { label: "Collected", value: totals.paid },
          { label: "Pending", value: totals.pending },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">{card.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{formatInr(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
        >
          <option value="all">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <Receipt size={12} /> {students.length} accounts
        </span>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={9} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            No mess billing records found for boarding students.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Parent</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Food</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Laundry</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Paid</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Pending</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(({ student, messCharges, paidShare, pending, status }) => (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-extrabold text-gray-900">{student.name}</p>
                      <p className="text-[11px] text-gray-500">{student.admissionNo}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {student.className}-{student.section}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700">{student.fatherName}</p>
                      <p className="text-[11px] text-gray-500">{student.parentPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-right">
                      {formatInr(student.foodFeeTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-right">
                      {formatInr(student.laundryFeeTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-right">
                      {formatInr(messCharges)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-700 text-right">
                      {formatInr(paidShare)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-rose-700 text-right">
                      {formatInr(pending)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusClass(status)}`}
                      >
                        {status}
                      </span>
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
