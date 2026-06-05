"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExportButton from "@/components/ui/ExportButton";
import { 
  Users, 
  Briefcase, 
  IndianRupee, 
  BookOpen, 
  Calendar, 
  Clock,
  FileText,
  Check,
  X,
  UserPlus,
  UserMinus,
  Receipt,
  Megaphone,
  Download,
  Plus,
  ChevronRight,
  Home
} from "lucide-react";

export default function AdminDashboard() {
  const pathname = usePathname();
  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpscherukupalli";
  }, [pathname]);

  const stats = [
    {
      title: "Students",
      value: "2,450",
      badge: "-2% MTD",
      badgeColor: "bg-red-50 text-red-500",
      icon: Users,
      iconBg: "bg-blue-50 text-blue-600"
    },
    {
      title: "Staff",
      value: "85",
      badge: "+3 new",
      badgeColor: "bg-green-50 text-green-600",
      icon: Briefcase,
      iconBg: "bg-primary/10 text-primary"
    },
    {
      title: "Revenue",
      value: "₹125,000",
      badge: "+12% YTD",
      badgeColor: "bg-green-50 text-green-600",
      icon: IndianRupee,
      iconBg: "bg-green-50 text-green-600"
    },
    {
      title: "Classes",
      value: "98",
      badge: "All active",
      badgeColor: "bg-primary/5 text-primary",
      icon: BookOpen,
      iconBg: "bg-orange-50 text-orange-600"
    },
    {
      title: "Fees Due",
      value: "₹25,500",
      badge: "+5 more",
      badgeColor: "bg-red-50 text-red-600",
      icon: Receipt,
      iconBg: "bg-red-50 text-red-600"
    },
    {
      title: "Attendance",
      value: "94.2%",
      badge: "Average",
      badgeColor: "bg-slate-100 text-slate-500",
      icon: Calendar,
      iconBg: "bg-purple-50 text-purple-600"
    }
  ];

  const recentActivities = [
    { 
      icon: UserPlus, 
      iconBg: "bg-blue-100 text-blue-600",
      title: "15 new admissions",
      desc: "Primary and Secondary grades enrollment finalized",
      time: "2 hours ago"
    },
    { 
      icon: UserMinus, 
      iconBg: "bg-orange-100 text-orange-600",
      title: "3 staff members on leave",
      desc: "Substitutes assigned to Class 8B and 10C",
      time: "4 hours ago"
    },
    { 
      icon: Receipt, 
      iconBg: "bg-green-100 text-green-600",
      title: "Monthly Fee Cycle Initiated",
      desc: "Automated invoices sent to 2,450 parents",
      time: "8 hours ago"
    },
    { 
      icon: Megaphone, 
      iconBg: "bg-purple-100 text-purple-600",
      title: "New Notice: Annual Sports Meet",
      desc: "Published on parent portal and mobile app",
      time: "Yesterday"
    },
  ];

  const pendingApprovals = [
    {
      avatar: "SJ",
      avatarBg: "bg-slate-200 text-slate-600",
      name: "Sarah Jenkins",
      desc: "Leave Request (Sick Leave)",
      isIcon: false
    },
    {
      icon: Receipt,
      iconBg: "bg-primary/10 text-primary",
      name: "Voucher #9902",
      desc: "Lab Equipment Expense (₹450)",
      isIcon: true
    },
    {
      avatar: "RC",
      avatarBg: "bg-slate-200 text-slate-600",
      name: "Robert Chen",
      desc: "Overtime Approval (Grading)",
      isIcon: false
    },
    {
      icon: FileText,
      iconBg: "bg-primary/10 text-primary",
      name: "New Curriculum Plan",
      desc: "Grade 10 Physics Syllabus Review",
      isIcon: true
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 flex-1 animate-in fade-in duration-500 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Branch Dashboard</h1>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Central School (Cherukupalli)</p>
        </div>
        <div className="flex gap-3">
          <ExportButton data={[]} filename="Export" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors" iconSize={20} />
          <button className="flex items-center gap-2 rounded-lg bg-[#144835] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all">
            <Plus size={20} /> New Entry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-3">
              <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                <stat.icon size={18} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
            <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pb-12">
        {/* Recent Activities Column */}
        <div className="rounded-[16px] border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 bg-white">
            <div className="flex items-center gap-2">
              <Clock className="text-[#144835]" size={20} />
              <h3 className="font-bold text-gray-900 tracking-wide uppercase text-xs">RECENT ACTIVITIES</h3>
            </div>
            <button className="text-xs font-bold text-[#144835] hover:underline uppercase tracking-wider">See timeline</button>
          </div>
          <div className="p-4 flex-1">
            <ul className="space-y-6">
              {recentActivities.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-4 group">
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${activity.iconBg}`}>
                    <activity.icon size={14} />
                    {idx !== recentActivities.length - 1 && (
                      <div className="absolute -bottom-6 left-1/2 h-6 w-0.5 -translate-x-1/2 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.desc}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pending Approvals Column */}
        <div className="rounded-[16px] border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 bg-white">
            <div className="flex items-center gap-2">
              <FileText className="text-[#144835]" size={20} />
              <h3 className="font-bold text-gray-900 tracking-wide uppercase text-xs">PENDING APPROVALS</h3>
            </div>
            <Link href={`/schools/${schoolId}/admin/approvals`} className="text-xs font-bold text-[#144835] hover:underline uppercase tracking-wider">View All</Link>
          </div>
          <div className="p-4 flex-1">
            <div className="space-y-4">
              {pendingApprovals.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-4 border border-transparent hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    {item.isIcon ? (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.iconBg}`}>
                        {item.icon && <item.icon size={20} />}
                      </div>
                    ) : (
                      <div className={`h-10 w-10 flex items-center justify-center rounded-full font-bold text-xs ${item.avatarBg}`}>
                        {item.avatar}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-white p-1.5 text-red-500 shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-colors" title="Reject">
                      <X size={18} />
                    </button>
                    <button className="rounded-lg bg-[#144835] p-1.5 text-white shadow-md hover:bg-[#144835]/90 transition-all" title="Approve">
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
