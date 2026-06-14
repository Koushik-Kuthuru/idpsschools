"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import AdminPageHeader from "@/components/admin/PageHeader";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  Download,
  Save,
  Search,
  Users,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  User,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { collection, onSnapshot, query, orderBy, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExportButton from "@/components/ui/ExportButton";
import TableRowActions from "@/components/ui/TableRowActions";
import { deleteSchoolDocument } from "@/lib/deleteSchoolDocument";
import {
  calculateAttendanceStats,
  classifyAttendanceDay,
  getAttendanceStatusForDate,
  type AttendanceMarkStatus,
  type HolidayEntry,
} from "@/utils/attendance";
import AttendanceMarkCell from "@/components/admin/attendance/AttendanceMarkCell";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import AbsentLogTab from "@/components/admin/attendance/AbsentLogTab";
// import UpdateTab from "@/components/admin/attendance/UpdateTab";
// import DatewiseSummaryTab from "@/components/admin/attendance/DatewiseSummaryTab";
// import ContinuousAbsentTab from "@/components/admin/attendance/ContinuousAbsentTab";
import ClasswiseStatusTab from "@/components/admin/attendance/ClasswiseStatusTab";
import AttendanceTabGuide, { AttendanceTabLoading } from "@/components/admin/attendance/AttendanceTabGuide";
import { registerGuide } from "@/components/admin/attendance/attendanceGuidePresets";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export type AttendanceStatus = AttendanceMarkStatus;

export type StudentAttendanceRow = {
 roll: string;
 admissionNumber: string;
 name: string;
 fatherName: string;
 classSection: string;
 studentId: string;
 classId: string;
 section: string;
 gender: "Male" | "Female";
 attendancePercent: number;
 status: AttendanceStatus;
 remarks: string;
};

function getAvatarColor(name: string) {
 const colors = [
 "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", 
 "bg-amber-100 text-amber-700", "bg-green-100 text-green-700", 
 "bg-emerald-100 text-emerald-700", "bg-teal-100 text-teal-700", 
 "bg-cyan-100 text-cyan-700", "bg-blue-100 text-blue-700", 
 "bg-indigo-100 text-indigo-700", "bg-violet-100 text-violet-700", 
 ];
 const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
 return colors[index];
}

const REGISTER_SUMMARY_HEADERS = ["TD", "TW", "TP", "%", "PMP", "GTP", "PMW", "GTW", "%"] as const;
const REGISTER_DAY_W = 32;
const REGISTER_SUMMARY_W = 48;

function registerSummaryRight(index: number) {
 return (REGISTER_SUMMARY_HEADERS.length - 1 - index) * REGISTER_SUMMARY_W;
}

export default function AdminAttendancePage() {
 const schoolId = useSchoolId();
 const allClassesKey = "All";
 const allSectionsKey = "All";
 const [activeTab, setActiveTab] = useState("Mark");
 const tabs = [
   "Mark",
   "Absent Log",
   "Register",
   "Classwise Status",
 ];
 const [academicDate, setAcademicDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
 const [classOptions, setClassOptions] = useState<string[]>([]);
 const [sectionOptions, setSectionOptions] = useState<string[]>([]);
 const [grade, setGrade] = useState<string>(allClassesKey);
 const [section, setSection] = useState<string>(allSectionsKey);
 const [holidayEntries, setHolidayEntries] = useState<HolidayEntry[]>([]);
 const holidayDates = useMemo(
  () => holidayEntries.map((h) => h.date).filter(Boolean),
  [holidayEntries]
 );

 useEffect(() => {
  const unsub = onSnapshot(collection(db, "schools", schoolId, "holidays"), (snap) => {
   setHolidayEntries(
    snap.docs
     .map((d) => {
      const data = d.data();
      return {
       date: String(data.date || "").trim(),
       name: String(data.name || "").trim(),
       type: String(data.type || "").trim(),
      };
     })
     .filter((h) => h.date)
   );
  });
  return () => unsub();
 }, [schoolId]);

 const markDayInfo = useMemo(
  () => classifyAttendanceDay(academicDate, holidayEntries),
  [academicDate, holidayEntries]
 );
  const [sortBy, setSortBy] = useState<"name" | "admissionNumber">("name");
  const [roster, setRoster] = useState<StudentAttendanceRow[]>([]);
 const [searchQuery, setSearchQuery] = useState<string>("");
 const [selected, setSelected] = useState<Record<string, boolean>>({});
 const [isSaving, setIsSaving] = useState(false);
 const [loadError, setLoadError] = useState<string | null>(null);

 // View Tab States
 const [viewFromDate, setViewFromDate] = useState<string>(() => {
   const d = new Date();
   d.setDate(d.getDate() - 7);
   return d.toISOString().split('T')[0];
 });
 const [viewToDate, setViewToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
 const [viewGrade, setViewGrade] = useState<string>(allClassesKey);
 const [viewSection, setViewSection] = useState<string>(allSectionsKey);
 const [viewGraphData, setViewGraphData] = useState<{date: string, present: number, absent: number, total: number}[] | null>(null);
 const [viewListData, setViewListData] = useState<{name: string, classId: string, section: string, roll: string, date: string, status: string}[] | null>(null);
 const [viewMode, setViewMode] = useState<"list" | "graph">("list");
 const [isViewLoading, setIsViewLoading] = useState(false);

 // Register Tab States
 const [registerMonth, setRegisterMonth] = useState<string>(() => {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
 });
 const [registerClass, setRegisterClass] = useState<string>(allClassesKey);
 const [registerSection, setRegisterSection] = useState<string>(allSectionsKey);
 const [registerData, setRegisterData] = useState<{year: number, month: number, daysInMonth: number, rows: any[], dayTotals: Record<number, number>} | null>(null);
 const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const snap = await getDocs(collection(db, "schools", schoolId, "classes"));
        const raw = snap.docs.map((d) => d.data());
        
        const grades = raw.map(c => String(c.grade ?? c.name ?? "").trim()).filter(Boolean);
        const sections = raw.map(c => String(c.section ?? "").trim().toUpperCase()).filter(Boolean);

        const uniqueGrades = Array.from(new Set(grades)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const uniqueSections = Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b));

        setClassOptions([allClassesKey, ...uniqueGrades]);
        setSectionOptions([allSectionsKey, ...uniqueSections]);
      } catch (err) {
        console.error("Failed to load classes meta:", err);
      }
    }
    loadMeta();
  }, [schoolId, allClassesKey, allSectionsKey]);

 const gradeLabel = (g: string) => {
    if (g === allClassesKey || g === 'all') return 'All Classes';
    return /^\d+$/.test(g) ? `Grade ${g}` : g;
  };

 const sectionLabel = (s: string) => {
  if (s === allSectionsKey) return "All Sections";
  return s;
 };

 useEffect(() => {
 if (classOptions.length && !classOptions.includes(grade)) setGrade(allClassesKey);
 }, [classOptions, grade, allClassesKey]);

 useEffect(() => {
 if (sectionOptions.length && !sectionOptions.includes(section)) setSection(allSectionsKey);
 }, [sectionOptions, section, allSectionsKey]);

 const loadRoster = useCallback(async (nextGrade: string, nextSection: string, date: string) => {
    try {
      setLoadError(null);
      const q = query(collection(db, "schools", schoolId, "students"));
      const snapshot = await getDocs(q);

      const filteredStudents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: any) => {
          const classId = String(s.classId || "").trim();
          const studentSection = String(s.section || "").trim().toUpperCase();
          const wantGrade = String(nextGrade || "").trim();
          const wantSection = String(nextSection || "").trim().toUpperCase();
          
          const matchClass = wantGrade.toLowerCase() === allClassesKey.toLowerCase() || classId === wantGrade;
          const matchSection = wantSection.toLowerCase() === allSectionsKey.toLowerCase() || studentSection === wantSection;
          
          return matchClass && matchSection;
        });

      const rosterData = filteredStudents.map((s: any, idx): StudentAttendanceRow => {
        // Calculate real attendance percentage using dynamic holidays
        const stats = calculateAttendanceStats(
          s.attendance?.presentDates || [],
          s.attendance?.absentDates || [],
          s.attendance?.lateDates || [],
          undefined, // start date
          undefined, // end date
          holidayDates
        );

        const classId = String(s.classId || "-").trim();
        const studentSection = String(s.section || "-").trim().toUpperCase();
        const classLabel = /^\d+$/.test(classId) ? `Grade ${classId}` : classId;

        return {
          roll: String(s.rollNumber || idx + 1),
          admissionNumber: String(s.admissionNumber || s.rollNumber || s.id || idx + 1),
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
          fatherName: String(s.fatherName || "").trim() || "-",
          classSection: `${classLabel}-${studentSection}`,
          studentId: String(s.id),
          classId,
          section: studentSection,
          gender: s.gender === "Female" ? "Female" : "Male",
          attendancePercent: stats.percentage,
          status: getAttendanceStatusForDate(s.attendance, date),
          remarks: "",
        };
      });

      setRoster(rosterData);
      setSelected({});
    } catch (e: any) {
      setRoster([]);
      setSelected({});
      setLoadError(e?.message || "Failed to load roster");
    }
  }, [schoolId, allClassesKey, allSectionsKey, holidayDates]);

 useEffect(() => {
 setAcademicDate(new Date().toISOString().split('T')[0]);
 }, []);

 useEffect(() => {
   loadRoster(grade, section, academicDate);
 }, [grade, section, academicDate, loadRoster]);

 const totals = useMemo(() => {
 const total = roster.length;
 const present = roster.filter((r) => r.status === "P").length;
 const absent = roster.filter((r) => r.status === "A").length;
 return { total, present, absent };
 }, [roster]);

 const filteredRoster = useMemo(() => {
    let result = roster;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((r) => `${r.name} ${r.fatherName} ${r.classSection} ${r.admissionNumber} ${r.roll}`.toLowerCase().includes(q));
    }
    
    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else {
        const valA = String(a.admissionNumber || "");
        const valB = String(b.admissionNumber || "");
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

    return result;
  }, [searchQuery, roster, sortBy]);

 const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
 const allSelectedOnPage = filteredRoster.length > 0 && filteredRoster.every((r) => selected[r.studentId]);
 const updateStudentStatus = (studentId: string, status: AttendanceMarkStatus) => {
  setRoster((prev) =>
   prev.map((x) =>
    x.studentId === studentId
     ? { ...x, status, remarks: status === "A" ? x.remarks : "" }
     : x
   )
  );
 };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleReset = () => {
    setGrade(allClassesKey);
    setSection(allSectionsKey);
    setSearchQuery("");
    setSortBy("name");
    setAcademicDate(new Date().toISOString().split('T')[0]);
  };

  const handleViewSubmit = async () => {
    setIsViewLoading(true);
    setViewGraphData(null);
    try {
      const q = query(collection(db, "schools", schoolId, "students"));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filtered = students.filter((s: any) => {
        const classId = String(s.classId || "").trim();
        const studentSection = String(s.section || "").trim().toUpperCase();
        const wantGrade = String(viewGrade || "").trim();
        const wantSection = String(viewSection || "").trim().toUpperCase();
        
        const matchClass = wantGrade.toLowerCase() === allClassesKey.toLowerCase() || classId === wantGrade;
        const matchSection = wantSection.toLowerCase() === allSectionsKey.toLowerCase() || studentSection === wantSection;
        
        return matchClass && matchSection;
      });

      const start = new Date(viewFromDate);
      const end = new Date(viewToDate);
      const data = [];
      const listData: any[] = [];
      
      let current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay();
        
        const isSunday = dayOfWeek === 0;
        const isHoliday = holidayDates.includes(dateStr);

        if (!isSunday && !isHoliday) {
          let present = 0;
          let absent = 0;
          filtered.forEach((s: any) => {
            const isPresent = s.attendance?.presentDates?.includes(dateStr);
            const isAbsent = s.attendance?.absentDates?.includes(dateStr);
            let status = 'Unmarked';
            if (isPresent) { present++; status = 'Present'; }
            else if (isAbsent) { absent++; status = 'Absent'; }
            
            listData.push({
              name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
              classId: String(s.classId || "-"),
              section: String(s.section || "-").toUpperCase(),
              roll: String(s.rollNumber || "-"),
              date: dateStr,
              status
            });
          });
          data.push({
            date: dateStr,
            present,
            absent,
            total: filtered.length
          });
        }
        current.setDate(current.getDate() + 1);
      }
      
      // Sort listData by date descending, then name
      listData.sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.name.localeCompare(b.name);
      });

      setViewGraphData(data);
      setViewListData(listData);
    } catch (err: any) {
      console.error(err);
      setLoadError("Failed to load attendance view data.");
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    window.dispatchEvent(new CustomEvent('collapse-sidebar'));
    setIsRegisterLoading(true);
    setRegisterData(null);
    try {
      const q = query(collection(db, "schools", schoolId, "students"));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filtered = students.filter((s: any) => {
        const classId = String(s.classId || "").trim();
        const studentSection = String(s.section || "").trim().toUpperCase();
        const wantGrade = String(registerClass || "").trim();
        const wantSection = String(registerSection || "").trim().toUpperCase();
        
        const matchClass = wantGrade.toLowerCase() === allClassesKey.toLowerCase() || classId === wantGrade;
        const matchSection = wantSection.toLowerCase() === allSectionsKey.toLowerCase() || studentSection === wantSection;
        
        return matchClass && matchSection;
      });

      const [yearStr, monthStr] = registerMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // 0-indexed
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const data = filtered.map((s: any) => {
        const attendanceMap: Record<number, string> = {};
        let totalWorking = 0;
        let totalPresent = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month, day);
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const isSunday = currentDate.getDay() === 0;
          const isHoliday = holidayDates.includes(dateStr);
          
          if (isSunday) {
            attendanceMap[day] = 'S';
          } else if (isHoliday) {
            attendanceMap[day] = 'H';
          } else {
            totalWorking++;
            if (s.attendance?.presentDates?.includes(dateStr)) {
              attendanceMap[day] = 'P';
              totalPresent++;
            } else if (s.attendance?.absentDates?.includes(dateStr)) {
              attendanceMap[day] = 'A';
            } else {
              attendanceMap[day] = '-';
            }
          }
        }
        
        return {
          id: s.id,
          roll: String(s.rollNumber || "-"),
          admNo: String(s.admissionNumber || "-"),
          name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed',
          fatherName: String(s.fatherName || s.parentName || "Not Available"),
          classSection: `${gradeLabel(s.classId || "-")}-${s.section || "-"}`,
          attendanceMap,
          totalWorking,
          totalPresent,
          pmp: 0, // Mocked for now, as fetching full history is expensive
          pmw: 0,
        };
      });
      
      data.sort((a, b) => a.name.localeCompare(b.name));

      const dayTotals: Record<number, number> = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dayTotals[day] = data.reduce((acc, row) => acc + (row.attendanceMap[day] === 'P' ? 1 : 0), 0);
      }
      
      setRegisterData({
        year,
        month,
        daysInMonth,
        rows: data,
        dayTotals
      });
    } catch (err: any) {
      console.error(err);
      setLoadError("Failed to load register data.");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!viewListData || viewListData.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(
      viewListData.map(row => ({
        "Date": row.date,
        "Student Name": row.name,
        "Class": gradeLabel(row.classId),
        "Section": row.section,
        "Roll No": row.roll,
        "Attendance Status": row.status
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_Report_${viewGrade}_${viewSection}.xlsx`);
  };

  const handleRegisterExportExcel = () => {
    if (!registerData || registerData.rows.length === 0) return;
    const wsData = registerData.rows.map((row: any, idx: number) => {
      const gtp = row.totalPresent + row.pmp;
      const gtw = row.totalWorking + row.pmw;
      const obj: any = {
        "#": idx + 1,
        "Adm. No.": row.admNo,
        "Student Name": row.name,
        "Father Name": row.fatherName,
        "Class": row.classSection,
      };
      for (let i = 1; i <= registerData.daysInMonth; i++) {
        obj[String(i)] = row.attendanceMap[i] || '';
      }
      obj["TD"] = registerData.daysInMonth;
      obj["TW"] = row.totalWorking;
      obj["TP"] = row.totalPresent;
      obj["%"] = row.totalWorking > 0 ? ((row.totalPresent / row.totalWorking) * 100).toFixed(2) : 0;
      obj["PMP"] = row.pmp;
      obj["GTP"] = gtp;
      obj["PMW"] = row.pmw;
      obj["GTW"] = gtw;
      obj["G%"] = gtw > 0 ? ((gtp / gtw) * 100).toFixed(2) : 0;
      return obj;
    });

    const footerObj: any = {
      "#": "Total Present",
      "Adm. No.": "",
      "Student Name": "",
      "Father Name": "",
      "Class": "",
    };
    for (let i = 1; i <= registerData.daysInMonth; i++) {
      footerObj[String(i)] = registerData.dayTotals[i] || 0;
    }
    const overallTp = registerData.rows.reduce((acc, r) => acc + r.totalPresent, 0);
    footerObj["TD"] = "";
    footerObj["TW"] = "";
    footerObj["TP"] = overallTp;
    wsData.push(footerObj);

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Register");
    XLSX.writeFile(wb, `Attendance_Register_${registerMonth}.xlsx`);
  };

  const handleRegisterExportPDF = () => {
    if (!registerData || registerData.rows.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(10);
    doc.text(`Attendance Register - ${new Date(registerData.year, registerData.month).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 15);
    
    const head1 = ["#", "Adm. No.", "Student Name", "Father Name", "Class"];
    for (let i = 1; i <= registerData.daysInMonth; i++) head1.push(String(i));
    head1.push("TD", "TW", "TP", "%", "PMP", "GTP", "PMW", "GTW", "G%");

    const body = registerData.rows.map((row: any, idx: number) => {
      const gtp = row.totalPresent + row.pmp;
      const gtw = row.totalWorking + row.pmw;
      const r = [
        String(idx + 1), row.admNo, row.name, row.fatherName, row.classSection
      ];
      for (let i = 1; i <= registerData.daysInMonth; i++) r.push(row.attendanceMap[i] || '');
      r.push(
        String(registerData.daysInMonth),
        String(row.totalWorking),
        String(row.totalPresent),
        row.totalWorking > 0 ? ((row.totalPresent / row.totalWorking) * 100).toFixed(1) : "0",
        String(row.pmp),
        String(gtp),
        String(row.pmw),
        String(gtw),
        gtw > 0 ? ((gtp / gtw) * 100).toFixed(1) : "0"
      );
      return r;
    });

    const footerRow: any[] = [{ content: "Total Present", colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 232, 204] } }];
    for (let i = 1; i <= registerData.daysInMonth; i++) footerRow.push({ content: String(registerData.dayTotals[i] || 0), colSpan: 1, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 232, 204] } });
    const overallTp = registerData.rows.reduce((acc, r) => acc + r.totalPresent, 0);
    footerRow.push(
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: String(overallTp), colSpan: 1, styles: { fontStyle: 'bold', fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } },
      { content: "", colSpan: 1, styles: { fillColor: [255, 232, 204] } }
    );
    body.push(footerRow);

    autoTable(doc, {
      startY: 20,
      head: [head1],
      body: body,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [20, 72, 53] }, // #144835
    });
    
    doc.save(`Attendance_Register_${registerMonth}.pdf`);
  };

  const handleExportPDF = () => {
    if (!viewListData || viewListData.length === 0) return;
    
    const doc = new jsPDF();
    const title = `Attendance Report - ${gradeLabel(viewGrade)} ${viewSection}`;
    
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    
    const tableData = viewListData.map((row, idx) => [
      idx + 1,
      row.date,
      row.name,
      gradeLabel(row.classId),
      row.section,
      row.roll,
      row.status
    ]);
    
    autoTable(doc, {
      startY: 20,
      head: [["#", "Date", "Name", "Class", "Section", "Roll No", "Status"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [20, 72, 53] }
    });
    
    doc.save(`Attendance_Report_${viewGrade}_${viewSection}.pdf`);
  };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
 {loadError && (
 <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
 {loadError}
 </div>
 )}
  {/* Top Header */}
 <AdminPageHeader
  title="Attendance"
  description="Mark and review daily student attendance by class and section"
 />

 {/* Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Students</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{totals.total}</p>
    </div>
    <div className="h-10 w-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center">
      <Users size={20} />
    </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Present</p>
      <p className="text-2xl font-bold text-emerald-600 mt-1">{totals.present}</p>
    </div>
    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
      <CheckCircle2 size={20} />
    </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Absent</p>
      <p className="text-2xl font-bold text-rose-600 mt-1">{totals.absent}</p>
    </div>
    <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
      <AlertCircle size={20} />
    </div>
  </div>
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance %</p>
      <p className="text-2xl font-bold text-[#144835] mt-1">
        {totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0}%
      </p>
    </div>
    <div className="h-10 w-10 rounded-lg bg-[#144835]/10 text-[#144835] flex items-center justify-center">
      <TrendingUp size={20} />
    </div>
  </div>
 </div>

 {/* Tabs Navigation */}
 <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide">
  {tabs.map((tab) => (
   <button
    key={tab}
    onClick={() => setActiveTab(tab)}
    className={cn(
     "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2",
     activeTab === tab
      ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
      : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    )}
   >
    {tab}
   </button>
  ))}
 </div>

 {activeTab === "Mark" ? (
  <div className="space-y-4 animate-in fade-in duration-300">
   {/* Top Filter Bar */}
   <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
 <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
 <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
 <div className="flex items-center gap-1.5">
   <button 
     type="button"
     onClick={() => {
       if (!academicDate) return;
       const d = new Date(academicDate);
       d.setDate(d.getDate() - 1);
       setAcademicDate(d.toISOString().split('T')[0]);
     }}
     className="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors"
   >
     <ChevronLeft size={16} />
   </button>
   <div className="relative flex-1">
     <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     <input
       type="date"
       value={academicDate}
       onChange={(e) => setAcademicDate(e.target.value)}
       className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
     />
   </div>
   <button 
     type="button"
     onClick={() => {
       if (!academicDate) return;
       const d = new Date(academicDate);
       d.setDate(d.getDate() + 1);
       setAcademicDate(d.toISOString().split('T')[0]);
     }}
     className="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-500 hover:text-[#144835] hover:bg-[#144835]/10 transition-colors"
   >
     <ChevronRight size={16} />
   </button>
 </div>
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
 <select
 value={grade}
 onChange={(e) => setGrade(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
 >
 {classOptions.map((g) => (
 <option key={g} value={g}>{gradeLabel(g)}</option>
 ))}
 </select>
 </div>

 <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
 <select
 value={section}
 onChange={(e) => setSection(e.target.value)}
 className={cn(
 "w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
 )}
 >
 {sectionOptions.map((s) => (
 <option key={s} value={s}>{sectionLabel(s)}</option>
 ))}
 </select>
 </div>

 <button onClick={handleReset} className="h-9 px-4 flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-bold shrink-0 mt-1" title="Reset Filters">
  <RotateCw size={12} /> Reset
 </button>
 </div>

 <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
 <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sort By</label>
 <select
   value={sortBy}
   onChange={(e) => setSortBy(e.target.value as any)}
   className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50 appearance-none"
 >
   <option value="name">Sort by Name</option>
   <option value="admissionNumber">Sort by Admission No.</option>
 </select>
 </div>
 <div className="flex flex-col gap-1.5 w-full sm:w-[240px]">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Search</label>
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all placeholder:text-gray-400"
 placeholder="Search students..."
 />
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
 <div className="px-5 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
 <div className="flex items-center gap-3">
 <h2 className="text-sm font-bold text-gray-800">Attendance Roster</h2>
 <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-gray-50 px-2 py-1 rounded border border-gray-200">
 <span className="text-gray-600">Total: {totals.total}</span>
 <div className="w-1 h-1 rounded-full bg-gray-300"></div>
 <span className="text-emerald-600">Present: {totals.present}</span>
 <div className="w-1 h-1 rounded-full bg-gray-300"></div>
 <span className="text-red-600">Absent: {totals.absent}</span>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <ExportButton data={filteredRoster} filename="Attendance" className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm" iconSize={12} />
 <button
 onClick={handleSave}
 disabled={isSaving || !markDayInfo.canMark}
 className="h-8 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-4 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
 title={!markDayInfo.canMark ? `${markDayInfo.label} — marking not required` : undefined}
 >
 {isSaving ? <RotateCw size={12} className="animate-spin" /> : <Save size={12} />}
 {isSaving ? "Saving..." : "Save"}
 </button>
 </div>
 </div>

 {!markDayInfo.canMark ? (
 <div className="px-5 py-2.5 border-b border-purple-100 bg-purple-50/80 text-xs font-bold text-purple-700">
  {markDayInfo.label} — no attendance marking required for this date.
 </div>
 ) : null}

 {/* Bulk Actions */}
 {markDayInfo.canMark && selectedCount > 0 && (
 <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in slide-in-from-top-2">
 <div className="flex items-center gap-1.5">
 <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
 {selectedCount}
 </span>
 <span className="text-xs font-bold text-blue-900">students selected</span>
 </div>
 <div className="flex flex-wrap items-center gap-1.5">
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((r) => (selected[r.studentId] ? { ...r, status: "P", remarks: "" } : r)))}
 className="h-7 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
 >
 <CheckCircle2 size={12} /> Mark Present
 </button>
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((r) => (selected[r.studentId] ? { ...r, status: "A" } : r)))}
 className="h-7 inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
 >
 <AlertCircle size={12} /> Mark Absent
 </button>
 {markDayInfo.mode === "halfday" ? (
 <button
 type="button"
 onClick={() => setRoster((prev) => prev.map((r) => (selected[r.studentId] ? { ...r, status: "HD", remarks: "" } : r)))}
 className="h-7 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
 >
 Half Day
 </button>
 ) : null}
 <div className="w-px h-3 bg-blue-200 mx-0.5"></div>
 <button 
 type="button" 
 onClick={() => setSelected({})}
 className="h-7 inline-flex items-center gap-1 rounded text-xs font-bold text-blue-700 hover:bg-blue-100/50 px-2 transition-colors"
 >
 Clear
 </button>
 </div>
 </div>
 )}

 <div className="overflow-x-auto overflow-y-visible pb-32">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="px-5 py-3 w-[40px]">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={allSelectedOnPage}
 onChange={(e) => {
 const checked = e.target.checked;
 setSelected((prev) => {
 const next = { ...prev };
 filteredRoster.forEach((r) => {
 next[r.studentId] = checked;
 });
 return next;
 });
 }}
 />
 </th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Roll</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Father Name</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
 <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Attendance</th>
 <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-12"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {filteredRoster.length > 0 ? (
 filteredRoster.map((r) => {
 const initials = r.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
 const present = r.status === "P";
 const absent = r.status === "A";
 const avatarColor = getAvatarColor(r.name);

 return (
 <tr key={r.studentId} className={cn("transition-colors group", selected[r.studentId] ? "bg-blue-50/30" : "hover:bg-gray-50/50")}>
 <td className="px-5 py-2.5">
 <input
 type="checkbox"
 className="h-3.5 w-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] transition-colors cursor-pointer"
 checked={Boolean(selected[r.studentId])}
 onChange={(e) => setSelected((prev) => ({ ...prev, [r.studentId]: e.target.checked }))}
 />
 </td>
 <td className="px-5 py-2.5">
 <span className="text-xs font-bold text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded">{r.roll}</span>
 </td>
 <td className="px-5 py-2.5">
 <div className="flex items-center gap-2.5">
 <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor)}>
 {initials}
 </div>
 <div>
 <p className="text-xs font-bold text-gray-900">{r.name}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{r.admissionNumber}</p>
 </div>
 </div>
 </td>
 <td className="px-5 py-2.5">
 <p className="text-xs font-semibold text-gray-700">{r.fatherName}</p>
 </td>
 <td className="px-5 py-2.5">
 <span className="text-xs font-bold text-gray-800 bg-gray-100/80 px-2 py-0.5 rounded whitespace-nowrap">{r.classSection}</span>
 </td>
 <td className="px-3 py-2 text-center align-middle">
 <AttendanceMarkCell
 dayInfo={markDayInfo}
 status={r.status}
 attendancePercent={r.attendancePercent}
 remarks={r.remarks}
 onStatusChange={(status: any) => updateStudentStatus(r.studentId, status)}
 onRemarksChange={(remarks: string) =>
  setRoster((prev) => prev.map((x) => (x.studentId === r.studentId ? { ...x, remarks } : x)))
 }
 />
 </td>
 <td className="px-5 py-2.5 text-right">
 <TableRowActions
 items={[
 { label: "View Profile", icon: User, href: `/schools/${schoolId}/admin/academic/students/${r.studentId}/profile?tab=Attendance` },
 { label: "Edit Student", icon: Pencil, href: `/schools/${schoolId}/admin/academic/students/${r.studentId}/edit` },
 {
 label: "Delete",
 icon: Trash2,
 destructive: true,
 dividerBefore: true,
 confirmMessage: `Delete ${r.name}? This cannot be undone.`,
 onClick: () => deleteSchoolDocument(schoolId, "students", r.studentId),
 },
 ]}
 />
 </td>
 </tr>
 );
 })
 ) : (
 <tr>
 <td colSpan={7} className="px-5 py-8 text-center">
 <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
 <Search size={24} className="text-gray-400" />
 </div>
 <p className="text-sm font-bold text-gray-900">No students found</p>
 <p className="text-xs text-gray-500 mt-1">Try adjusting your search query.</p>
 <button 
 onClick={() => setSearchQuery("")}
 className="mt-4 text-xs font-bold text-[#144835] hover:underline"
 >
 Clear search
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
  </div>
 ) : activeTab === "Register" ? (
  <div className="space-y-4 animate-in fade-in duration-300 w-full min-w-0">
    <div className="bg-white rounded-xl border border-gray-200 px-5 pb-5 pt-3 shadow-sm w-full min-w-0">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 w-full sm:w-[140px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class</label>
          <select
            value={registerClass}
            onChange={(e) => setRegisterClass(e.target.value)}
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
          >
            {classOptions.map((g) => (
              <option key={g} value={g}>{gradeLabel(g)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Section</label>
          <select
            value={registerSection}
            onChange={(e) => setRegisterSection(e.target.value)}
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
          >
            {sectionOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Month</label>
          <select
            value={registerMonth}
            onChange={(e) => setRegisterMonth(e.target.value)}
            className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all hover:bg-gray-50"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
        </div>
        <button
          onClick={handleRegisterSubmit}
          disabled={isRegisterLoading}
          className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] px-5 text-xs font-bold text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90 transition-all disabled:opacity-70"
        >
          {isRegisterLoading ? <RotateCw size={14} className="animate-spin" /> : <Search size={14} />}
          {isRegisterLoading ? "Loading..." : "Submit"}
        </button>
      </div>
    </div>

    {!registerData && !isRegisterLoading ? (
      <AttendanceTabGuide {...registerGuide} />
    ) : null}

    {isRegisterLoading && !registerData ? (
      <AttendanceTabLoading label="Loading register…" />
    ) : null}

    {registerData && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full min-w-0 max-w-full overflow-x-clip">
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2 min-w-0">
            <CalendarDays size={16} className="text-[#144835] shrink-0" />
            <span className="truncate">Monthly Register - {new Date(registerData.year, registerData.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          </h3>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-normal text-gray-500 mr-1 sm:mr-4 sm:border-r border-gray-200 sm:pr-4 flex-wrap">
              <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div> P</span>
              <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div> A</span>
              <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div> S</span>
              <span className="flex items-center gap-1 whitespace-nowrap"><div className="w-2 h-2 rounded-full bg-gray-600 shrink-0"></div> H</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegisterExportPDF}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-amber-800 bg-amber-200 hover:bg-amber-300 rounded-md transition-all shadow-sm"
              >
                Print PDF
              </button>
              <button
                onClick={handleRegisterExportExcel}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-blue-800 bg-[#7ac2cf] hover:bg-[#68b5c2] rounded-md transition-all shadow-sm"
              >
                Export to excel
              </button>
            </div>
          </div>
        </div>
        <div className="w-full max-w-full min-w-0 overflow-x-auto overflow-y-auto max-h-[min(70vh,600px)] overscroll-x-contain isolate [scrollbar-gutter:stable]">
          <table
            className="border-collapse text-[10px] sm:text-[11px] font-normal leading-tight w-max"
            style={{
              minWidth: `${372 + registerData.daysInMonth * REGISTER_DAY_W + REGISTER_SUMMARY_HEADERS.length * REGISTER_SUMMARY_W}px`,
            }}
          >
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#144835]">
                <th className="sticky left-0 z-40 w-7 min-w-[28px] md:w-8 md:min-w-[32px] px-1 py-2 font-normal text-white border-b border-r border-[#0f3628] bg-[#144835] text-center">#</th>
                <th className="sticky left-7 md:left-8 z-40 w-12 min-w-[48px] md:w-14 md:min-w-[56px] px-1 py-2 font-normal text-white border-b border-r border-[#0f3628] bg-[#144835] text-center">Adm</th>
                <th className="sticky left-[76px] md:left-[88px] z-40 w-[96px] min-w-[96px] md:w-[120px] md:min-w-[120px] px-1.5 py-2 font-normal text-white border-b border-r border-[#0f3628] bg-[#144835] text-center shadow-[2px_0_4px_rgba(0,0,0,0.08)]">Student</th>
                <th className="sticky left-[208px] z-40 w-[100px] min-w-[100px] px-1.5 py-2 font-normal text-white border-b border-r border-[#0f3628] bg-[#144835] text-center hidden md:table-cell shadow-[2px_0_4px_rgba(0,0,0,0.08)]">Father</th>
                <th className="sticky left-[172px] md:left-[308px] z-40 w-12 min-w-[48px] md:w-16 md:min-w-[64px] px-1 py-2 font-normal text-white border-b border-r border-[#0f3628] bg-[#144835] text-center shadow-[2px_0_4px_rgba(0,0,0,0.08)]">Class</th>
                {Array.from({length: registerData.daysInMonth}, (_, i) => i + 1).map(day => (
                  <th key={day} className="w-8 min-w-[32px] px-0 py-2 font-normal text-white text-center border-b border-r border-[#0f3628] bg-[#144835]">{day}</th>
                ))}
                {REGISTER_SUMMARY_HEADERS.map((label, i) => (
                  <th
                    key={`${label}-${i}`}
                    style={{ right: registerSummaryRight(i) }}
                    className={cn(
                      "lg:sticky z-40 w-12 min-w-[48px] px-1 py-2 font-normal text-white text-center border-b border-r border-[#0f3628] bg-[#144835] whitespace-nowrap",
                      i === 0 && "lg:border-l-2 lg:border-l-white/30 lg:shadow-[-6px_0_10px_rgba(0,0,0,0.08)]"
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registerData.rows.length === 0 ? (
                <tr><td colSpan={registerData.daysInMonth + 14} className="p-8 text-center text-gray-500 font-normal bg-white">No students found for the selected criteria.</td></tr>
              ) : registerData.rows.map((row: any, idx: number) => {
                const gtp = row.totalPresent + row.pmp;
                const gtw = row.totalWorking + row.pmw;
                const rowBg = idx % 2 !== 0 ? "bg-gray-50" : "bg-white";
                const summaryValues = [
                  registerData.daysInMonth,
                  row.totalWorking,
                  row.totalPresent,
                  row.totalWorking > 0 ? ((row.totalPresent / row.totalWorking) * 100).toFixed(1) : 0,
                  row.pmp,
                  gtp,
                  row.pmw,
                  gtw,
                  gtw > 0 ? ((gtp / gtw) * 100).toFixed(1) : 0,
                ];
                return (
                <tr key={row.id} className={cn("hover:bg-blue-50/50 transition-colors group", rowBg)}>
                  <td className={cn("sticky left-0 z-10 w-7 min-w-[28px] md:w-8 md:min-w-[32px] px-1 py-1.5 border-b border-r border-gray-200 text-center text-gray-600", rowBg, "group-hover:bg-blue-50/50")}>{idx + 1}</td>
                  <td className={cn("sticky left-7 md:left-8 z-10 w-12 min-w-[48px] md:w-14 md:min-w-[56px] px-1 py-1.5 border-b border-r border-gray-200 text-gray-700 text-center truncate", rowBg, "group-hover:bg-blue-50/50")} title={row.admNo}>{row.admNo}</td>
                  <td className={cn("sticky left-[76px] md:left-[88px] z-10 w-[96px] min-w-[96px] md:w-[120px] md:min-w-[120px] px-1.5 py-1.5 border-b border-r border-gray-200 text-gray-800 truncate", rowBg, "group-hover:bg-blue-50/50")} title={row.name}>{row.name}</td>
                  <td className={cn("sticky left-[208px] z-10 w-[100px] min-w-[100px] px-1.5 py-1.5 border-b border-r border-gray-200 text-gray-700 truncate hidden md:table-cell", rowBg, "group-hover:bg-blue-50/50")} title={row.fatherName}>{row.fatherName}</td>
                  <td className={cn("sticky left-[172px] md:left-[308px] z-10 w-12 min-w-[48px] md:w-16 md:min-w-[64px] px-1 py-1.5 border-b border-r border-gray-200 text-gray-700 text-center truncate", rowBg, "group-hover:bg-blue-50/50")} title={row.classSection}>{row.classSection}</td>
                  
                  {Array.from({length: registerData.daysInMonth}, (_, i) => i + 1).map(day => {
                    const status = row.attendanceMap[day];
                    return (
                      <td key={day} className={cn(
                        "w-8 min-w-[32px] px-0 py-1.5 border-b border-r border-gray-200 text-center",
                        status === 'P' ? "text-emerald-700 bg-emerald-50" :
                        status === 'A' ? "text-red-700 bg-red-50" :
                        status === 'S' ? "text-gray-600 bg-gray-100" :
                        status === 'H' ? "text-gray-700 bg-gray-200" :
                        "text-gray-300"
                      )}>
                        {status !== '-' ? status : ''}
                      </td>
                    );
                  })}
                  
                  {summaryValues.map((value, i) => (
                    <td
                      key={i}
                      style={{ right: registerSummaryRight(i) }}
                      className={cn(
                        "lg:sticky z-20 w-12 min-w-[48px] px-1 py-1.5 border-b border-r border-gray-200 text-center text-gray-600 whitespace-nowrap",
                        rowBg,
                        "group-hover:bg-blue-50/50",
                        i === 0 && "lg:border-l-2 lg:border-l-gray-300 lg:shadow-[-6px_0_10px_rgba(0,0,0,0.05)]",
                        i === 2 && "text-gray-800"
                      )}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              )})}
              
              {registerData.rows.length > 0 && (
                <tr className="bg-[#ffe8cc] text-gray-800 border-t border-gray-300 font-normal">
                  <td colSpan={5} className="sticky left-0 z-10 px-2 py-1.5 border-b border-r border-[#e6d1b8] text-right bg-[#ffe8cc]">Total Present</td>
                  {Array.from({length: registerData.daysInMonth}, (_, i) => i + 1).map(day => (
                    <td key={day} className="w-8 min-w-[32px] px-0 py-1.5 border-b border-r border-[#e6d1b8] text-center">{registerData.dayTotals[day] || 0}</td>
                  ))}
                  {REGISTER_SUMMARY_HEADERS.map((_, i) => (
                    <td
                      key={`footer-${i}`}
                      style={{ right: registerSummaryRight(i) }}
                      className={cn(
                        "lg:sticky z-20 w-12 min-w-[48px] px-1 py-1.5 border-b border-r border-[#e6d1b8] text-center bg-[#ffe8cc] whitespace-nowrap",
                        i === 0 && "lg:border-l-2 lg:border-l-[#d4a574] lg:shadow-[-6px_0_10px_rgba(0,0,0,0.05)]",
                        i === 2 && "bg-[#ffd8a8] text-[#d97706] font-medium"
                      )}
                    >
                      {i === 2 ? registerData.rows.reduce((acc: number, r: any) => acc + r.totalPresent, 0) : ""}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
 ) : activeTab === "Absent Log" ? (
  <AbsentLogTab 
    schoolId={schoolId} 
    classOptions={classOptions} 
    sectionOptions={sectionOptions} 
    holidays={holidayDates} 
  />
 ) : activeTab === "Classwise Status" ? (
  <ClasswiseStatusTab 
    schoolId={schoolId} 
  />
 ) : (
  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
      <CalendarDays size={24} className="text-gray-400" />
    </div>
    <p className="text-sm font-bold text-gray-900 mb-1">{activeTab} View</p>
    <p className="text-xs font-medium text-gray-500 max-w-sm mx-auto">
      This module is currently being built. It will allow you to view and manage {activeTab.toLowerCase()} data.
    </p>
  </div>
 )}
 </div>
 );
}
