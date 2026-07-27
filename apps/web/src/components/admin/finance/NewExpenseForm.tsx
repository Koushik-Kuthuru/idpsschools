"use client";

import { adminFetch } from "@/lib/adminApi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useSchoolId } from "@/hooks/useSchoolId";
import { EXPENSE_CATEGORIES } from "@/lib/expenseStore";

const SafeLink = Link as any;

export default function NewExpenseForm() {
  const router = useRouter();
  const schoolId = useSchoolId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
    category: "Mess",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    status: "Pending" as "Pending" | "Approved" | "Paid",
    vendor: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "amount" ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (form.amount <= 0) throw new Error("Amount must be greater than 0");
      if (!form.description.trim()) throw new Error("Description is required");

      const res = await adminFetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          id: form.id,
          category: form.category,
          title: form.description.trim(),
          amount: form.amount,
          date: form.date,
          status: form.status,
          vendor: form.vendor.trim(),
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save expense");

      router.push(`/schools/${schoolId}/admin/finance/expenses`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
      <div className="flex items-center gap-4 mb-6">
        <SafeLink
          href={`/schools/${schoolId}/admin/finance/expenses`}
          className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} />
        </SafeLink>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Add New Expense</h1>
          <p className="text-xs font-bold text-gray-500 mt-1">
            Record mess, hostel, staff, academic, transport and other expenses
          </p>
        </div>
      </div>

      {error ? (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Expense Details</h2>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              Categorize by Mess, Hostel, Staff, and more
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                required
                value={form.category}
                onChange={handleChange}
                className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Amount <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  ₹
                </span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  required
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">
                Description <span className="text-rose-500">*</span>
              </label>
              <input
                name="description"
                required
                placeholder="e.g. Mess grocery purchase, Hostel maintenance, Staff advance"
                value={form.description}
                onChange={handleChange}
                className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Vendor / Payee</label>
              <input
                name="vendor"
                placeholder="e.g. Local vendor, Staff name, Utility board"
                value={form.vendor}
                onChange={handleChange}
                className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                name="date"
                type="date"
                required
                value={form.date}
                onChange={handleChange}
                className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Optional notes"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <SafeLink
            href={`/schools/${schoolId}/admin/finance/expenses`}
            className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
          >
            Cancel
          </SafeLink>
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-6 bg-[#144835] text-white font-bold rounded-lg hover:bg-[#144835]/90 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Save Expense
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
