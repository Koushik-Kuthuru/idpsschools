"use client";

import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface StaffUpdateTabProps {
  schoolId: string;
}

export default function StaffUpdateTab({ schoolId }: StaffUpdateTabProps) {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [staffType, setStaffType] = useState<"teachers" | "non-teaching-staff">("teachers");
  
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadRoster = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const q = query(collection(db, "schools", schoolId, staffType));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const mapped = data.map((staff: any) => {
        const presentDates: string[] = staff.attendance?.presentDates || [];
        const absentDates: string[] = staff.attendance?.absentDates || [];
        
        let initialStatus = "";
        if (presentDates.includes(date)) initialStatus = "P";
        else if (absentDates.includes(date)) initialStatus = "A";
        
        return {
          id: staff.id,
          employeeId: staff.employeeId || "N/A",
          name: staff.name,
          department: staff.department || "N/A",
          status: initialStatus, // "P", "A", or ""
        };
      });

      // Sort by name safely
      mapped.sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB);
      });
      setRoster(mapped);
    } catch (err: any) {
      setErrorMessage("Failed to load staff roster: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadRoster();
    }
  }, [schoolId, date, staffType]);

  const handleStatusChange = (id: string, val: string) => {
    setRoster(prev => prev.map(s => s.id === id ? { ...s, status: val } : s));
  };

  const handleMarkAll = (val: string) => {
    setRoster(prev => prev.map(s => ({ ...s, status: val })));
  };

  const handleSaveUpdates = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const promises = roster.map(async (staff) => {
        // Only update if they have a status selected
        if (!staff.status) return;

        const staffRef = doc(db, "schools", schoolId, staffType, staff.id);
        
        // We fetch current doc to safely merge arrays
        const sDoc = await getDocs(query(collection(db, "schools", schoolId, staffType)));
        const getStaff = sDoc.docs.find(d => d.id === staff.id);
        if (!getStaff) return;
        
        const data = getStaff.data();
        let presentDates: string[] = data.attendance?.presentDates || [];
        let absentDates: string[] = data.attendance?.absentDates || [];
        
        // Remove from both lists first to clean up any previous entry for this date
        presentDates = presentDates.filter(d => d !== date);
        absentDates = absentDates.filter(d => d !== date);
        
        // Add to the new list based on current status
        if (staff.status === "P") {
          presentDates.push(date);
        } else if (staff.status === "A") {
          absentDates.push(date);
        }
        
        await updateDoc(staffRef, {
          "attendance.presentDates": presentDates,
          "attendance.absentDates": absentDates
        });
      });

      await Promise.all(promises);
      setSuccessMessage("Attendance updated successfully.");
    } catch (err: any) {
      setErrorMessage("Failed to save updates: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Type</label>
            <select
              value={staffType}
              onChange={(e) => setStaffType(e.target.value as any)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all"
            >
              <option value="teachers">Teaching Staff</option>
              <option value="non-teaching-staff">Non-Teaching Staff</option>
            </select>
          </div>
          <button
            onClick={loadRoster}
            disabled={loading}
            className="h-10 px-6 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Search size={16} />
            {loading ? "Loading..." : "Fetch Roster"}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Success</h4>
            <p className="text-xs text-emerald-700 mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Error</h4>
            <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {roster.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900">Mark Attendance</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 mr-2">Mark All:</span>
              <button
                onClick={() => handleMarkAll("P")}
                className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-200 transition-colors"
              >
                Present
              </button>
              <button
                onClick={() => handleMarkAll("A")}
                className="px-3 py-1.5 rounded-md bg-rose-100 text-rose-700 font-bold text-xs hover:bg-rose-200 transition-colors"
              >
                Absent
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-gray-700">{s.employeeId}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">{s.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${s.id}`}
                            checked={s.status === "P"}
                            onChange={() => handleStatusChange(s.id, "P")}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-600"
                          />
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">P</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                          <input
                            type="radio"
                            name={`status-${s.id}`}
                            checked={s.status === "A"}
                            onChange={() => handleStatusChange(s.id, "A")}
                            className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-600"
                          />
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">A</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              onClick={handleSaveUpdates}
              disabled={isSaving}
              className="px-6 py-2 bg-[#144835] text-white font-bold rounded-lg hover:bg-[#144835]/90 transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#144835]/20 disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
