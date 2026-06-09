"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, FileText, User, Calendar, CreditCard } from "lucide-react";
import { collection, doc, getDocs, query, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminGenerateInvoicePage() {
 const router = useRouter();
 const schoolId = "idpskalaburagi";
 const [items, setItems] = useState([
 { id: 1, description: "Tuition Fee - Term 1", amount: 2000 },
 { id: 2, description: "Transport Fee", amount: 150 }
 ]);
 const [students, setStudents] = useState<Array<{ key: string; name: string; grade: string; section: string }>>([]);
 const [selectedStudent, setSelectedStudent] = useState("");
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
 const [dueDate, setDueDate] = useState("");
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 async function loadStudents() {
 try {
 const snap = await getDocs(query(collection(db, "schools", schoolId, "students")));
 const list = snap.docs.map(doc => {
 const data = doc.data();
 return {
 key: doc.id,
 name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || "Unknown",
 grade: data.classId || "Unknown",
 section: data.section || "A"
 };
 });
 setStudents(list);
 } catch (err) {
 console.error("Error loading students:", err);
 }
 }
 loadStudents();
 }, [schoolId]);

 const handleAddItem = () => {
 setItems([...items, { id: Date.now(), description: "", amount: 0 }]);
 };

 const handleRemoveItem = (id: number) => {
 setItems(items.filter(item => item.id !== id));
 };

 const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
 const tax = subtotal * 0.05; // 5% tax example
 const total = subtotal + tax;

 const studentMeta = students.find((s) => s.key === selectedStudent) || null;

 function generateInvoiceId() {
 const year = new Date().getFullYear();
 const suffix = Math.floor(100 + Math.random() * 900);
 return `INV-${year}-${suffix}`;
 }

 async function submit() {
 try {
 setError(null);
 if (!studentMeta) throw new Error("Select a student");
 if (!dueDate) throw new Error("Select due date");
 if (!items.length) throw new Error("Add at least 1 item");
 if (items.some((i) => !String(i.description || "").trim())) throw new Error("Fill all item descriptions");

 setSaving(true);
 const id = generateInvoiceId();
 const payload = {
 id,
 studentName: studentMeta.name,
 grade: studentMeta.grade,
 section: studentMeta.section,
 amount: Math.round(total),
 amountPaid: 0,
 date: issueDate,
 dueDate,
 status: "Pending",
 items: items.map(i => ({ description: i.description, amount: i.amount })),
 createdAt: serverTimestamp(),
 };

 await setDoc(doc(db, "schools", schoolId, "invoices", id), payload);

 router.push(`/schools/${schoolId}/admin/finance/invoices`);
 } catch (e: any) {
 setError(e?.message || "Failed to create invoice");
 } finally {
 setSaving(false);
 }
 }

 return (
 <div className="p-4 sm:p-4 lg:p-8 space-y-6 max-w-5xl mx-auto font-jost">
 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-center gap-3">
 <Link href={`/schools/${schoolId}/admin/finance/invoices`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
 <ArrowLeft size={20} />
 </Link>
 <div>
 <h1 className="text-xl sm:text-xl font-bold text-slate-900 tracking-tight">Generate Invoice</h1>
 <p className="text-xs text-slate-500 mt-1">Create a new fee invoice for a student</p>
 </div>
 </div>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <Link href={`/schools/${schoolId}/admin/finance/invoices`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors">
 Cancel
 </Link>
 <button onClick={submit} disabled={saving} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#144835] hover:bg-[#144835]/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-[#144835]/20 disabled:opacity-70">
 <Save size={18} />
 <span>{saving ? "Saving..." : "Generate & Send"}</span>
 </button>
 </div>
 </div>

 {error && (
 <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {error}
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Main Form */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-4">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <User className="w-5 h-5 text-[#144835]" />
 Student Details
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Student Name</label>
 <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all appearance-none" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
 <option value="">Select Student</option>
 {students.map((s) => (
 <option key={s.key} value={s.key}>
 {s.name} (Grade {s.grade} - {s.section})
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fee Category</label>
 <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all appearance-none" defaultValue="tuition" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}>
 <option value="tuition">Term Tuition</option>
 <option value="transport">Transport</option>
 <option value="hostel">Hostel</option>
 <option value="custom">Custom</option>
 </select>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-slate-100 flex items-center justify-between">
 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
 <FileText className="w-5 h-5 text-[#144835]" />
 Invoice Items
 </h2>
 <button 
 onClick={handleAddItem}
 className="text-xs font-semibold text-[#144835] hover:text-[#144835]/80 flex items-center gap-1 bg-[#144835]/10 px-3 py-1.5 rounded-lg transition-colors"
 >
 <Plus size={14} /> Add Item
 </button>
 </div>
 
 <div className="p-4">
 <div className="space-y-3">
 {/* Header Row */}
 <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">
 <div className="flex-[3]">Description</div>
 <div className="flex-1 text-right">Amount (₹)</div>
 <div className="w-8"></div>
 </div>
 
 {items.map((item, index) => (
 <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-2 bg-slate-50 sm:bg-transparent rounded-lg sm:rounded-none border border-slate-100 sm:border-none">
 <div className="w-full sm:flex-[3]">
 <label className="sm:hidden text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
 <input 
 type="text" 
 value={item.description}
 onChange={(e) => {
 const newItems = [...items];
 newItems[index].description = e.target.value;
 setItems(newItems);
 }}
 placeholder="e.g., Tuition Fee"
 className="w-full bg-white sm:bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all"
 />
 </div>
 <div className="w-full sm:flex-1 flex items-center gap-3 sm:gap-4">
 <div className="flex-1">
 <label className="sm:hidden text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Amount</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
 <input 
 type="number" 
 value={item.amount || ''}
 onChange={(e) => {
 const newItems = [...items];
 newItems[index].amount = parseFloat(e.target.value);
 setItems(newItems);
 }}
 className="w-full pl-7 pr-3 py-2 bg-white sm:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all text-right font-medium"
 />
 </div>
 </div>
 <button 
 onClick={() => handleRemoveItem(item.id)}
 className={`p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ${items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''} sm:mt-0 mt-5`}
 disabled={items.length === 1}
 >
 <Trash2 size={18} />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Sidebar Summary */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-4">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <Calendar className="w-5 h-5 text-[#144835]" />
 Dates
 </h2>
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issue Date</label>
 <input 
 type="date" 
 value={issueDate}
 onChange={(e) => setIssueDate(e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
 <input 
 type="date" 
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] outline-none text-xs transition-all"
 />
 </div>
 </div>
 </div>

 <div className="bg-white rounded-[16px] border border-slate-100 shadow-sm p-4">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-[#144835]" />
 Summary
 </h2>
 
 <div className="space-y-3 mb-6">
 <div className="flex justify-between text-xs">
 <span className="text-slate-500 font-medium">Subtotal</span>
 <span className="text-slate-900 font-semibold">₹{subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-500 font-medium">Tax (5%)</span>
 <span className="text-slate-900 font-semibold">₹{tax.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-slate-500 font-medium">Discount</span>
 <span className="text-emerald-600 font-semibold">-₹0.00</span>
 </div>
 </div>
 
 <div className="pt-4 border-t border-slate-100">
 <div className="flex justify-between items-end">
 <span className="text-slate-900 font-bold">Total Amount</span>
 <span className="text-xl font-bold text-[#144835]">₹{total.toFixed(2)}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
