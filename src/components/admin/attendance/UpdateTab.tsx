"use client";

import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, RotateCw, Save, CheckCircle2, AlertCircle } from "lucide-react";
import AttendanceTabGuide, { AttendanceTabLoading } from "./AttendanceTabGuide";
import { updateGuide } from "./attendanceGuidePresets";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const gradeLabel = (grade: string) => {
  if (!grade || grade === "All") return "All";
  const num = parseInt(grade, 10);
  if (isNaN(num)) return grade;
  const ordinals = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"];
  const v = num % 100;
  return num + (ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0]);
};

interface UpdateTabProps {
  schoolId: string;
  classOptions: string[];
  sectionOptions: string[];
}

export default function UpdateTab({ schoolId, classOptions, sectionOptions }: UpdateTabProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("All");
  
  const [roster, setRoster] = useState<any[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFetchData = async () => {
    setIsLoading(true);
    setRoster([]);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const q = query(collection(db, "schools", schoolId, "students"));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const filtered = students.filter(s => {
        const classId = String(s.classId || "").trim();
        const sec = String(s.section || "").trim().toUpperCase();
        const matchClass = selectedClass === "All" || classId === selectedClass;
        const matchSection = selectedSection === "All" || sec === selectedSection;
        return matchClass && matchSection;
      });

      const rosterData = filtered.map(s => {
        let status = "None";
        if (s.attendance?.presentDates?.includes(date)) status = "P";
        else if (s.attendance?.absentDates?.includes(date)) status = "A";

        return {
          id: s.id,
          roll: String(s.rollNumber || "-"),
          admNo: String(s.admissionNumber || "-"),
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
          classId: s.classId || "-",
          section: s.section || "-",
          status
        };
      });

      rosterData.sort((a, b) => a.name.localeCompare(b.name));
      setRoster(rosterData);
      setHasFetched(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    setRoster(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
  };

  const handleSaveUpdates = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      // Create updates using batch or simple setDocs
      // To keep it simple without complex batching for now, we'll do sequential promises (since it's an update tool for a few students)
      const promises = roster.map(async (student) => {
        const studentRef = doc(db, "schools", schoolId, "students", student.id);
        const sDoc = await getDocs(query(collection(db, "schools", schoolId, "students"))); // actually we should fetch current attendance to update safely without overwriting
        // It's better to fetch the doc individually
        const getStudent = sDoc.docs.find(d => d.id === student.id);
        if (!getStudent) return;
        
        const data = getStudent.data();
        let presentDates: string[] = data.attendance?.presentDates || [];
        let absentDates: string[] = data.attendance?.absentDates || [];
        
        // Remove from both lists first to clean up
        presentDates = presentDates.filter(d => d !== date);
        absentDates = absentDates.filter(d => d !== date);
        
        // Add to the new list based on current status
        if (student.status === "P") {
          presentDates.push(date);
        } else if (student.status === "A") {
          absentDates.push(date);
        }
        
        await setDoc(studentRef, {
          attendance: {
            ...data.attendance,
            presentDates,
            absentDates,
            lastUpdated: new Date().toISOString()
          }
        }, { merge: true });
      });

      await Promise.all(promises);
      setSuccessMessage("Attendance updated successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to save updates.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 flex flex-col gap-3 shadow-sm w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide shrink-0 leading-none">Update Attendance</h3>
          <div className="flex flex-wrap items-end gap-4 min-w-0">
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All Classes</option>
              {classOptions.map((g) => (
                <option key={g} value={g}>{gradeLabel(g)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
            >
              <option value="All">All Sections</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
          >
            {isLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
            {isLoading ? "Loading..." : "Fetch"}
          </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">Select a past date, class, and section to correct previously marked attendance.</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="text-xs font-bold">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={16} className="text-rose-500" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {!hasFetched && !isLoading ? <AttendanceTabGuide {...updateGuide} /> : null}
      {isLoading && !hasFetched ? <AttendanceTabLoading label="Fetching roster…" /> : null}

      {hasFetched && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Update Roster - {date}</h3>
            <button
              onClick={handleSaveUpdates}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#a2c144] px-4 py-2 text-xs font-bold text-[#144835] shadow-sm hover:bg-[#b5d351] transition-all disabled:opacity-70"
            >
              {isSaving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Updates
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100/50">
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Adm. No.</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Name</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200">Class</th>
                  <th className="px-4 py-3 font-bold text-gray-600 border-b border-gray-200 w-48">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {roster.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-600">{row.admNo}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{gradeLabel(row.classId)} - {row.section}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-lg border border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.id, row.status === "P" ? "None" : "P")}
                            className={cn(
                              "px-3 py-1 rounded text-xs font-bold transition-all",
                              row.status === "P"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-gray-600 hover:bg-white hover:text-emerald-600"
                            )}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.id, row.status === "A" ? "None" : "A")}
                            className={cn(
                              "px-3 py-1 rounded text-xs font-bold transition-all",
                              row.status === "A"
                                ? "bg-red-500 text-white shadow-sm"
                                : "text-gray-600 hover:bg-white hover:text-red-600"
                            )}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
