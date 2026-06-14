"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CalendarDays, AlignLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function NewEventPage() {
 const router = useRouter();
 const schoolId = useSchoolId();
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 title: "",
 date: new Date().toISOString().split('T')[0],
 type: "academic" as "academic" | "holiday" | "exam" | "event" | "meeting",
 description: "",
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 setForm(prev => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 const title = String(form.title || "").trim();
 const date = String(form.date || "").trim();
 if (!title) throw new Error("Event title is required.");
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date.");

 await addDoc(collection(db, "schools", schoolId, "events"), {
 title,
 date,
 type: form.type,
 description: String(form.description || "").trim(),
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 });
 router.push(`/schools/${schoolId}/admin/academic/calendar`);
 } catch (e: any) {
 setError(e?.message || "Failed to save event.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/academic/calendar`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Add New Event</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Schedule an event, holiday, or exam in the calendar</p>
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
 <CalendarDays size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Event Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Basic information about the event</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5 md:col-span-2">
 <label className="text-xs font-bold text-gray-700">Event Title <span className="text-rose-500">*</span></label>
 <input
 name="title"
 required
 placeholder="e.g. Annual Sports Day"
 value={form.title}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Event Type</label>
 <select
 name="type"
 required
 value={form.type}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="academic">Academic</option>
 <option value="holiday">Holiday</option>
 <option value="exam">Examination</option>
 <option value="event">General Event</option>
 <option value="meeting">Meeting</option>
 </select>
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
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <AlignLeft size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Description</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Additional context</p>
 </div>
 </div>
 <div className="p-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Event Description</label>
 <textarea
 name="description"
 rows={4}
 placeholder="Optional details about this event..."
 value={form.description}
 onChange={handleChange}
 className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm resize-y"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/academic/calendar`}
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
 Save Event
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
