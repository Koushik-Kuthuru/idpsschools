"use client";

import Link from "next/link";
import {
  Badge,
  Briefcase,
  CalendarDays,
  Eye,
  Mail,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AdminEmployee } from "../../data/adminEmployees";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatInrMonthly(value: number) {
  return value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-red-100 text-red-700 border-red-200", 
    "bg-orange-100 text-orange-700 border-orange-200", 
    "bg-amber-100 text-amber-700 border-amber-200", 
    "bg-green-100 text-green-700 border-green-200", 
    "bg-emerald-100 text-emerald-700 border-emerald-200", 
    "bg-teal-100 text-teal-700 border-teal-200", 
    "bg-cyan-100 text-cyan-700 border-cyan-200", 
    "bg-blue-100 text-blue-700 border-blue-200", 
    "bg-indigo-100 text-indigo-700 border-indigo-200", 
    "bg-violet-100 text-violet-700 border-violet-200", 
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export default function EmployeeProfileView({
  employee,
  editHref,
  backHref = "/idpskalaburagi/hr/employees",
  backLabel = "Directory",
  variant,
}: {
  employee: AdminEmployee;
  editHref: string;
  backHref?: string;
  backLabel?: string;
  variant?: "teaching" | "nonTeaching";
}) {
  const totalWeeklyHours = employee.classLoads.reduce((sum, c) => sum + c.weeklyHours, 0);
  const initials = employee.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const avatarColor = getAvatarColor(employee.name);
  const showAcademicLoad = variant === "teaching";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href={backHref} className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <ChevronLeft size={14} /> {backLabel}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-gray-900">{employee.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export CV
          </button>
          <Link
            href={editHref}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all"
          >
            <Pencil size={14} /> Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar - Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#144835] to-[#144835]/80" />
            
            <div className="relative px-6 pb-6 pt-16">
              <div className="flex flex-col items-center">
                <div className={cn("h-28 w-28 rounded-3xl border-4 border-white flex items-center justify-center text-xl font-black shadow-lg bg-white relative", avatarColor)}>
                  {initials}
                  <div className={cn(
                    "absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center",
                    employee.status === "Active" ? "bg-emerald-500" : employee.status === "On Leave" ? "bg-amber-500" : "bg-gray-400"
                  )}>
                    {employee.status === "Active" ? <CheckCircle2 size={12} className="text-white"/> : <AlertCircle size={12} className="text-white"/>}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
                  <p className="text-xs font-medium text-gray-500 mt-1">{employee.roleTitle}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <Badge size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employee ID</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{employee.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Email Address</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Phone Number</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{employee.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
                  <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Department</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{employee.department}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm p-3">
            <nav className="space-y-1">
              <button className="w-full flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-xs font-bold text-gray-900 border border-gray-100">
                Profile Overview
                <ChevronRight size={14} className="text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                Attendance & Logs
              </button>
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                Payroll & Slips
              </button>
              <button className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                Leave Requests
              </button>
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase size={20} />
                </div>
                <h2 className="text-base font-bold text-gray-900">Employment Details</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employment Type</p>
                    <p className="mt-1 text-xs font-bold text-gray-900">{employee.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Reports To</p>
                    <p className="mt-1 text-xs font-bold text-gray-900">{employee.reportsTo}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Base Salary</p>
                    <p className="mt-1 text-xs font-bold text-gray-900">
                      {formatInrMonthly(employee.baseSalaryMonthlyInr)} <span className="text-gray-400 font-medium">/ mo</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Experience</p>
                    <p className="mt-1 text-xs font-bold text-gray-900">{employee.experienceYears} Years</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">Qualifications</p>
                  <div className="flex flex-wrap gap-2">
                    {employee.qualifications.map((q) => (
                      <span key={q} className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <CalendarDays size={20} />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Leave Balance</h2>
                </div>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{employee.leaveYear}</span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-center space-y-6">
                {employee.leaveBalances.map((b) => {
                  const pct = b.total === 0 ? 0 : Math.min(100, Math.round((b.availed / b.total) * 100));
                  const isLow = b.total - b.availed <= 2;
                  
                  return (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-700">{b.label}</p>
                        <p className="text-xs font-bold text-gray-500">
                          <span className="text-gray-900">{b.availed}</span> / {b.total} Used
                        </p>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", isLow ? "bg-red-500" : "bg-[#144835]")} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      {isLow && <p className="text-[10px] font-bold text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10}/> Running low</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {showAcademicLoad ? (
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Academic Load</h2>
                  <p className="text-[11px] font-medium text-gray-500 mt-0.5">{employee.academicSessionLabel}</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} /> Assign
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Class &amp; Section</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-center">Students</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-center">Hours/Wk</th>
                    <th className="px-4 py-2.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employee.classLoads.map((c) => (
                    <tr key={`${c.classSection}-${c.subject}`} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-bold text-gray-800 bg-gray-100/80 px-2.5 py-1 rounded-md">{c.classSection}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{c.subject}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-gray-900">{String(c.students).padStart(2, "0")}</span>
                          {c.capacity ? (
                            <span className="text-[10px] font-medium text-gray-400 mt-0.5">Cap: {c.capacity}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] rounded-md bg-blue-50 text-blue-700 px-2 py-1 text-xs font-bold border border-blue-100/50">
                          {c.weeklyHours}h
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="View Class"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/80 border-t border-gray-100">
                    <td colSpan={3} className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">
                      Total Weekly Commitment:
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[3rem] rounded-lg bg-[#144835] text-white px-2.5 py-1 text-xs font-bold shadow-sm">
                        {totalWeeklyHours}h
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          ) : (
          <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Role Overview</h2>
                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Non-teaching staff summary</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Department</p>
                  <p className="mt-1 text-xs font-bold text-gray-900">{employee.department}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Role</p>
                  <p className="mt-1 text-xs font-bold text-gray-900">{employee.roleTitle}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Reports To</p>
                  <p className="mt-1 text-xs font-bold text-gray-900">{employee.reportsTo}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employment</p>
                  <p className="mt-1 text-xs font-bold text-gray-900">{employee.employmentType}</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
