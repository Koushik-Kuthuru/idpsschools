"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
 Building2, 
 Users, 
 GraduationCap, 
 Briefcase, 
 TrendingUp, 
 TrendingDown,
 ArrowUpRight,
 MoreVertical,
 Activity,
 CheckCircle2,
 AlertCircle,
 Clock,
 ExternalLink,
 PieChart,
 ChevronRight,
 IndianRupee
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import FranchiseGrowthChart from "@/components/super-admin/FranchiseGrowthChart";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function SuperAdminDashboard() {
 const [schools, setSchools] = useState<any[]>([]);
 const [stats, setStats] = useState<any[]>([]);
 const [activities, setActivities] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function fetchDashboardData() {
 try {
 // 1. Fetch Schools
 const schoolsSnapshot = await getDocs(query(collection(db, "schools"), limit(4)));
 const schoolsData = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
 setSchools(schoolsData);

 // 2. Calculate dynamic stats
 const totalBranches = schoolsData.length;
 const totalStudents = schoolsData.reduce((acc: number, school: any) => acc + (school.students || 0), 0);
 const totalTeachers = schoolsData.reduce((acc: number, school: any) => acc + (school.teachers || 0), 0);

 setStats([
 {
 title: "Total Revenue",
 value: "₹2.4Cr", // Mocked for now until finance is built
 change: "+12.5%",
 trend: "up",
 icon: IndianRupee,
 },
 {
 title: "Total Branches",
 value: totalBranches.toString(),
 change: "+1 new",
 trend: "up",
 icon: Building2,
 },
 {
 title: "Active Students",
 value: totalStudents.toLocaleString(),
 change: "+5.2%",
 trend: "up",
 icon: GraduationCap,
 },
 {
 title: "Total Staff",
 value: totalTeachers.toLocaleString(),
 change: "-1.2%",
 trend: "down",
 icon: Users,
 }
 ]);

 // 3. Fetch Global Announcements / Activities
 const announcementsSnapshot = await getDocs(query(collection(db, "global_announcements"), limit(5)));
 const announcementsData = announcementsSnapshot.docs.map(doc => {
 const data = doc.data();
 return {
 id: doc.id,
 message: data.title,
 time: new Date(data.date).toLocaleDateString(),
 status: data.priority === 'high' ? 'pending' : 'completed',
 user: "System"
 };
 });
 setActivities(announcementsData);

 } catch (error) {
 console.error("Error fetching dashboard data:", error);
 } finally {
 setLoading(false);
 }
 }

 fetchDashboardData();
 }, []);

 if (loading) {
 return (
 <div className="flex h-96 items-center justify-center">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin"></div>
 </div>
 );
 }

 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost">
 {/* Welcome Banner */}
 <div className="bg-gradient-to-r from-[#144835] to-[#0f3628] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
 {/* Abstract Shapes */}
 <div className="absolute right-0 top-0 h-full w-2/3 bg-white/5 skew-x-12 transform translate-x-20 transition-transform duration-700 group-hover:translate-x-10"></div>
 <div className="absolute right-[-5%] bottom-[-50%] w-64 h-64 bg-[#a2c144]/20 rounded-full blur-3xl"></div>
 
 <div className="relative z-10 max-w-2xl">
 <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-[#a2c144] mb-3 border border-white/10">
 Dashboard Overview
 </div>
 <h1 className="text-xl font-bold mb-3">Welcome back, Super Admin!</h1>
 <p className="text-[#faf1e2]/80 text-lg leading-relaxed">Here's what's happening with your franchise network today. You have <span className="font-bold text-white">12 new notifications</span> requiring attention.</p>
 
 <div className="mt-6 flex gap-3">
 <Link href="/super-admin/branches" className="px-5 py-2.5 bg-[#a2c144] text-[#144835] font-bold rounded-lg shadow-lg shadow-[#a2c144]/20 hover:bg-white hover:text-[#144835] transition-all transform hover:-translate-y-0.5 text-xs inline-flex items-center gap-2">
 View Branches <ArrowUpRight size={14} />
 </Link>
 <Link href="/super-admin/users" className="px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all text-xs backdrop-blur-sm inline-flex items-center gap-2">
 Manage Users
 </Link>
 </div>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {stats.map((stat, idx) => {
 const styles = [
 { bg: "bg-emerald-50", color: "text-emerald-600", border: "border-emerald-100" },
 { bg: "bg-blue-50", color: "text-blue-600", border: "border-blue-100" },
 { bg: "bg-orange-50", color: "text-orange-600", border: "border-orange-100" },
 { bg: "bg-purple-50", color: "text-purple-600", border: "border-purple-100" }
 ];
 const style = styles[idx % styles.length];
 
 return (
 <div key={idx} className="bg-white rounded-[16px] p-4 shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer">
 <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500", style.color)}>
 <stat.icon size={64} />
 </div>

 <div className="flex justify-between items-start mb-4 relative z-10">
 <div className={cn("p-3 rounded-lg", style.bg, style.color)}>
 <stat.icon size={20} />
 </div>
 <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-lg", stat.trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
 {stat.trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
 {stat.change}
 </div>
 </div>
 
 <div className="relative z-10">
 <h3 className="text-xl font-bold text-gray-800 mb-1">{stat.value}</h3>
 <p className="text-gray-500 font-medium text-xs">{stat.title}</p>
 </div>
 </div>
 );
 })}
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
 
 {/* Left Column: Charts & Tables */}
 <div className="xl:col-span-2 flex flex-col gap-8">
 
 {/* Growth Chart */}
 <FranchiseGrowthChart />

 {/* Branch Performance Table */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <div>
 <h2 className="text-lg font-bold text-[#1A1A1A]">Branch Performance</h2>
 <p className="text-xs text-gray-500 mt-1">Key metrics across top performing campuses</p>
 </div>
 <Link href="/super-admin/branches" className="text-xs font-medium text-[#004D40] hover:bg-[#004D40]/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
 View All <ChevronRight size={14} />
 </Link>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50/50 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
 <tr>
 <th className="px-4 py-2.5">Campus</th>
 <th className="px-4 py-2.5">Capacity</th>
 <th className="px-4 py-2.5">Status</th>
 <th className="px-4 py-2.5 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {schools.map((branch: any, idx: number) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="px-4 py-2.5">
 <Link href={`/super-admin/branches/${encodeURIComponent(branch.id)}`} className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
 <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-[#144835]/10 group-hover:text-[#144835] transition-colors">
 <Building2 size={20} />
 </div>
 <div>
 <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#144835] transition-colors">{branch.name}</p>
 <p className="text-xs text-gray-500">{branch.city}, {branch.state}</p>
 </div>
 </Link>
 </td>
 <td className="px-4 py-2.5">
 <div className="flex items-center gap-3">
 <div className="flex-1 w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
 <div 
 className="h-full bg-[#004D40] rounded-full" 
 style={{ width: `${branch.progress}%` }}
 ></div>
 </div>
 <span className="text-xs font-bold text-gray-700">{branch.progress}%</span>
 </div>
 <p className="text-xs text-gray-400 mt-1">{branch.students} Students</p>
 </td>
 <td className="px-4 py-2.5">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
 branch.status === "Active" 
 ? "bg-green-50 text-green-700 border border-green-100" 
 : "bg-amber-50 text-amber-700 border border-amber-100"
 )}>
 <span className={cn("w-1.5 h-1.5 rounded-full", branch.status === "Active" ? "bg-green-600" : "bg-amber-600")}></span>
 {branch.status}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right">
 <Link 
 href={`/super-admin/branches/${encodeURIComponent(branch.id)}`}
 className="p-2 text-gray-400 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-colors inline-block"
 title="View Details"
 >
 <ExternalLink size={18} />
 </Link>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Right Column: Widgets */}
 <div className="space-y-8">
 
 {/* Notifications Widget */}
 <div className="bg-[#144835] rounded-[16px] p-4 text-white shadow-lg relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <CheckCircle2 size={100} />
 </div>
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-xl font-bold">Pending Actions</h3>
 <p className="text-[#a2c144] text-xs font-bold uppercase tracking-wider mt-1">5 New Requests</p>
 </div>
 <div className="p-2 bg-white/10 rounded-lg">
 <AlertCircle size={20} className="text-[#a2c144]" />
 </div>
 </div>
 
 <div className="space-y-4">
 {[
 { label: "New Franchise Inquiry", time: "2h ago", icon: Briefcase },
 { label: "Staff Access Request", time: "5h ago", icon: Users },
 { label: "System Update v2.4", time: "1d ago", icon: Activity }
 ].map((item, i) => (
 <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
 <div className="p-2 bg-white/10 rounded-lg">
 <item.icon size={14} className="text-white" />
 </div>
 <div className="flex-1">
 <p className="text-xs font-bold text-white">{item.label}</p>
 <p className="text-xs text-white/50">{item.time}</p>
 </div>
 <ChevronRight size={14} className="text-white/30" />
 </div>
 ))}
 </div>

 <button className="w-full mt-6 py-3 bg-[#a2c144] text-[#144835] font-bold rounded-lg text-xs hover:bg-white transition-colors shadow-lg shadow-black/10">
 View All Notifications
 </button>
 </div>
 </div>

 {/* Recent Activity */}
 <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-gray-100 flex items-center justify-between">
 <h2 className="text-lg font-bold text-[#1A1A1A]">Recent Activity</h2>
 <Link href="/super-admin/audit-logs" className="text-xs font-bold text-gray-400 hover:text-[#144835]">View Log</Link>
 </div>
 <div className="p-4">
 <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
 {activities.map((activity, idx) => (
 <div key={idx} className="relative pl-8 group">
 <div className={cn(
 "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ring-1 ring-gray-100 transition-colors",
 idx === 0 ? "bg-[#004D40] ring-[#004D40]/20" : "bg-gray-200 group-hover:bg-[#144835]/60"
 )}></div>
 <div>
 <p className="text-xs font-medium text-[#1A1A1A] group-hover:text-[#144835] transition-colors">{activity.message}</p>
 <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
 <Clock size={12} />
 {activity.time}
 </p>
 </div>
 </div>
 ))}
 </div>
 <Link href="/super-admin/audit-logs" className="w-full mt-8 py-2.5 text-xs font-medium text-gray-600 hover:text-[#004D40] hover:bg-gray-50 rounded-lg transition-all border border-gray-200 border-dashed block text-center">
 View Full Activity Log
 </Link>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
