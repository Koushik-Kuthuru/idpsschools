"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
;
import { ArrowLeft, Save, ShoppingCart, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewPurchaseOrderPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 no: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
 vendor: "",
 date: new Date().toISOString().split('T')[0],
 amount: 0,
 status: "Pending" as "Pending" | "Approved" | "Delivered",
 items: 1,
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: (name === "amount" || name === "items") ? Number(value) : value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const payload = {
 ...form,
 createdAt: serverTimestamp(),
 };
 await setDoc(doc(db, "schools", schoolId, "purchase_orders", form.no), payload);
 router.push(`/schools/${schoolId}/admin/inventory/purchase-orders`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <SafeLink 
 href={`/schools/${schoolId}/admin/inventory/purchase-orders`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </SafeLink>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">New Purchase Order</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Create a new purchase order for vendors</p>
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
 <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
 <ShoppingCart size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">PO Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Vendor and order information</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Vendor Name <span className="text-rose-500">*</span></label>
 <input
 name="vendor"
 required
 placeholder="e.g. ABC Suppliers"
 value={form.vendor}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Order Date</label>
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
 <label className="text-xs font-bold text-gray-700">Total Items <span className="text-rose-500">*</span></label>
 <input
 name="items"
 type="number"
 min="1"
 required
 value={form.items}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Total Amount (₹) <span className="text-rose-500">*</span></label>
 <input
 name="amount"
 type="number"
 min="0"
 required
 value={form.amount}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <Info size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Tracking</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Order status</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
 <option value="Delivered">Delivered</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <SafeLink
 href={`/schools/${schoolId}/admin/inventory/purchase-orders`}
 className="h-9 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 flex items-center transition-colors shadow-sm"
 >
 Cancel
 </SafeLink>
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
 Save Order
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
