"use client";

import React from "react";
import { 
  FileText, 
  Download, 
  Eye, 
  Printer, 
  CheckCircle2, 
  Info, 
  Map, 
  CalendarDays,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Receipt
} from "lucide-react";

export default function DocumentsView() {
  const academicDocs = [
    { name: "Skill Assessment Report", date: "Sept 12, 2026", icon: FileCheck },
    { name: "Mid-Term Grade Sheet", date: "Aug 05, 2026", icon: FileText },
  ];

  const feeReceipts = [
    { name: "Annual Tuition Fee Receipt", id: "#RCPT-2026-9081", date: "Oct 15, 2026" },
    { name: "Sports & Cultural Fund Receipt", id: "#RCPT-2026-7722", date: "Sept 10, 2026" },
    { name: "Registration Fee Receipt", id: "#RCPT-2026-0102", date: "Mar 22, 2026" },
  ];

  const examResources = [
    { title: "Final Exam Schedule", type: "PDF • Updated 2 days ago", action: "Download Schedule", icon: CalendarDays },
    { title: "Candidate Instructions", type: "PDF • Essential Reading", action: "View Guidelines", icon: Info },
    { title: "Center Seating Map", type: "Available for Download", action: "Download Map", icon: Map },
  ];

  const handleAction = (label: string) => {
    alert(`Action initiated: ${label}`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Header */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Documents & Certificates</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">Official transcripts, fee receipts, and examination credentials</p>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-[16px] overflow-hidden bg-gradient-to-r from-[#144835] to-[#0f3628] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide">Central Document Repository</h3>
          <p className="text-emerald-100 text-xs font-semibold mt-2 leading-relaxed">
            Access, view, and download all your official school transcripts, fee receipts, and term credentials in one secure interface.
          </p>
        </div>

        <div className="relative z-10 flex gap-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/10 text-center min-w-[90px]">
            <span className="block text-white text-lg font-bold leading-none">12</span>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider mt-1 block">Total Docs</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/10 text-center min-w-[90px]">
            <span className="block text-white text-lg font-bold leading-none">2</span>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider mt-1 block">New Items</span>
          </div>
        </div>
      </div>

      {/* Section 1: Academic Records */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <div className="h-6 w-6 rounded border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
            <FileText size={13} strokeWidth={2.5} />
          </div>
          <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Academic Records</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Transcript Card */}
          <div className="md:col-span-2 bg-white border border-gray-100 p-6 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block">Official Released</span>
                <h5 className="text-base font-bold text-[#144835] uppercase tracking-wide">Cumulative Performance Transcript</h5>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Updated Oct 24, 2025 • Term 1 + Term 2 Overview</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg text-[#144835] shrink-0">
                <FileCheck size={24} />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button 
                onClick={() => handleAction("Download Transcript PDF")}
                className="bg-[#144835] text-white hover:bg-[#144835]/90 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-[#144835]/20"
              >
                <Download size={14} /> Download PDF
              </button>
              <button 
                onClick={() => handleAction("View Transcript Online")}
                className="border border-[#144835] text-[#144835] hover:bg-emerald-50/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Eye size={14} /> View Online
              </button>
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-4 flex flex-col justify-between">
            {academicDocs.map((doc, idx) => (
              <div key={idx} className="bg-white border border-gray-100 p-4 rounded-[16px] hover:bg-gray-50/50 transition-colors flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#144835] shrink-0">
                  <doc.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-xs font-extrabold text-gray-900 truncate">{doc.name}</h6>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Released {doc.date}</p>
                </div>
                <button 
                  onClick={() => handleAction(`Download ${doc.name}`)}
                  className="text-[#144835] hover:bg-emerald-50/50 p-2 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors"
                >
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Fee Documents */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <div className="h-6 w-6 rounded border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
            <Receipt size={13} strokeWidth={2.5} />
          </div>
          <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Fee Documents</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Tax compliance card */}
          <div className="lg:col-span-1 bg-amber-50/20 border border-amber-200 p-6 rounded-[16px] flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 bg-amber-100/50 rounded-full flex items-center justify-center mb-3 text-amber-800">
              <ShieldCheck size={24} />
            </div>
            <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">Tax Compliance</h5>
            <p className="text-xs text-amber-700 font-medium leading-relaxed mb-4">Need an annual fee paid certificate for tax purposes?</p>
            <button 
              onClick={() => handleAction("Generate Tax Certificate")}
              className="w-full bg-[#144835] hover:bg-[#144835]/90 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-[#144835]/20 transition-all"
            >
              Generate Now
            </button>
          </div>

          {/* Receipts Table */}
          <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[16px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Document Name</th>
                  <th className="px-6 py-3">Receipt ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-gray-700">
                {feeReceipts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                        <span className="font-extrabold text-gray-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#144835] font-bold">{row.id}</td>
                    <td className="px-6 py-4 text-gray-400">{row.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleAction(`Download Fee Receipt ${row.id}`)}
                        className="text-[#144835] hover:underline font-bold uppercase tracking-wider text-xs"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Exam Documents */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <div className="h-6 w-6 rounded border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
            <CalendarDays size={13} strokeWidth={2.5} />
          </div>
          <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wider">Exam Documents</h4>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Admit Card Card */}
          <div className="flex-1 bg-gradient-to-br from-[#144835] to-[#0f3628] text-white p-6 rounded-[16px] relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[200px]">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-2.5 inline-block">Urgent • Required</span>
              <h5 className="text-lg md:text-xl font-bold uppercase tracking-wide mb-1">End Term Exam Admit Card</h5>
              <p className="text-emerald-100 text-xs font-semibold leading-relaxed mb-6 max-w-lg">
                Please print this document and carry a physical copy to the examination center. Verify all details before download.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-3">
              <button 
                onClick={() => handleAction("Print Admit Card")}
                className="bg-white text-[#144835] hover:bg-emerald-50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer size={14} /> Print Document
              </button>
              <button 
                onClick={() => handleAction("Validate Details")}
                className="bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
              >
                Validate Details
              </button>
            </div>
          </div>

          {/* Schedules list */}
          <div className="lg:w-1/3 space-y-4">
            {examResources.map((res, idx) => (
              <div 
                key={idx} 
                onClick={() => handleAction(res.action)}
                className="bg-white border border-gray-100 rounded-[16px] p-4 flex gap-4 items-center group hover:border-[#144835] transition-colors cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
              >
                <div className="bg-gray-100 text-[#144835] rounded-lg p-3 group-hover:bg-emerald-50 transition-colors shrink-0">
                  <res.icon size={18} />
                </div>
                <div className="flex-grow min-w-0">
                  <h6 className="text-xs font-extrabold text-gray-900">{res.title}</h6>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">{res.type}</p>
                  <div className="text-[#144835] group-hover:text-[#a2c144] font-bold text-xs uppercase tracking-wider mt-1 flex items-center gap-0.5">
                    {res.action} <ChevronRight size={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
