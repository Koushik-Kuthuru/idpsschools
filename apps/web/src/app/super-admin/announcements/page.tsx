"use client";

import React, { useState, useEffect } from "react";
import {
 Search,
 Megaphone,
 Clock,
 Plus,
 Filter,
 MoreVertical,
 Edit2,
 Trash2,
 X,
 CheckCircle2,
 AlertCircle,
 Info,
 Bell,
 Calendar,
 Send
} from "lucide-react";
import { notificationsData } from "@/data/mockData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AnnouncementsPage() {
 const [announcements, setAnnouncements] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [activeFilter, setActiveFilter] = useState("All");
 const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

 useEffect(() => {
 fetchAnnouncements();
 }, []);

 const fetchAnnouncements = async () => {
 try {
 const snapshot = await getDocs(collection(db, "global_announcements"));
 const data = snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data(),
 // Map fields to match UI expectations
 type: doc.data().priority === 'high' ? 'WARNING' : 'INFO',
 message: doc.data().content,
 time: new Date(doc.data().date).toLocaleString(),
 isRead: true
 }));
 setAnnouncements(data);
 } catch (error) {
 console.error("Error fetching announcements:", error);
 } finally {
 setLoading(false);
 }
 };

 // New Announcement Form State
 const [newAnnouncement, setNewAnnouncement] = useState({
 title: "",
 message: "",
 type: "INFO"
 });

 const filters = ["All", "ALERT", "INFO", "UPDATE", "ADMISSION", "SYSTEM"];

 const filteredAnnouncements = announcements.filter(item => {
 const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.message.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesFilter = activeFilter === "All" || item.type === activeFilter;
 return matchesSearch && matchesFilter;
 });

 const handleDelete = (id: number) => {
 if (confirm("Are you sure you want to delete this announcement?")) {
 setAnnouncements(announcements.filter(a => a.id !== id));
 }
 };

 const handleCreate = (e: React.FormEvent) => {
 e.preventDefault();
 const newItem = {
 id: Date.now(), // simple ID generation
 ...newAnnouncement,
 time: "Just now",
 icon: getIconForType(newAnnouncement.type),
 iconColor: getColorForType(newAnnouncement.type).icon,
 bgColor: getColorForType(newAnnouncement.type).bg,
 badgeColor: getColorForType(newAnnouncement.type).badge,
 isNew: true,
 actions: []
 };

 setAnnouncements([newItem, ...announcements]);
 setIsCreateModalOpen(false);
 setNewAnnouncement({ title: "", message: "", type: "INFO" });
 };

 const getIconForType = (type: string) => {
 switch (type) {
 case "ALERT": return AlertCircle;
 case "INFO": return Info;
 case "UPDATE": return Megaphone; // or specific icon
 case "ADMISSION": return Calendar;
 case "SYSTEM": return CheckCircle2; // Placeholder
 default: return Bell;
 }
 };

 const getColorForType = (type: string) => {
 switch (type) {
 case "ALERT": return { icon: "text-red-600", bg: "bg-red-50", badge: "bg-red-100 text-red-700 border-red-200" };
 case "INFO": return { icon: "text-blue-600", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700 border-blue-200" };
 case "UPDATE": return { icon: "text-purple-600", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700 border-purple-200" };
 case "ADMISSION": return { icon: "text-emerald-600", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" };
 case "SYSTEM": return { icon: "text-gray-600", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-700 border-gray-200" };
 default: return { icon: "text-gray-600", bg: "bg-gray-50", badge: "bg-gray-100 text-gray-700 border-gray-200" };
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">

 {/* Premium Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-xl font-bold text-[#1A1A1A]">Announcements Center</h1>
 <p className="text-gray-500 text-xs mt-1">Broadcast updates, critical alerts, and news seamlessly to the entire organization in real-time.</p>
 </div>
 <button
 onClick={() => setIsCreateModalOpen(true)}
 className="px-5 py-2.5 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center gap-2 shadow-lg shadow-[#144835]/20 transition-all transform hover:-translate-y-0.5"
 >
 <Plus size={18} />
 New Announcement
 </button>
 </div>

 {/* Controls: Search & Filter */}
 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-[16px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24 z-20">
 <div className="relative w-full md:w-[400px] group">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors" size={18} />
 <input
 type="text"
 placeholder="Search announcements..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-11 pr-4 text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>

 <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
 {filters.map(filter => (
 <button
 key={filter}
 onClick={() => setActiveFilter(filter)}
 className={cn(
 "px-5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
 activeFilter === filter
 ? "bg-[#144835] text-white border-[#144835] shadow-md shadow-[#144835]/20"
 : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
 )}
 >
 {filter}
 </button>
 ))}
 </div>
 </div>

 {/* Announcements List */}
 <div className="grid gap-4">
 {filteredAnnouncements.length > 0 ? (
 filteredAnnouncements.map((item) => {
 const Icon = item.icon || Bell;
 return (
 <div key={item.id} className="group bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
 {item.isNew && (
 <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden z-10">
 <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-8 py-1.5 transform rotate-45 translate-x-5 translate-y-3 shadow-md">
 NEW
 </div>
 </div>
 )}

 <div className="flex flex-col sm:flex-row items-start gap-4">
 <div className={cn("p-3 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 duration-300", item.bgColor, item.iconColor)}>
 <Icon size={20} />
 </div>

 <div className="flex-1 min-w-0 w-full">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
 <div className="flex items-center gap-3">
 <span className={cn("px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide border", item.badgeColor)}>
 {item.type}
 </span>
 <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold tracking-wider">
 <Clock size={14} />
 {item.time}
 </div>
 </div>

 <div className="flex items-center gap-2 transition-opacity absolute sm:static top-4 right-8 bg-white/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none p-1 sm:p-0 rounded-lg z-20">
 <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:text-blue-600 focus:bg-blue-50 rounded-lg transition-colors" title="Edit">
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => handleDelete(item.id)}
 className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 rounded-lg transition-colors"
 title="Delete"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>

 <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-[#144835] transition-colors">{item.title}</h3>
 <p className="text-gray-600 text-xs leading-relaxed line-clamp-2 md:line-clamp-none group-hover:line-clamp-none transition-all">{item.message}</p>

 {item.actions && item.actions.length > 0 && (
 <div className="mt-4 flex flex-wrap gap-2">
 {item.actions.map((action: any, idx: number) => (
 <button
 key={idx}
 className={cn(
 "text-xs font-bold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 transform active:scale-95",
 action.primary
 ? "bg-[#144835] text-white hover:bg-[#0f3628] shadow-sm hover:-translate-y-0.5"
 : "bg-gray-100/80 text-gray-700 hover:bg-gray-200 border border-gray-200/50 hover:border-gray-300"
 )}
 >
 {action.label}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[16px] border border-gray-100 border-dashed">
 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
 <Search size={18} className="text-gray-400" />
 </div>
 <h3 className="text-base font-bold text-gray-900">No announcements found</h3>
 <p className="text-gray-500 text-xs mt-1">Try adjusting your search or filters.</p>
 <button
 onClick={() => { setSearchTerm(""); setActiveFilter("All"); }}
 className="mt-4 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear all filters
 </button>
 </div>
 )}
 </div>

 {/* Create Modal */}
 {isCreateModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
 <div className="bg-white rounded-[16px] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
 {/* Modal Header */}
 <div className="relative h-32 bg-gradient-to-r from-[#144835] to-[#0f3628] flex items-center justify-between px-8 text-white overflow-hidden">
 <div className="absolute right-[-10%] top-[-50%] w-48 h-48 bg-[#a2c144]/20 rounded-full blur-3xl pointer-events-none"></div>
 <div>
 <h2 className="text-xl font-extrabold tracking-tight">Create Announcement</h2>
 <p className="text-white/70 text-xs font-medium mt-1">Compose and broadcast a new message.</p>
 </div>
 <button
 onClick={() => setIsCreateModalOpen(false)}
 className="relative z-10 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
 >
 <X size={18} />
 </button>
 </div>

 <form onSubmit={handleCreate} className="p-4 space-y-4 bg-gray-50/30">
 <div className="space-y-1">
 <label className="text-xs font-extrabold text-gray-700 ml-1 uppercase tracking-wider">Announcement Title <span className="text-red-500">*</span></label>
 <input
 type="text"
 required
 value={newAnnouncement.title}
 onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
 placeholder="e.g. Scheduled System Maintenance"
 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all shadow-sm"
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-extrabold text-gray-700 ml-1 uppercase tracking-wider">Category <span className="text-red-500">*</span></label>
 <div className="relative">
 <select
 value={newAnnouncement.type}
 onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all cursor-pointer shadow-sm appearance-none"
 >
 {filters.filter(f => f !== "All").map(f => (
 <option key={f} value={f}>{f}</option>
 ))}
 </select>
 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
 <Filter size={14} />
 </div>
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-extrabold text-gray-700 ml-1 uppercase tracking-wider">Message Content <span className="text-red-500">*</span></label>
 <textarea
 required
 rows={4}
 value={newAnnouncement.message}
 onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
 placeholder="Enter the detailed message for this announcement..."
 className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all resize-none shadow-sm leading-relaxed"
 />
 </div>

 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setIsCreateModalOpen(false)}
 className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="flex-1 py-2 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <Send size={14} />
 Broadcast Now
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}