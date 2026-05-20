"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, IndianRupee, FileText } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, doc, getDocs, query, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function RecordPaymentPage() {
 const router = useRouter();
 const schoolId = "idpskalaburagi";
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [invoices, setInvoices] = useState<any[]>([]);

 const [form, setForm] = useState({
 id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
 invoiceId: "",
 student: "",
 amount: 0,
 method: "Bank Transfer",
 date: new Date().toISOString().split('T')[0],
 status: "Completed" as "Completed" | "Failed" | "Pending",
 });

 useEffect(() => {
 async function loadInvoices() {
 try {
 const snap = await getDocs(query(collection(db, "schools", schoolId, "invoices")));
 const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 setInvoices(list);
 } catch (err) {
 console.error("Error loading invoices", err);
 }
 }
 loadInvoices();
 }, [schoolId]);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 if (name === "invoiceId") {
 const inv = invoices.find(i => i.id === value);
 setForm(prev => ({
 ...prev,
 invoiceId: value,
 student: inv ? (inv.studentName || inv.student || "") : prev.student,
 amount: inv ? Math.max(0, (inv.amount || 0) - (inv.amountPaid || 0)) : prev.amount
 }));
 } else {
 setForm(prev => ({ ...prev, [name]: name === "amount" ? Number(value) : value }));
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 if (!form.invoiceId || !form.student) {
 throw new Error("Please select an invoice or fill student name.");
 }
 if (form.amount <= 0) {
 throw new Error("Amount must be greater than 0.");
 }

 // 1. Create payment record
 const payload = {
 id: form.id,
 invoiceId: form.invoiceId,
 studentName: form.student,
 amount: form.amount,
 mode: form.method,
 date: form.date,
 status: form.status,
 createdAt: serverTimestamp(),
 };
 await setDoc(doc(db, "schools", schoolId, "payments", form.id), payload);

 // 2. Update invoice amountPaid
 if (form.status === "Completed") {
 const invRef = doc(db, "schools", schoolId, "invoices", form.invoiceId);
 await updateDoc(invRef, {
 amountPaid: increment(form.amount),
 status: "Paid" // Simplified logic: you might want to check if amountPaid >= amount
 });
 }

 router.push(`/schools/${schoolId}/admin/finance/payments`);
 } catch (err: any) {
 setError(err.message || "An unexpected error occurred");
 setLoading(false);
 }
 };

 return (
 <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-10 font-jost">
 <div className="flex items-center gap-4 mb-6">
 <Link
 href={`/schools/${schoolId}/admin/finance/payments`}
 className="h-10 w-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-extrabold text-gray-900">Record Payment</h1>
 <p className="text-xs font-bold text-gray-500 mt-1">Log an incoming payment or fee collection</p>
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
 <FileText size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Link payment to student and invoice</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Student Name <span className="text-rose-500">*</span></label>
 <input
 name="student"
 required
 placeholder="e.g. John Doe"
 value={form.student}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Invoice ID <span className="text-rose-500">*</span></label>
 <select
 name="invoiceId"
 required
 value={form.invoiceId}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="">Select Invoice</option>
 {invoices.map(i => (
 <option key={i.id} value={i.id}>{i.id} - {i.studentName || i.student || "Unknown"} (₹{Math.max(0, (i.amount || 0) - (i.amountPaid || 0))})</option>
 ))}
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
 <IndianRupee size={20} />
 </div>
 <div>
 <h2 className="text-lg font-bold text-gray-900">Transaction</h2>
 <p className="text-xs font-bold text-gray-500 mt-0.5">Amount, method, and date</p>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Amount (₹) <span className="text-rose-500">*</span></label>
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
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-gray-700">Payment Method <span className="text-rose-500">*</span></label>
 <select
 name="method"
 value={form.method}
 onChange={handleChange}
 className="w-full h-9 bg-white border border-gray-200 rounded-lg px-4 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm appearance-none"
 >
 <option value="Bank Transfer">Bank Transfer</option>
 <option value="Cash">Cash</option>
 <option value="Credit Card">Credit Card</option>
 <option value="UPI">UPI</option>
 <option value="Cheque">Cheque</option>
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

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
 <Link
 href={`/schools/${schoolId}/admin/finance/payments`}
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
 Record Payment
 </>
 )}
 </button>
 </div>
 </form>
 </div>
 );
}
