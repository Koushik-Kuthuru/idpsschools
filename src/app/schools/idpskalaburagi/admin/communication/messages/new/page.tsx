"use client";

import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Mail, Users } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function ComposeMessagePage() {
 const router = useRouter();
 const schoolId = "idpskalaburagi";
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [form, setForm] = useState({
 id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
 sender: "Admin",
 recipient: "",
 subject: "",
 preview: "",
 dateLabel: "Just now",
 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
 unread: false,
 hasAttachment: false,
 avatarColor: "bg-blue-100 text-blue-700",
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
 const payload = {
 ...form,
 createdAt: serverTimestamp(),
 };
 await setDoc(doc(db, "schools", schoolId, "messages", form.id), payload);
 router.push(`/schools/${schoolId}/admin/communication/messages`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link 
 href={`/schools/${schoolId}/admin/communication/messages`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Compose Message</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Send a message to parents or staff</p>
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
 <Mail size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Message Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Draft your message content</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">To <span className="text-rose-500">*</span></label>
 <input
 name="recipient"
 required
 placeholder="e.g. All Parents, Grade 5 Staff..."
 value={form.recipient}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Subject <span className="text-rose-500">*</span></label>
 <input
 name="subject"
 required
 placeholder="Message Subject"
 value={form.subject}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Message Content <span className="text-rose-500">*</span></label>
 <textarea
 name="preview"
 required
 rows={6}
 placeholder="Type your message here..."
 value={form.preview}
 onChange={handleChange}
 className="w-full bg-white border border-gray-200 rounded-lg p-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm resize-y"
 />
 </div>
 </div>
 </div>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/communication/messages`}
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
 Send Message
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
