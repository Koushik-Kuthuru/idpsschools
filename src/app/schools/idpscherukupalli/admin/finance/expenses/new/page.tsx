"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Receipt, IndianRupee } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewExpensePage() {
 const router = useRouter();
 const schoolId = "idpscherukupalli";
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: `EXP-${Math.floor(1000 + Math.random() * 9000)}`,
 category: "Operations",
 description: "",
 amount: 0,
 date: new Date().toISOString().split('T')[0],
 status: "Pending" as "Pending" | "Approved" | "Paid",
 vendor: "",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: name === "amount" ? Number(value) : value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 if (form.amount <= 0) {
 throw new Error("Amount must be greater than 0");
 }

 const payload = {
 id: form.id,
 category: form.category,
 title: form.description,
 amount: form.amount,
 date: form.date,
 status: form.status,
 vendor: form.vendor,
 createdAt: serverTimestamp(),
 };

 await setDoc(doc(db, "schools", schoolId, "expenses", form.id), payload);
 
 router.push(`/schools/${schoolId}/admin/finance/expenses`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/finance/expenses`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add New Expense</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Record an outgoing payment or expense</p>
 </div>
 </div>

 {error && (
 <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-bold flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
 <Receipt size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Expense Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Categorize and describe the expense</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Category <span className="text-rose-500">*</span></label>
 <select
 name="category"
 required
 value={form.category}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Operations">Operations</option>
 <option value="Maintenance">Maintenance</option>
 <option value="Utilities">Utilities</option>
 <option value="Salaries">Salaries</option>
 <option value="Marketing">Marketing</option>
 <option value="Supplies">Supplies</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Amount <span className="text-rose-500">*</span></label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
 <input
 name="amount"
 type="number"
 min="0"
 required
 value={form.amount}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg pl-8 pr-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-xs font-bold text-gray-700">Description <span className="text-rose-500">*</span></label>
 <input
 name="description"
 required
 placeholder="e.g. Monthly electricity bill"
 value={form.description}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Vendor / Payee</label>
 <input
 name="vendor"
 placeholder="e.g. State Electricity Board"
 value={form.vendor}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Date <span className="text-rose-500">*</span></label>
 <input
 name="date"
 type="date"
 required
 value={form.date}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Status</label>
 <select
 name="status"
 value={form.status}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Pending">Pending</option>
 <option value="Approved">Approved</option>
 <option value="Paid">Paid</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/finance/expenses`}
 className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
 >
 Cancel
 </Link>
 <button
 type="submit"
 disabled={loading}
 className="h-9 px-6 bg-[#144835] text-white font-bold rounded-lg hover:bg-[#144835]/90 flex items-center gap-2 transition-colors shadow-sm shadow-[#144835]/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
