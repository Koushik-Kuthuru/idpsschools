"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Bus, 
  Heart, 
  ClipboardList, 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  BadgeInfo,
  Clock
} from "lucide-react";

export default function ProfileView() {
  const { user } = useAuth();
  const student: any = user || {};

  const initials = student.studentName
    ? student.studentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ST";

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 font-jost space-y-4">
      {/* Hero Profile Section */}
      <div className="bg-white border border-gray-100 rounded-[16px] p-6 md:p-8 mb-4 flex flex-col md:flex-row gap-4 items-center md:items-start shadow-[0_2px_10px_rgba(0,0,0,0.04)] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a2c144]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Student Avatar */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-[#F8FAFB] flex items-center justify-center">
            {student.photo ? (
              <img 
                alt={student.studentName} 
                className="w-full h-full object-cover" 
                src={student.photo} 
              />
            ) : (
              <span className="text-4xl font-extrabold text-[#144835]">{initials}</span>
            )}
          </div>
        </div>

        {/* Hero Details */}
        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">
              {student.studentName || "Student Name"}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 self-center md:self-auto uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Active Status
            </span>
          </div>
          
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">
            Admission / Enrollment No: <span className="font-extrabold text-[#144835]">{student.admissionNo || student.registrationNo || "-"}</span>
          </p>

          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-[#F8FAFB] p-4 rounded-lg border border-gray-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendance</span>
              <span className="text-lg font-black text-[#144835] mt-1">92.5%</span>
            </div>
            <div className="bg-[#F8FAFB] p-4 rounded-lg border border-gray-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class</span>
              <span className="text-lg font-black text-gray-900 mt-1">{student.classId || student.grade || "-"}</span>
            </div>
            <div className="bg-[#F8FAFB] p-4 rounded-lg border border-gray-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Section</span>
              <span className="text-lg font-black text-gray-900 mt-1">{student.section || "-"}</span>
            </div>
            <div className="bg-[#F8FAFB] p-4 rounded-lg border border-gray-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Roll Number</span>
              <span className="text-lg font-black text-gray-900 mt-1">{student.rollNumber || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 1. Personal Information */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
              <User size={15} strokeWidth={2.5} />
            </div>
            <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider">
              Personal Information
            </h4>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1">
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Gender</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{student.gender || "-"}</span>
            </div>
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Date of Birth</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{student.dob || "-"}</span>
            </div>
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Blood Group</span>
              <span className="text-xs font-bold text-red-600 bg-red-50/20 px-3 py-2 rounded-lg border border-red-100/50">{student.bloodGroup || "-"}</span>
            </div>
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Aadhar Number</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{student.aadharNo || "-"}</span>
            </div>
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">SRN Number</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{student.srnNo || "-"}</span>
            </div>
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Nationality</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{student.nationality || "INDIAN"}</span>
            </div>
            <div className="md:col-span-2 flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">Permanent Address</span>
              <span className="text-xs font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 leading-relaxed">
                {[student.permAddress, student.permCity, student.permState].filter(Boolean).join(", ") || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Academic Information */}
        <div className="bg-white border border-gray-100 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
              <GraduationCap size={15} strokeWidth={2.5} />
            </div>
            <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider">
              Academic Info
            </h4>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">
            <div className="flex flex-col group">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Institution</span>
              <span className="text-xs font-extrabold text-[#144835] bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100/50">
                International Delhi Public School
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendance Target</span>
                <span className="text-xs font-extrabold text-[#144835]">92.5% / 100%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#144835] h-full rounded-full transition-all duration-500" style={{ width: "92.5%" }} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Class Details:</p>
              <div className="flex items-start gap-3 p-3 bg-amber-50/20 border border-amber-200/50 rounded-lg">
                <BadgeInfo className="text-amber-800 shrink-0" size={16} />
                <div>
                  <p className="text-xs font-extrabold text-amber-900">Academic Year 2024-25</p>
                  <p className="text-[10px] text-amber-700 font-bold uppercase mt-0.5">Medium: {student.mediumOfInstruction || "ENGLISH"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Parent / Guardian Information */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#F8FAFB] flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg border border-gray-200 text-[#144835] flex items-center justify-center bg-white shadow-sm">
              <Users size={15} strokeWidth={2.5} />
            </div>
            <h4 className="text-xs font-black text-[#144835] uppercase tracking-wider">
              Parent / Guardian Information
            </h4>
          </div>

          <div className="p-6 flex flex-col md:flex-row lg:flex-col gap-4">
            {/* Father Card */}
            <div className="flex-1 flex gap-4 p-4 rounded-lg border border-gray-100 hover:bg-[#F8FAFB] transition-all group">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <User size={18} className="text-[#144835]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h5 className="text-sm font-extrabold text-[#144835] truncate">{student.fatherName || "Father Name"}</h5>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Father</span>
                <p className="text-[11px] text-gray-500 font-bold mt-2">Mobile: <span className="text-gray-900">{student.fatherMobile1 || "-"}</span></p>
                <p className="text-[11px] text-gray-500 font-bold">Email: <span className="text-gray-900 truncate">{student.fatherEmail || "-"}</span></p>
              </div>
            </div>

            {/* Mother Card */}
            <div className="flex-1 flex gap-4 p-4 rounded-lg border border-gray-100 hover:bg-[#F8FAFB] transition-all group">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <User size={18} className="text-[#144835]" />
              </div>
              <div className="flex flex-col min-w-0">
                <h5 className="text-sm font-extrabold text-[#144835] truncate">{student.motherName || "Mother Name"}</h5>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Mother</span>
                <p className="text-[11px] text-gray-500 font-bold mt-2">Mobile: <span className="text-gray-900">{student.motherMobile1 || "-"}</span></p>
                <p className="text-[11px] text-gray-500 font-bold">Email: <span className="text-gray-900 truncate">{student.motherEmail || "-"}</span></p>
              </div>
            </div>
          </div>

          {/* Emergency Alert Footer */}
          <div className="px-6 pb-6 mt-auto">
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-red-500 rounded-lg p-1.5 text-white shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Emergency Contact</p>
                <p className="text-xs font-black text-red-950 mt-0.5 truncate">
                  {student.fatherName || student.motherName}: <span className="underline">{student.fatherMobile1 || student.motherMobile1 || "-"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
