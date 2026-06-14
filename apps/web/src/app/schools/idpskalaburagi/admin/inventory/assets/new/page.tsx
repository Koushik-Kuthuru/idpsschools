"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, Tag } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewAssetPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
 name: "",
 category: "Electronics",
 status: "Active" as "Active" | "Maintenance" | "Retired",
 department: "",
 location: "",
 purchaseDate: new Date().toISOString().split('T')[0],
 value: 0,
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: name === "value" ? Number(value) : value }));
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
 await setDoc(doc(db, "schools", schoolId, "assets", form.id), payload);
 router.push(`/schools/${schoolId}/admin/inventory/assets`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/inventory/assets`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add New Asset</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Register a new fixed asset to inventory</p>
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
 <Package size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Asset Information</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Details and categorization</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Asset Name <span className="text-rose-500">*</span></label>
 <input
 name="name"
 required
 placeholder="e.g. Dell XPS 15 Laptop"
 value={form.name}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Category <span className="text-rose-500">*</span></label>
 <select
 name="category"
 required
 value={form.category}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Electronics">Electronics</option>
 <option value="Furniture">Furniture</option>
 <option value="Vehicles">Vehicles</option>
 <option value="Equipment">Equipment</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Purchase Date</label>
 <input
 name="purchaseDate"
 type="date"
 required
 value={form.purchaseDate}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Asset Value (₹)</label>
 <input
 name="value"
 type="number"
 min="0"
 value={form.value}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <Tag size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Assignment & Status</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Where is this asset located</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Department</label>
 <input
 name="department"
 placeholder="e.g. IT Department"
 value={form.department}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Location</label>
 <input
 name="location"
 placeholder="e.g. Server Room A"
 value={form.location}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
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
 <option value="Active">Active</option>
 <option value="Maintenance">Maintenance</option>
 <option value="Retired">Retired</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/inventory/assets`}
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
 Save Asset
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
