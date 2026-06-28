"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";




import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
;
import { ArrowLeft, Save, User, Phone } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { buildPath, upsertData, getTimestamp, db, auth } from "@/lib/db-client";


function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewLeadPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: `L-${Math.floor(1000 + Math.random() * 9000)}`,
 studentName: "",
 parentName: "",
 grade: "Pre-K",
 phone: "",
 email: "",
 source: "Website",
 status: "New" as "New" | "Contacted" | "Qualified" | "Lost",
 date: new Date().toISOString().split('T')[0],
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const payload = {
 ...form,
 createdAt: getTimestamp(),
 };
 await upsertData(buildPath(db, "schools", schoolId, "leads", form.id), payload);
 router.push(`/schools/${schoolId}/admin/admission/leads`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <SafeLink 
 href={`/schools/${schoolId}/admin/admission/leads`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </SafeLink>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add New Lead</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Register a prospective student lead</p>
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
 <User size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Prospect Information</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Details about the student and parent</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Student Name <span className="text-rose-500">*</span></label>
 <input
 name="studentName"
 required
 placeholder="e.g. Rahul Sharma"
 value={form.studentName}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Parent Name <span className="text-rose-500">*</span></label>
 <input
 name="parentName"
 required
 placeholder="e.g. Amit Sharma"
 value={form.parentName}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Grade Interested <span className="text-rose-500">*</span></label>
 <select
 name="grade"
 required
 value={form.grade}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Pre-K">Pre-K</option>
 <option value="Kindergarten">Kindergarten</option>
 <option value="Grade 1">Grade 1</option>
 <option value="Grade 2">Grade 2</option>
 <option value="Grade 3">Grade 3</option>
 <option value="Grade 4">Grade 4</option>
 <option value="Grade 5">Grade 5</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Date of Inquiry</label>
 <input
 name="date"
 type="date"
 required
 value={form.date}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <Phone size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Contact & Source</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">How to reach them and filterBy they came from</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Phone Number <span className="text-rose-500">*</span></label>
 <input
 name="phone"
 required
 placeholder="e.g. +91 98765 43210"
 value={form.phone}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Email Address</label>
 <input
 name="email"
 type="email"
 placeholder="e.g. parent@example.com"
 value={form.email}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Lead Source</label>
 <select
 name="source"
 value={form.source}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Website">Website</option>
 <option value="Walk-in">Walk-in</option>
 <option value="Referral">Referral</option>
 <option value="Advertisement">Advertisement</option>
 <option value="Social Media">Social Media</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Initial Status</label>
 <select
 name="status"
 value={form.status}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="New">New</option>
 <option value="Contacted">Contacted</option>
 <option value="Qualified">Qualified</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <SafeLink
 href={`/schools/${schoolId}/admin/admission/leads`}
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
 Save Lead
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
