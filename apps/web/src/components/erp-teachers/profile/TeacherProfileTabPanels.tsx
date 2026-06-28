"use client";

import {
  AlertCircle,
  Badge,
  BookOpen,
  Briefcase,
  CalendarDays,
  Clock,
  Download,
  FileText,
  GraduationCap,
  IndianRupee,
  Mail,
  MessageSquareWarning,
  Phone,
  Plus,
  Receipt,
  Send,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
const SafeLink = Link as any;
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import StaffAttendanceLogTab from "@/components/admin/hr/attendance/StaffAttendanceLogTab";
import type { TeacherProfileData } from "@/lib/loadTeacherProfile";
import type {
  ComplaintRow,
  LeaveRow,
  PayslipRow,
  StaffExpenseRow,
  TeacherProfileTab,
} from "@/lib/teacherProfileHub";
import {
  complaintStatusTone,
  downloadPayslipText,
  expenseStatusTone,
  formatInr,
  leaveStatusTone,
} from "@/lib/teacherProfileHub";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props = {
  schoolId: string;
  activeTab: TeacherProfileTab;
  data: TeacherProfileData;
  roleLabel: string;
  userUid?: string;
  leaves: LeaveRow[];
  payslips: PayslipRow[];
  expenses: StaffExpenseRow[];
  complaints: ComplaintRow[];
  presentDates: string[];
  absentDates: string[];
  baseSalary: number;
  expenseForm: {
    title: string;
    category: string;
    amount: string;
    date: string;
    vendor: string;
    notes: string;
  };
  complaintForm: {
    recipient: string;
    subject: string;
    message: string;
  };
  submittingExpense: boolean;
  submittingComplaint: boolean;
  onExpenseFormChange: (field: string, value: string) => void;
  onComplaintFormChange: (field: string, value: string) => void;
  onSubmitExpense: () => void;
  onSubmitComplaint: () => void;
  onTabSelect?: (tab: TeacherProfileTab) => void;
};

export function TeacherProfileTabPanels({
  schoolId,
  activeTab,
  data,
  roleLabel,
  leaves,
  payslips,
  expenses,
  complaints,
  presentDates,
  absentDates,
  baseSalary,
  expenseForm,
  complaintForm,
  submittingExpense,
  submittingComplaint,
  onExpenseFormChange,
  onComplaintFormChange,
  onSubmitExpense,
  onSubmitComplaint,
  onTabSelect,
}: Props) {
  if (activeTab === "Overview") {
    const quickLinks = [
      { tab: "Attendance" as const, label: "My Attendance", icon: CalendarDays, value: `${presentDates.length} present days` },
      { tab: "Leave Requests" as const, label: "Leave Requests", icon: Clock, value: `${leaves.length} requests` },
      { tab: "Payroll & Payslips" as const, label: "Payslips", icon: Download, value: `${payslips.length} available` },
      { tab: "My Expenses" as const, label: "Expense Claims", icon: Wallet, value: `${expenses.length} submitted` },
      { tab: "Complaints & Feedback" as const, label: "Complaints", icon: MessageSquareWarning, value: `${complaints.length} sent` },
      { tab: "Class Assignments" as const, label: "Classes", icon: BookOpen, value: `${data.teachingLoads.length} assignments` },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onTabSelect?.(item.tab)}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 text-left hover:border-[#144835]/30 hover:shadow-sm transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                <item.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500">{item.label}</p>
                <p className="text-sm font-extrabold text-gray-900 truncate">{item.value}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
              <Badge size={20} />
            </div>
            <h2 className="text-base font-bold text-gray-900">Profile Details</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <TeacherProfileSidebarFields data={data} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase size={20} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Employment Details</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Role</p>
                <p className="mt-1 text-xs font-bold text-gray-900">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Joining Date</p>
                <p className="mt-1 text-xs font-bold text-gray-900">{data.joinedDate}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Qualification</p>
                <p className="mt-1 text-xs font-bold text-gray-900">{data.qualification}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Experience</p>
                <p className="mt-1 text-xs font-bold text-gray-900">
                  {data.experienceYears != null ? `${data.experienceYears} years` : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Class Teacher</h2>
            </div>
            <div className="p-4">
              {data.homeroomClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.homeroomClasses.map((cls) => (
                    <span
                      key={cls}
                      className="inline-flex items-center rounded-lg bg-[#144835]/10 text-[#144835] border border-[#144835]/20 px-3 py-1.5 text-xs font-bold"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No homeroom class assigned.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "Attendance") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-900">
          View your monthly attendance log. Contact HR if you notice any discrepancies.
        </div>
        <StaffAttendanceLogTab presentDates={presentDates} absentDates={absentDates} />
      </div>
    );
  }

  if (activeTab === "Leave Requests") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Leave Requests</h2>
              <p className="text-xs text-gray-500">Track and apply for leave</p>
            </div>
          </div>
          <SafeLink
            href={`/schools/${schoolId}/teachers/leaves/new`}
            className="h-9 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-3 text-xs font-bold text-white hover:bg-[#144835]/90"
          >
            <Plus size={14} /> Apply Leave
          </SafeLink>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">From</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">To</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Days</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{leave.type}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.from}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.to}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{leave.days ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", leaveStatusTone(leave.status))}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No leave requests yet.{" "}
                    <SafeLink href={`/schools/${schoolId}/teachers/leaves/new`} className="text-[#144835] font-bold hover:underline">
                      Apply now
                    </SafeLink>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === "Payroll & Payslips") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Base Salary</p>
              <p className="text-2xl font-bold text-gray-900">{formatInr(baseSalary)}</p>
              <p className="text-xs text-gray-500 mt-1">per month</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={24} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Latest Net Pay</p>
              <p className="text-2xl font-bold text-[#144835]">
                {payslips[0] ? formatInr(payslips[0].net) : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">{payslips[0]?.period ?? "No payslip yet"}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Payslip History</h2>
              <p className="text-xs text-gray-500">Download payslips for your records</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Gross</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Net Pay</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{ps.period}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">{formatInr(ps.salary)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#144835] text-right">{formatInr(ps.net)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {ps.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          downloadPayslipText({
                            employeeName: data.name,
                            employeeId: data.employeeId,
                            schoolName: schoolId,
                            period: ps.period,
                            salary: ps.salary,
                            tds: ps.tds,
                            deduct: ps.deduct,
                            net: ps.net,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#144835] hover:text-[#a2c144]"
                      >
                        <Download size={14} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      No payslips available yet. They will appear here once payroll is processed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "My Expenses") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Submit Expense Claim</h2>
              <p className="text-xs text-gray-500">Request reimbursement for work-related expenses</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="erp-label block mb-1.5">Title</label>
              <input
                className="erp-input h-10"
                placeholder="Title / description"
                value={expenseForm.title}
                onChange={(e) => onExpenseFormChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className="erp-label block mb-1.5">Category</label>
              <select
                className="erp-input h-10"
                value={expenseForm.category}
                onChange={(e) => onExpenseFormChange("category", e.target.value)}
              >
                <option value="Travel">Travel</option>
                <option value="Supplies">Supplies</option>
                <option value="Training">Training</option>
                <option value="Communication">Communication</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1.5">Amount</label>
              <input
                className="erp-input h-10"
                type="number"
                min="0"
                placeholder="Amount (₹)"
                value={expenseForm.amount}
                onChange={(e) => onExpenseFormChange("amount", e.target.value)}
              />
            </div>
            <div>
              <label className="erp-label block mb-1.5">Date</label>
              <input
                className="erp-input h-10"
                type="date"
                value={expenseForm.date}
                onChange={(e) => onExpenseFormChange("date", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="erp-label block mb-1.5">Vendor</label>
              <input
                className="erp-input h-10"
                placeholder="Vendor (optional)"
                value={expenseForm.vendor}
                onChange={(e) => onExpenseFormChange("vendor", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="erp-label block mb-1.5">Notes</label>
              <textarea
                className="erp-input min-h-[80px] resize-y"
                placeholder="Notes (optional)"
                value={expenseForm.notes}
                onChange={(e) => onExpenseFormChange("notes", e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={submittingExpense}
            onClick={onSubmitExpense}
            className="mt-4 h-10 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
          >
            <Plus size={14} /> {submittingExpense ? "Submitting..." : "Submit Claim"}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">My Expense Claims</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Amount</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">{exp.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{exp.category}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{exp.date}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 text-right">{formatInr(exp.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", expenseStatusTone(exp.status))}>
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                      No expense claims submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "Complaints & Feedback") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          Send complaints or feedback directly to the Principal or Chairman. All submissions are logged for review.
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <MessageSquareWarning size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">New Complaint / Feedback</h2>
              <p className="text-xs text-gray-500">Choose who should receive your message</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="erp-label block mb-1.5">Send to</label>
              <select
                className="erp-input h-10"
                value={complaintForm.recipient}
                onChange={(e) => onComplaintFormChange("recipient", e.target.value)}
              >
                <option value="Principal">Principal</option>
                <option value="Chairman">Chairman</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1.5">Subject</label>
              <input
                className="erp-input h-10"
                placeholder="Subject"
                value={complaintForm.subject}
                onChange={(e) => onComplaintFormChange("subject", e.target.value)}
              />
            </div>
            <div>
              <label className="erp-label block mb-1.5">Message</label>
              <textarea
                className="erp-input min-h-[120px] resize-y"
                placeholder="Describe your complaint or feedback..."
                value={complaintForm.message}
                onChange={(e) => onComplaintFormChange("message", e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={submittingComplaint}
            onClick={onSubmitComplaint}
            className="mt-4 h-10 inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white hover:bg-[#144835]/90 disabled:opacity-60"
          >
            <Send size={14} /> {submittingComplaint ? "Sending..." : "Send to " + complaintForm.recipient}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Submitted Messages</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {complaints.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To {item.recipient} · {item.createdAt}
                    </p>
                  </div>
                  <span className={cn("shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", complaintStatusTone(item.status))}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{item.message}</p>
              </div>
            ))}
            {complaints.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">No complaints or feedback submitted yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
          <BookOpen size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Teaching Load</h2>
          <p className="text-xs text-gray-500">Subjects and classes assigned to you</p>
        </div>
      </div>
      {data.teachingLoads.length === 0 ? (
        <div className="p-10 text-center">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">No class assignments yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Class</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Subject</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.teachingLoads.map((load, index) => (
                <tr key={`${load.classSection}-${load.subject}-${index}`} className="border-b border-gray-50">
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">{load.classSection}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-700">{load.subject}</td>
                  <td className="px-6 py-4">
                    {load.isHomeroom ? (
                      <span className="inline-flex items-center rounded-md bg-[#144835]/10 text-[#144835] px-2 py-0.5 text-[10px] font-bold border border-[#144835]/20">
                        Class Teacher
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-100">
                        Subject Teacher
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const TEACHER_PROFILE_TABS: { id: TeacherProfileTab; icon: typeof User }[] = [
  { id: "Overview", icon: User },
  { id: "Attendance", icon: CalendarDays },
  { id: "Leave Requests", icon: Clock },
  { id: "Payroll & Payslips", icon: Download },
  { id: "My Expenses", icon: Wallet },
  { id: "Complaints & Feedback", icon: MessageSquareWarning },
  { id: "Class Assignments", icon: BookOpen },
];

export function TeacherProfileSidebarFields({ data }: { data: TeacherProfileData }) {
  return (
    <>
      {[
        { icon: Badge, label: "Employee ID", value: data.employeeId },
        { icon: Users, label: "Department", value: data.department },
        { icon: Briefcase, label: "Designation", value: data.designation },
        { icon: Phone, label: "Mobile", value: data.phone },
        { icon: Mail, label: "Email", value: data.email },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0">
            <item.icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
            <p className="text-xs font-bold text-gray-900 truncate">{item.value}</p>
          </div>
        </div>
      ))}
    </>
  );
}
