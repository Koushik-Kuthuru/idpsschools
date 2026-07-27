"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import Link from "next/link";
const SafeLink = Link as any;
import { ArrowLeft, Pencil, User, AlertCircle, Users, BookOpen, Heart, Building, Home, FileText, Printer, MessageSquare, IndianRupee, Award, Bus, Camera, Calendar, TrendingUp, Ticket, List, Library, Wallet, MapPin, Clock, Phone, History, UploadCloud, FileCheck, FileMinus, Eye, Trash2, Camera as CameraIcon, CheckCircle2, XCircle, AlertTriangle, Smartphone, Bell, Check, Send, BarChart3, ChevronDown, Download, ShieldCheck, ShieldAlert, UserCheck, Clock4, Activity, Key, EyeOff } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { SkeletonProfile } from "@/components/ui/Skeleton";



import CapturePhotoModal from "@/components/ui/CapturePhotoModal";
import StudentTeacherChatsPanel from "@/components/admin/students/StudentTeacherChatsPanel";
import StudentPerformancePanel from "@/components/admin/students/StudentPerformancePanel";
import StudentGatePassesPanel from "@/components/admin/students/StudentGatePassesPanel";
import StudentActivityLogPanel from "@/components/admin/students/StudentActivityLogPanel";
import { calculateAttendanceStats, academicYearAprMarRange, AttendanceStats } from "@/utils/attendance";
import StudentAnnualAttendanceRegister from "@/components/admin/attendance/StudentAnnualAttendanceRegister";
import { useAcademicYear } from "@/contexts/AcademicYearContext";
import { buildPath, fetchOne, buildQuery, fetchMany, patchData, db, uploadFile } from "@/lib/db-client";
import {
  createStandardFeeGridTemplate,
  extractFeeDetails,
  hasHeadwiseFeeAuthority,
  mergeFeeGridWithTemplate,
  resolveStudentFeeGrid,
} from "@/lib/studentFeeResolver";
import { sumRowValues } from "@/lib/feeDepositUtils";
import {
  classStructureAsGradeRecord,
  fetchHydratedFeeConfiguration,
  findClassStructureForGrade,
  studentAcademicYear,
  studentEnrollmentGrade,
  type FeeConfiguration,
} from "@/lib/feeConfigurationStore";
import StudentFeeStructureEditor, { type FeeStructureFormState } from "@/components/admin/StudentFeeStructureEditor";
import StudentFeeTransactionsPanel from "@/components/admin/fees/StudentFeeTransactionsPanel";
import { resolveStudentProfileTab } from "@/lib/studentProfileTabs";


const InfoSection = ({ title, icon: Icon, children }: any) => (
 <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-4">
 <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
 {Icon && (
 <div className="h-6 w-6 rounded border border-gray-200 text-[#144835] flex items-center justify-center shrink-0 bg-white">
 <Icon size={14} strokeWidth={2.5} />
 </div>
 )}
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">{title}</h2>
 </div>
 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white">
 {children}
 </div>
 </div>
);

const InfoField = ({ label, value }: { label: string, value: any }) => (
 <div className="flex flex-col group">
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#144835] transition-colors">{label}</span>
 <span className="text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 break-words">{value || "-"}</span>
 </div>
);

export default function AdminStudentProfilePageClient({
 studentId,
 tabParam,
}: {
 studentId: string;
 tabParam: string | null;
}) {
 const schoolId = useSchoolId(); // Update this per school
 const { currentYear } = useAcademicYear();
  const [student, setStudent] = useState<any | null>(null);
 const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
 const [feeStructure, setFeeStructure] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);
 
 const initialTab = resolveStudentProfileTab(tabParam);
 const [activeTab, setActiveTab] = useState(initialTab);

 useEffect(() => {
   setActiveTab(resolveStudentProfileTab(tabParam));
 }, [tabParam]);

 // Capture Modal State
 const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
 const [capturePhotoType, setCapturePhotoType] = useState<'student' | 'father' | 'mother' | 'guardian'>('student');
 const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  const [feeCategory, setFeeCategory] = useState("GENERAL");
  const [feeTypeFilter, setFeeTypeFilter] = useState("MONTHLY");
  const [feeStatus, setFeeStatus] = useState("NEW");
  const [lastYearDue, setLastYearDue] = useState("0");
  const [discRemark, setDiscRemark] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratingCreds, setIsGeneratingCreds] = useState(false);

 const [photos, setPhotos] = useState({
 student: "",
 father: "",
 mother: "",
 guardian: ""
 });
 const [certificates, setCertificates] = useState([
  {"id":1,"name":"Admission Form","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":2,"name":"School Leaving Certificate(TC)","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":3,"name":"Bonafide Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":4,"name":"Birth Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":5,"name":"Caste Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":6,"name":"All Documents","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":7,"name":"Ration Card","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":8,"name":"Student Adhar Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":9,"name":"Father Adhar Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""},
  {"id":10,"name":"Mother Adhar Certificate","status":"N/A","remark":"","fileUrl":"","fileName":""}
 ]);
 const [uploadingCertId, setUploadingCertId] = useState<number | null>(null);
 const [transportFacility, setTransportFacility] = useState("NO");
 const [busNo, setBusNo] = useState("");
 const [transportRoute, setTransportRoute] = useState("");
 const [stoppage, setStoppage] = useState("");
 const [arrTime, setArrTime] = useState("");
 const [depTime, setDepTime] = useState("");
 const [driverName, setDriverName] = useState("");
 const [driverMobile, setDriverMobile] = useState("");
 const [transportFees, setTransportFees] = useState(Array(12).fill("0"));
 const MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
 

 const [feeGrid, setFeeGrid] = useState(createStandardFeeGridTemplate(schoolId));

 const saveFeeStructure = async (state: FeeStructureFormState) => {
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 await patchData(docRef, { feeDetails: state });
 setFeeCategory(state.feeCategory);
 setFeeTypeFilter(state.feeTypeFilter);
 setFeeStatus(state.feeStatus);
 setLastYearDue(state.lastYearDue);
 setDiscRemark(state.discRemark);
 setFeeGrid(state.feeGrid);
 };

 
 useEffect(() => {
 // When Fee Type Filter changes, we could potentially clear out or reshape the grid.
 // For now, we just observe it. A full implementation would wipe rows that don't match the interval.
 }, [feeTypeFilter]);
 
 
 
 
 const handleUpdatePhotos = async () => {
 try {
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 // We also update the main student.photo field for backward compatibility with other parts of the app
 await patchData(docRef, { 
 photos,
 ...(photos.student ? { photo: photos.student } : {})
 });
 alert("Photos updated successfully!");
 } catch (err) {
 console.error("Error saving photos:", err);
 alert("Failed to save photos.");
 }
 };

 
 const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'student' | 'father' | 'mother' | 'guardian') => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith("image/") && !/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)) {
 alert("Only image files are supported (JPEG, PNG, GIF, WEBP).");
 e.target.value = "";
 return;
 }

 if (file.size > 10 * 1024 * 1024) {
 alert("Image size must be less than 10 MB.");
 e.target.value = "";
 return;
 }

 setUploadingPhoto(type);
 try {
 const ext =
  file.name.match(/(\.[a-z0-9]+)$/i)?.[1]?.toLowerCase() ||
  (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : file.type === "image/gif" ? ".gif" : ".jpg");
 const path = `schools/${schoolId}/students/${studentId}/photos/${type}_${Date.now()}${ext}`;
 const url = await uploadFile(path, file);
 
 const newPhotos = { ...photos, [type]: url };
 setPhotos(newPhotos);

 if (type === 'student') {
 setStudent((prev: any) => ({ ...prev, photo: url }));
 }

 // Auto save to database
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 await patchData(docRef, { 
 photos: newPhotos,
 ...(type === 'student' ? { photo: url } : {})
 });
 
 } catch (err: any) {
 console.error("Error uploading photo:", err);
 alert(`Failed to upload photo: ${err.message || "Please try again."}`);
 } finally {
 setUploadingPhoto(null);
 e.target.value = "";
 }
 };

 const handleCaptureClick = (type: 'student' | 'father' | 'mother' | 'guardian') => {
 setCapturePhotoType(type);
 setIsCaptureModalOpen(true);
 };

 const handlePhotoCaptured = async (fileOrUrl: File | string, type: 'student' | 'father' | 'mother' | 'guardian') => {
 setUploadingPhoto(type);
 try {
 let url = "";
 if (typeof fileOrUrl === 'string') {
  if (fileOrUrl.startsWith("data:")) {
   const blob = await (await fetch(fileOrUrl)).blob();
   const file = new File([blob], `${type}_capture.jpg`, { type: blob.type || "image/jpeg" });
   const path = `schools/${schoolId}/students/${studentId}/photos/${type}_${Date.now()}.jpg`;
   url = await uploadFile(path, file);
  } else {
   url = fileOrUrl;
  }
 } else {
 const path = `schools/${schoolId}/students/${studentId}/photos/${type}_${Date.now()}.jpg`;
 url = await uploadFile(path, fileOrUrl as File);
 }
 
 const newPhotos = { ...photos, [type]: url };
 setPhotos(newPhotos);

 if (type === 'student') {
 setStudent((prev: any) => ({ ...prev, photo: url }));
 }

 // Auto save to database
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 await patchData(docRef, { 
 photos: newPhotos,
 ...(type === 'student' ? { photo: url } : {})
 });
 
 } catch (err: any) {
 console.error("Error uploading captured photo:", err);
 alert(`Failed to save captured photo: ${err.message || "Please try again."}`);
 } finally {
 setUploadingPhoto(null);
 }
 };

const handlePhotoRemove = async (type: 'student' | 'father' | 'mother' | 'guardian') => {
 const confirmed = window.confirm(`Are you sure you want to remove the ${type}'s photo?`);
 if (!confirmed) return;

 const newPhotos = { ...photos, [type]: "" };
 setPhotos(newPhotos);
 if (type === 'student') {
 setStudent((prev: any) => ({ ...prev, photo: "" }));
 }

 try {
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 await patchData(docRef, { 
 photos: newPhotos,
 ...(type === 'student' ? { photo: "" } : {})
 });
 } catch (err) {
 console.error("Error removing photo:", err);
 }
 };

 const handleUpdateCertificates = async () => {
 try {
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 await patchData(docRef, { certificates });
 alert("Certificate information updated successfully!");
 } catch (err) {
 console.error("Error saving certificates:", err);
 alert("Failed to save certificate information.");
 }
 };

 const handleCertificateStatusChange = (index: number, status: string) => {
 const newCerts = [...certificates];
 newCerts[index].status = status;
 setCertificates(newCerts);
 };
 
 const handleCertificateRemarkChange = (index: number, remark: string) => {
 const newCerts = [...certificates];
 newCerts[index].remark = remark;
 setCertificates(newCerts);
 };

 const hasCertificateFile = (cert: { fileUrl?: string }) => {
  const url = String(cert?.fileUrl ?? "").trim();
  if (!url) return false;
  if (/^dummy(-link)?(\.pdf)?$/i.test(url)) return false;
  return true;
 };

 const persistCertificates = async (nextCerts: typeof certificates) => {
  const docRef = buildPath(db, "schools", schoolId, "students", studentId);
  await patchData(docRef, { certificates: nextCerts });
 };

 const handleCertificateUpload = async (
  e: ChangeEvent<HTMLInputElement>,
  index: number
 ) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
   alert("Document size must be 5 MB or less. Only PDF and JPG formats are supported.");
   e.target.value = "";
   return;
  }

  const okType =
   /pdf$/i.test(file.type) ||
   /jpeg|jpg|png$/i.test(file.type) ||
   /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!okType) {
   alert("Only PDF and JPG/PNG formats are supported.");
   e.target.value = "";
   return;
  }

  const cert = certificates[index];
  setUploadingCertId(Number(cert.id));
  try {
   const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
   const path = `schools/${schoolId}/students/${studentId}/certificates/${cert.id}_${Date.now()}_${safeName}`;
   const url = await uploadFile(path, file);
   const nextStatus =
    cert.status === "NO" || cert.status === "N/A" || !cert.status ? "YES" : cert.status;
   const newCerts = certificates.map((row, i) =>
    i === index
     ? {
        ...row,
        fileUrl: url,
        fileName: file.name,
        status: nextStatus,
       }
     : row
   );
   setCertificates(newCerts);
   await persistCertificates(newCerts);
  } catch (err: any) {
   console.error("Error uploading certificate:", err);
   alert(`Failed to upload document: ${err.message || "Please try again."}`);
  } finally {
   setUploadingCertId(null);
   e.target.value = "";
  }
 };

 const handleCertificateRemove = async (index: number) => {
  const cert = certificates[index];
  if (!hasCertificateFile(cert)) return;
  const confirmed = window.confirm(`Remove uploaded file for ${cert.name}?`);
  if (!confirmed) return;

  const newCerts = certificates.map((row, i) =>
   i === index ? { ...row, fileUrl: "", fileName: "" } : row
  );
  setCertificates(newCerts);
  try {
   await persistCertificates(newCerts);
  } catch (err: any) {
   console.error("Error removing certificate file:", err);
   alert(`Failed to remove document: ${err.message || "Please try again."}`);
  }
 };

 const handleUpdateTransportInfo = async () => {
  try {
   const docRef = buildPath(db, "schools", schoolId, "students", studentId);
   const newLog = {
    id: Date.now().toString(),
    message: "updated transport details",
    user: "Admin",
    date: new Date().toLocaleString()
   };
   
   await patchData(docRef, {
    transportDetails: {
     facility: transportFacility,
     busNo,
     route: transportRoute,
     stoppage,
     arrTime,
     depTime,
     driverName,
     driverMobile,
     fees: transportFees
    },
    transportHistory: [...(student?.transportHistory || []), newLog]
   });
   
   setStudent((prev: any) => ({
    ...prev,
    transportHistory: [...(prev?.transportHistory || []), newLog],
    transportDetails: {
     facility: transportFacility,
     busNo,
     route: transportRoute,
     stoppage,
     arrTime,
     depTime,
     driverName,
     driverMobile,
     fees: transportFees
    }
   }));
   
   alert("Transport information updated successfully!");
 } catch (err) {
 console.error("Error saving transport info:", err);
 alert("Failed to save transport information.");
 }
 };

 const handleTransportFeeChange = (index: number, val: string) => {
 if (/^\d*$/.test(val)) {
 const newFees = [...transportFees];
 newFees[index] = val === "" ? "0" : parseInt(val, 10).toString();
 setTransportFees(newFees);
 }
 };

 const PROFILE_TABS = [
 { id: "Basic Details", icon: User },
 { id: "Fee Details", icon: IndianRupee },
 { id: "Transport Details", icon: Bus },
 { id: "Certificate Details", icon: Award },
 { id: "Photos", icon: Camera },
 { id: "Attendance", icon: Calendar },
 { id: "Messages", icon: MessageSquare },
 { id: "Performance", icon: TrendingUp },
 { id: "GatePass", icon: Ticket },
 { id: "Activity Log", icon: List },
 // { id: "Library", icon: Library },
 // { id: "Commitment Fees", icon: Wallet },
 // { id: "Student Apology Letter", icon: FileText },
 // { id: "Parent Request Letter", icon: FileText }
 ];

 useEffect(() => {
 async function load() {
 if (!studentId) return;
 try {
 setLoading(true);
 const docRef = buildPath(db, "schools", schoolId, "students", studentId);
 const snap = await fetchOne(docRef, { skipCache: true });
 if (snap.exists()) {
 const studentData = { id: snap.id, ...(snap.data() as any) };
 setStudent(studentData);

 const yearRange = academicYearAprMarRange(currentYear?.name ?? studentData.academicYear);
 const stats = calculateAttendanceStats(
 studentData.attendance?.presentDates || [],
 studentData.attendance?.absentDates || [],
 studentData.attendance?.lateDates || [],
 yearRange.start,
 yearRange.end,
 studentData.attendance?.holidayDates || []
 );
 setAttendanceStats(stats);

 
 
 
 // Load photos
 if (studentData.photos) {
 setPhotos(studentData.photos);
 } else if (studentData.photo) {
 setPhotos(prev => ({ ...prev, student: studentData.photo }));
 }

 // Load certificates
 if (studentData.certificates && Array.isArray(studentData.certificates)) {
 setCertificates(
  studentData.certificates.map((cert: any) => {
   const fileUrl = String(cert?.fileUrl ?? "").trim();
   return {
    ...cert,
    fileUrl: /^dummy/i.test(fileUrl) ? "" : fileUrl,
    fileName: String(cert?.fileName ?? ""),
    status: String(cert?.status ?? "N/A").toUpperCase() || "N/A",
    remark: String(cert?.remark ?? ""),
   };
  })
 );
 }

 // Load transport details
 if (studentData.transportDetails) {
 setTransportFacility(studentData.transportDetails.facility || "NO");
 setBusNo(studentData.transportDetails.busNo || "");
 setTransportRoute(studentData.transportDetails.route || "");
 setStoppage(studentData.transportDetails.stoppage || "");
 setArrTime(studentData.transportDetails.arrTime || "");
 setDepTime(studentData.transportDetails.depTime || "");
 setDriverName(studentData.transportDetails.driverName || "");
 setDriverMobile(studentData.transportDetails.driverMobile || "");
 if (studentData.transportDetails.fees && Array.isArray(studentData.transportDetails.fees)) {
 setTransportFees(studentData.transportDetails.fees);
 }
 }

 // Load existing fee details if present
 const extractedFees = extractFeeDetails(studentData);
 setFeeCategory(extractedFees.feeCategory || "GENERAL");
 setFeeTypeFilter(extractedFees.feeTypeFilter || "MONTHLY");
 setFeeStatus(extractedFees.feeStatus || "NEW");
 setLastYearDue(extractedFees.lastYearDue || "0");
 setDiscRemark(extractedFees.discRemark || "");

 let structure: Record<string, unknown> | null = null;
 const gradeToSearch = studentEnrollmentGrade(studentData);
 const studentYear = studentAcademicYear(studentData);
 let feeConfig: FeeConfiguration | undefined;
 if (gradeToSearch) {
   feeConfig = await fetchHydratedFeeConfiguration(schoolId, studentYear);
   const classEntry = findClassStructureForGrade(feeConfig, gradeToSearch, studentYear);
   if (classEntry) {
     structure = classStructureAsGradeRecord(classEntry);
     setFeeStructure(structure);
   }
 }

 const resolvedGrid = resolveStudentFeeGrid(
   studentData,
   structure,
   schoolId,
   feeConfig ?? undefined,
   studentYear
 );
 setFeeGrid(
   mergeFeeGridWithTemplate(
     resolvedGrid,
     createStandardFeeGridTemplate(schoolId),
     schoolId,
     hasHeadwiseFeeAuthority(extractedFees) ? { preferSavedZeros: true } : undefined
   )
 );
 } else {
 setStudent(null);
 }
 } catch (err) {
 console.error("Error loading student profile:", err);
 } finally {
 setLoading(false);
 }
 }
 load();
 }, [studentId, schoolId, currentYear?.name]);

 if (loading) {
 return <SkeletonProfile />;
 }

 if (!student) {
 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] uppercase">Student Profile</h1>
 <p className="mt-2 text-xs font-semibold text-slate-600">Student not found: {studentId}</p>
 </div>
 <SafeLink
 href={`/schools/${schoolId}/admin/academic/students`}
 className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 w-fit"
 >
 <ArrowLeft size={16} /> Back to Student List
 </SafeLink>
 </div>
 );
 }

 const getStatusColor = (status: string) => {
 if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
 if (status === "Cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
 if (status === "Inactive") return "bg-red-50 text-red-700 border-red-200";
 return "bg-gray-50 text-gray-700 border-gray-200";
 };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-2">
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:items-start">
 {/* Left Column: Summary Card — sticks below admin header while scrolling detail tabs */}
 <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-24 xl:self-start">
 <SafeLink href={`/schools/${schoolId}/admin/academic/students`} className="inline-flex items-center gap-2 px-1 text-gray-500 hover:text-gray-900 transition-colors mb-1 text-sm font-bold">
 <ArrowLeft size={16} /> Back to Students
 </SafeLink>
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
 <div className="h-24 w-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden mb-4">
 {student.photo ? (
 <img src={student.photo} alt={student.studentName} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100"><User size={40} /></div>
 )}
 </div>
 <h2 className="text-lg font-bold text-gray-900 text-center uppercase leading-tight">{student.studentName || `${student.firstName || ''} ${student.lastName || ''}`}</h2>
 <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
 <p className="text-xs font-bold text-[#144835] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
 Class: {student.classId || student.grade} {student.section}
 </p>
 <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(student.status || 'Active')}`}>
 {student.status || 'Active'}
 </span>
 </div>
 {String(student.status || "").toLowerCase() === "cancelled" ? (
 <p className="mt-3 w-full text-center text-[11px] font-extrabold uppercase tracking-wide text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
 Admission Cancelled
 {student.admissionCancelledYear ? ` · ${String(student.admissionCancelledYear)}` : ""}
 </p>
 ) : null}
 </div>
 <div className="p-5 space-y-4">
 <div className="flex items-center justify-between py-2 border-b border-gray-50">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admission No</span>
 <span className="text-sm font-bold text-gray-900">{student.admissionNo || "-"}</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-gray-50">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No</span>
 <span className="text-sm font-bold text-gray-900">{student.rollNumber || "-"}</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-gray-50">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">DOB</span>
 <span className="text-sm font-bold text-gray-900">{student.dob || "-"}</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-gray-50">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</span>
 <span className="text-sm font-bold text-gray-900">{student.gender || "-"}</span>
 </div>
 <div className="flex items-center justify-between py-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</span>
 <span className="text-sm font-bold text-gray-900">{student.mobileNumber || student.permMobile || student.fatherMobile1 || "-"}</span>
 </div>
 </div>
 </div>

 {/* Quick Stats or Additional Info can go here */}
 <div className="bg-gradient-to-br from-[#144835] to-[#0d3023] rounded-xl shadow-md p-5 text-white">
 <h3 className="text-xs font-extrabold uppercase tracking-wide !text-white mb-1">Current Academic Year</h3>
 <p className="text-lg font-bold !text-white mb-4">{currentYear?.name ?? student.academicYear ?? "—"}</p>
 <div className="space-y-4">
 <div>
 <p className="text-xs !text-white/80 font-bold uppercase tracking-wider">Attendance</p>
 <div className="flex items-end gap-2 mt-1">
 <span className="text-2xl font-bold !text-white">{attendanceStats?.percentage ?? "—"}{attendanceStats ? "%" : ""}</span>
 <span className="text-xs !text-white/70 mb-1">present</span>
 </div>
 </div>
 <div className="w-full bg-black/20 rounded-full h-1.5">
 <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: attendanceStats ? `${attendanceStats.percentage}%` : '0%' }}></div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Detailed Info */}
 <div className="xl:col-span-9 space-y-6">
 
 
 {/* Swiggy Style Dark Green Tab Container */}
 <div className="bg-[#144835] rounded-[32px] shadow-xl overflow-hidden pt-4 pb-0 flex flex-col">
 
 {/* Horizontal Scrollable Tabs */}
 <div className="flex overflow-x-auto hide-scrollbar gap-1 items-end px-2 sm:px-4 pt-4">
 <style dangerouslySetInnerHTML={{ __html: `
 .hide-scrollbar::-webkit-scrollbar { display: none; }
 .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
 `}} />
 {PROFILE_TABS.map(tab => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-end min-w-[90px] max-w-[100px] px-2 pt-4 pb-3 rounded-t-[20px] relative transition-all group shrink-0 ${
 isActive ? 'bg-[#f9fafb]' : 'bg-transparent hover:bg-white/5'
 }`}
 >
 <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center mb-2.5 transition-all duration-300 ${isActive ? 'bg-white text-[#144835] shadow-sm' : 'bg-[#225743] text-emerald-50 group-hover:bg-[#2b6a53]'}`}>
 <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
 </div>
 <span className={`text-xs font-bold text-center leading-tight whitespace-pre-wrap ${isActive ? 'text-[#144835]' : 'text-emerald-50/90'}`}>
 {tab.id.replace(' ', '\n')}
 </span>
 
 {/* Swiggy active tab curves */}
 {isActive && (
 <>
 <div className="absolute bottom-0 -left-4 w-4 h-4 bg-transparent" style={{ boxShadow: '6px 6px 0 0 #f9fafb', borderBottomRightRadius: '16px' }} />
 <div className="absolute bottom-0 -right-4 w-4 h-4 bg-transparent" style={{ boxShadow: '-6px 6px 0 0 #f9fafb', borderBottomLeftRadius: '16px' }} />
 </>
 )}
 </button>
 )
 })}
 </div>

 {/* White Content Area */}
 <div className="bg-[#f9fafb] min-h-[500px] w-full relative z-10 -mt-[1px]">
 
 
 {/* Dynamic Content Area */}
 <div className="p-6 pt-8 relative z-0">
 {activeTab === "Basic Details" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {/* Action Buttons Toolbar */}
 <div className="flex justify-end gap-2 mb-2">
 <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:bg-gray-50 uppercase tracking-wide">
 <Printer size={14} /> Print
 </button>
 <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:bg-gray-50 uppercase tracking-wide">
 <MessageSquare size={14} /> Message
 </button>
 <SafeLink
 href={`/schools/${schoolId}/admin/academic/students/${encodeURIComponent(student.id)}/edit`}
 className="inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:opacity-90 uppercase tracking-wide"
 >
 <Pencil size={14} /> Edit
 </SafeLink>
 </div>
 {/* Identity Section */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <User size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Identity Information</h3>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Aadhar No" value={student.aadharNo} />
 <InfoField label="SRN No" value={student.srnNo} />
 <InfoField label="Form No" value={student.formNo} />
 <InfoField label="Pen No" value={student.penNo} />
 </div>
 </div>

 {/* Login Credentials Section */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
 <Key size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Login Credentials</h3>
 </div>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 {student.username ? (
 <>
 <div>
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Username / User ID</p>
 <p className="mt-1 text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">{String(student.username)}</p>
 </div>
 <div className="col-span-1 sm:col-span-2 md:col-span-3">
 <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Portal Password</p>
 <div className="mt-1 relative flex items-center max-w-sm">
 <p className="text-sm font-bold text-gray-900 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100 w-full font-mono tracking-widest">
 {showPassword ? String(student.portalPassword || "") : "••••••••"}
 </p>
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 text-gray-400 hover:text-gray-600"
 >
 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 </div>
 </>
 ) : (
 <div className="col-span-full text-sm text-gray-500 p-2 animate-pulse">
 Automatically configuring login credentials...
 </div>
 )}
 </div>
 </div>

 {/* Academic Demographics */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <BookOpen size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Academic Placement</h3>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Student Type" value={student.studentType} />
 <InfoField label="House" value={student.house} />
 <InfoField label="Stream" value={student.stream} />
 <InfoField label="Medium" value={student.mediumOfInstruction} />
 <InfoField label="Optional Subject" value={student.optionalSubject} />
 <InfoField label="Offered Subject" value={student.offeredSubject} />
 <InfoField label="Prev Attendance" value={student.prevAttendance} />
 </div>
 </div>

 {/* Background & Demographics */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Users size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Demographics</h3>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Mother Tongue" value={student.motherTongue} />
 <InfoField label="Nationality" value={student.nationality} />
 <InfoField label="Caste Category" value={student.casteCategory} />
 <InfoField label="Minority" value={student.minority === "Yes" ? `Yes (${student.minoritySpecify})` : "No"} />
 <InfoField label="Only Child" value={student.onlyChild ? "Yes" : "No"} />
 <InfoField label="Adopted Child" value={student.adoptedChild} />
 <InfoField label="Contact Email" value={student.email} />
 </div>
 </div>

 {/* Health & Medical */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Heart size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Health & Medical</h3>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Blood Group" value={student.bloodGroup} />
 <InfoField label="Disability" value={student.disability} />
 <InfoField label="Sports Activity" value={student.sportsActivity} />
 <InfoField label="Admission Date" value={student.admissionDate} />
 <div className="col-span-full border-t border-gray-50 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Left Vision" value={student.leftVision} />
 <InfoField label="Right Vision" value={student.rightVision} />
 <InfoField label="Weight (Term 1)" value={student.weightTerm1} />
 <InfoField label="Height (Term 1)" value={student.heightTerm1} />
 <InfoField label="Weight (Term 2)" value={student.weightTerm2} />
 <InfoField label="Height (Term 2)" value={student.heightTerm2} />
 </div>
 </div>
 </div>

 {/* Financial / Bank Details */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Building size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bank Details</h3>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Bank Name" value={student.bankName} />
 <InfoField label="Branch Name" value={student.branchName} />
 <InfoField label="A/C No" value={student.accountNo} />
 <InfoField label="IFSC Code" value={student.ifscCode} />
 </div>
 </div>

 {/* Family Profile */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Users size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Family Profile</h3>
 </div>
 <div className="p-5 space-y-8">
 {/* Father */}
 <div>
 <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wide bg-emerald-50/80 py-1.5 px-3 rounded-lg border border-emerald-100 shadow-sm inline-block mb-4">Father</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Name" value={student.fatherName} />
 <InfoField label="Email" value={student.fatherEmail} />
 <InfoField label="Mobile 1" value={student.fatherMobile1} />
 <InfoField label="Mobile 2" value={student.fatherMobile2} />
 <InfoField label="Occupation" value={student.fatherOccupation} />
 <InfoField label="Department" value={student.fatherDepartment} />
 <InfoField label="Designation" value={student.fatherDesignation} />
 <InfoField label="Office" value={student.fatherOffice} />
 <InfoField label="Office Address" value={student.fatherOfficeAddress} />
 <InfoField label="Office Contact" value={student.fatherOfficeContact} />
 <InfoField label="Aadhar No" value={student.fatherAadhar} />
 <InfoField label="PAN No" value={student.fatherPan} />
 <InfoField label="Annual Income" value={student.fatherIncome} />
 <InfoField label="Religion" value={student.fatherReligion} />
 <InfoField label="Caste" value={student.fatherCaste} />
 <InfoField label="Marital Status" value={student.fatherMarital} />
 <InfoField label="Nationality" value={student.fatherNationality} />
 </div>
 </div>
 {/* Mother */}
 <div className="border-t border-gray-50 pt-6">
 <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wide bg-emerald-50/80 py-1.5 px-3 rounded-lg border border-emerald-100 shadow-sm inline-block mb-4">Mother</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Name" value={student.motherName} />
 <InfoField label="Email" value={student.motherEmail} />
 <InfoField label="Mobile 1" value={student.motherMobile1} />
 <InfoField label="Mobile 2" value={student.motherMobile2} />
 <InfoField label="Occupation" value={student.motherOccupation} />
 <InfoField label="Department" value={student.motherDepartment} />
 <InfoField label="Designation" value={student.motherDesignation} />
 <InfoField label="Office" value={student.motherOffice} />
 <InfoField label="Office Address" value={student.motherOfficeAddress} />
 <InfoField label="Office Contact" value={student.motherOfficeContact} />
 <InfoField label="Aadhar No" value={student.motherAadhar} />
 <InfoField label="PAN No" value={student.motherPan} />
 <InfoField label="Annual Income" value={student.motherIncome} />
 <InfoField label="Religion" value={student.motherReligion} />
 <InfoField label="Caste" value={student.motherCaste} />
 <InfoField label="Marital Status" value={student.motherMarital} />
 <InfoField label="Nationality" value={student.motherNationality} />
 </div>
 </div>
 {/* Guardian (if exists) */}
 {student.guardianName && (
 <div className="border-t border-gray-50 pt-6">
 <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wide bg-emerald-50/80 py-1.5 px-3 rounded-lg border border-emerald-100 shadow-sm inline-block mb-4">Guardian</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <InfoField label="Name" value={student.guardianName} />
 <InfoField label="Email" value={student.guardianEmail} />
 <InfoField label="Mobile 1" value={student.guardianMobile1} />
 <InfoField label="Mobile 2" value={student.guardianMobile2} />
 <InfoField label="Occupation" value={student.guardianOccupation} />
 <InfoField label="Department" value={student.guardianDepartment} />
 <InfoField label="Designation" value={student.guardianDesignation} />
 <InfoField label="Office" value={student.guardianOffice} />
 <InfoField label="Office Address" value={student.guardianOfficeAddress} />
 <InfoField label="Office Contact" value={student.guardianOfficeContact} />
 <InfoField label="Aadhar No" value={student.guardianAadhar} />
 <InfoField label="PAN No" value={student.guardianPan} />
 <InfoField label="Annual Income" value={student.guardianIncome} />
 <InfoField label="Religion" value={student.guardianReligion} />
 <InfoField label="Caste" value={student.guardianCaste} />
 <InfoField label="Marital Status" value={student.guardianMarital} />
 <InfoField label="Nationality" value={student.guardianNationality} />
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Contact & Address */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Home size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact & Address</h3>
 </div>
 <div className="p-5 space-y-8">
 <div>
 <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wide bg-emerald-50/80 py-1.5 px-3 rounded-lg border border-emerald-100 shadow-sm inline-block mb-4">Permanent Address</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <div className="col-span-full sm:col-span-2"><InfoField label="Address" value={student.permAddress} /></div>
 <InfoField label="Mobile" value={student.permMobile} />
 <InfoField label="Whatsapp" value={student.permWhatsapp} />
 <InfoField label="City" value={student.permCity} />
 <InfoField label="State" value={student.permState} />
 <InfoField label="Area" value={student.permArea} />
 <InfoField label="Place" value={student.permPlace} />
 </div>
 </div>
 {!student.sameAsPerm && (
 <div className="border-t border-gray-50 pt-6">
 <h4 className="text-xs font-bold text-[#144835] uppercase tracking-wide bg-emerald-50/80 py-1.5 px-3 rounded-lg border border-emerald-100 shadow-sm inline-block mb-4">Correspondence Address</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
 <div className="col-span-full sm:col-span-2"><InfoField label="Address" value={student.corrAddress} /></div>
 <InfoField label="Mobile" value={student.corrMobile} />
 <InfoField label="Whatsapp" value={student.corrWhatsapp} />
 <InfoField label="City" value={student.corrCity} />
 <InfoField label="State" value={student.corrState} />
 <InfoField label="Area" value={student.corrArea} />
 <InfoField label="Place" value={student.corrPlace} />
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Siblings */}
 {student.siblings && student.siblings.length > 0 && student.siblings.some((s:any) => s.name) && (
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Users size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Siblings Enrolled</h3>
 </div>
 <div className="p-0 overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-gray-100 bg-gray-50/50">
 <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Age</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Gender</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">School</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Class</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {student.siblings.map((sib: any, idx: number) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
 <td className="py-3 px-5 text-xs font-bold text-gray-700">{sib.name || "—"}</td>
 <td className="py-3 px-5 text-xs font-bold text-gray-600">{sib.age || "—"}</td>
 <td className="py-3 px-5 text-xs font-bold text-gray-600">{sib.gender || "—"}</td>
 <td className="py-3 px-5 text-xs font-bold text-gray-600">{sib.school || "—"}</td>
 <td className="py-3 px-5 text-xs font-bold text-gray-600">{sib.class || "—"}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 
 {activeTab === "Fee Details" && (
 <div className="space-y-4">
 <StudentFeeStructureEditor
 key={studentId}
 initial={{
 feeCategory,
 feeTypeFilter,
 feeStatus,
 lastYearDue,
 discRemark,
 feeGrid,
 }}
 onSave={saveFeeStructure}
 schoolId={schoolId}
 classFeeSource={
   feeStructure
     ? {
         grade: String(feeStructure.grade ?? studentEnrollmentGrade(student)),
         academicYear: String(feeStructure.academicYear ?? student.academicYear ?? ""),
       }
     : {
         grade: studentEnrollmentGrade(student),
         academicYear: studentAcademicYear(student) ?? "",
       }
 }
 />
 <StudentFeeTransactionsPanel student={student} />
 </div>
 )}

 {activeTab === "Transport Details" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

 {feeGrid.some((row) => sumRowValues(row.values) > 0) && (
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <IndianRupee size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">School Fee Summary</h3>
 </div>
 <button
 type="button"
 onClick={() => setActiveTab("Fee Details")}
 className="text-xs font-bold text-[#144835] uppercase tracking-wider hover:underline"
 >
 View Full Fee Details
 </button>
 </div>
 <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {feeGrid
 .filter((row) => sumRowValues(row.values) > 0)
 .map((row) => (
 <div key={row.name} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
 <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{row.name}</span>
 <span className="text-sm font-bold text-[#144835] tabular-nums">₹{sumRowValues(row.values).toLocaleString("en-IN")}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Core Assignment & Timing */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Bus size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Transport Assignment</h3>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Facility Required?</span>
 <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200 shadow-inner">
 <button onClick={() => setTransportFacility("YES")} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${transportFacility === "YES" ? 'bg-white text-[#144835] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Yes</button>
 <button onClick={() => setTransportFacility("NO")} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${transportFacility === "NO" ? 'bg-white text-red-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>No</button>
 </div>
 </div>
 </div>

 <div className={`p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${transportFacility === "NO" ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
 {/* Row 1: Bus details */}
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><Bus size={12}/> Bus No.</label>
 <input type="text" value={busNo} onChange={e=>setBusNo(e.target.value)} placeholder="e.g. AP39UF3916" className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm placeholder:text-gray-300" />
 </div>
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><MapPin size={12}/> Transport Route</label>
 <input type="text" value={transportRoute} onChange={e=>setTransportRoute(e.target.value)} placeholder="e.g. R10" className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm placeholder:text-gray-300" />
 </div>
 <div className="flex flex-col group lg:col-span-2">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><MapPin size={12}/> Stoppage</label>
 <input type="text" value={stoppage} onChange={e=>setStoppage(e.target.value)} placeholder="e.g. SLAB (ABOVE 7KM)" className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm placeholder:text-gray-300" />
 </div>

 {/* Row 2: Timing & Driver */}
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><Clock size={12}/> Arr. Time</label>
 <input type="time" value={arrTime} onChange={e=>setArrTime(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm" />
 </div>
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><Clock size={12}/> Dep. Time</label>
 <input type="time" value={depTime} onChange={e=>setDepTime(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm" />
 </div>
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><User size={12}/> Driver Name</label>
 <input type="text" value={driverName} onChange={e=>setDriverName(e.target.value)} placeholder="e.g. Ravi Bussa" className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm placeholder:text-gray-300" />
 </div>
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 group-focus-within:text-[#144835] transition-colors"><Phone size={12}/> Driver Mobile No.</label>
 <input type="tel" value={driverMobile} onChange={e=>setDriverMobile(e.target.value)} placeholder="e.g. 7416742036" className="h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-xs font-bold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm placeholder:text-gray-300" />
 </div>
 </div>
 </div>

 {/* Monthly Fees Grid */}
 <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col transition-opacity duration-300 ${transportFacility === "NO" ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <IndianRupee size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Monthly Transport Fee</h3>
 </div>
 </div>
 
 <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
 {MONTHS.map((m, idx) => (
 <div key={m} className="flex flex-col group">
 <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1 group-focus-within:text-[#144835] transition-colors">
 {m} <span className="w-full h-px bg-gray-100 block ml-2"></span>
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
 <input 
 type="text" 
 value={transportFees[idx]}
 onChange={e => handleTransportFeeChange(idx, e.target.value)}
 onFocus={(e) => e.target.value === "0" && e.target.select()}
 className={`w-full h-10 rounded-xl border border-gray-200 pl-7 pr-3 text-xs font-bold ${transportFees[idx] === "0" || transportFees[idx] === "" ? 'text-gray-400 bg-gray-50/50' : 'text-[#144835] bg-emerald-50/30'} focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm`}
 />
 </div>
 </div>
 ))}
 </div>

 {/* Footer Update Action */}
 <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-3">
 <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5"><AlertCircle size={14}/> Updates apply immediately to student record.</div>
 <button onClick={handleUpdateTransportInfo} className="inline-flex items-center justify-center px-6 py-3 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-sm hover:bg-[#0d3023] hover:shadow transition-all active:scale-95">
 Update Transport Information
 </button>
 </div>
 </div>

 {/* Change History Log */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <History size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Change History Log</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="border-b border-gray-100 bg-white">
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">SR</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide">Message / Activity</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide">Changed By</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Date & Time</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {(student.transportHistory || []).map((log: any, i: number) => (
 <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-3 px-5 text-xs font-bold text-gray-400 text-center">{i + 1}.</td>
 <td className="py-3 px-5 text-sm font-semibold text-gray-800">
 <span className="font-bold text-gray-900 underline decoration-gray-200 underline-offset-2 mr-1">{student.name} ({student.rollNumber || student.registrationNo})</span>
 {log.message}
 </td>
 <td className="py-3 px-5 text-xs font-bold text-gray-600">{log.user}</td>
 <td className="py-3 px-5 text-xs font-bold text-gray-500 text-right">{log.date}</td>
 </tr>
 ))}
 
 {(student.transportHistory || []).length === 0 && (
 <tr>
 <td colSpan={4} className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
 No Transport History Found
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>
 )}
 
 {activeTab === "Certificate Details" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 {/* Header */}
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Award size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Document Collection Status</h3>
 </div>
 <div className="flex items-center gap-2">
 <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm hover:bg-gray-50 uppercase tracking-wide">
 <Printer size={14} /> Print Pending Doc. Letter
 </button>
 </div>
 </div>

 {/* Table Area */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">SR</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide min-w-[200px]">Certificates</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide text-center min-w-[250px]">Collected Status</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide min-w-[150px]">Remarks</th>
 <th className="py-3 px-5 text-xs font-bold text-gray-400 uppercase tracking-wide min-w-[250px]">Upload / Preview</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {certificates.map((cert: any, index: number) => (
 <tr key={cert.id} className={`hover:bg-gray-50/50 transition-colors group ${cert.status === "YES" ? 'bg-emerald-50/10' : ''}`}>
 <td className="py-3 px-5 text-xs font-bold text-gray-400 text-center">{index + 1}.</td>
 <td className="py-3 px-5">
 <div className="flex items-center gap-2">
 {cert.status === "YES" ? <FileCheck size={14} className="text-emerald-500" /> : <FileMinus size={14} className="text-gray-300" />}
 <span className={`text-sm font-bold ${cert.status === "YES" ? 'text-gray-900' : 'text-gray-600'}`}>{cert.name}</span>
 </div>
 </td>
 <td className="py-3 px-5">
 <div className="flex items-center justify-center gap-3">
 {["YES", "NO", "N/A", "PARTIAL"].map(opt => (
 <label key={opt} className={`flex items-center gap-1.5 cursor-pointer text-xs font-bold tracking-wider transition-colors ${cert.status === opt ? (opt === 'YES' ? 'text-emerald-600' : opt === 'NO' ? 'text-red-500' : opt === 'PARTIAL' ? 'text-amber-500' : 'text-[#144835]') : 'text-gray-400 hover:text-gray-600'}`}>
 <input 
 type="radio" 
 name={`cert-${cert.id}`} 
 value={opt} 
 checked={cert.status === opt}
 onChange={(e) => handleCertificateStatusChange(index, e.target.value)}
 className="w-3.5 h-3.5 text-[#144835] bg-gray-100 border-gray-300 focus:ring-[#144835] focus:ring-1 cursor-pointer"
 />
 {opt}
 </label>
 ))}
 </div>
 </td>
 <td className="py-2 px-5">
 <input 
 type="text" 
 value={cert.remark}
 onChange={(e) => handleCertificateRemarkChange(index, e.target.value)}
 placeholder="Add remark..." 
 className="h-8 w-full rounded-lg border border-transparent bg-transparent group-hover:bg-white group-hover:border-gray-200 px-3 text-xs font-medium text-gray-700 focus:bg-white focus:border-[#144835] focus:ring-1 focus:ring-[#144835]/20 outline-none transition-all placeholder:text-transparent group-hover:placeholder:text-gray-300" 
 />
 </td>
 <td className="py-2 px-5">
 <div className="flex items-center gap-3 flex-wrap">
 {hasCertificateFile(cert) ? (
 <>
 <a
 href={String(cert.fileUrl)}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1 text-xs font-bold text-[#144835] hover:underline uppercase tracking-wider"
 >
 <Eye size={12} /> Preview
 </a>
 <span
 className="text-xs font-semibold text-gray-600 truncate max-w-[140px]"
 title={cert.fileName || "Uploaded document"}
 >
 {cert.fileName || "Uploaded document"}
 </span>
 <button
 type="button"
 onClick={() => void handleCertificateRemove(index)}
 className="text-xs font-bold text-rose-500 hover:underline uppercase tracking-wider"
 >
 Remove
 </button>
 </>
 ) : (
 <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
 <Eye size={12} /> No Doc
 </span>
 )}
 <div className="w-px h-3 bg-gray-200"></div>
 <label className="flex items-center gap-1.5 cursor-pointer group/upload">
 <div className={`h-7 px-3 rounded-md flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
 uploadingCertId === cert.id
 ? "bg-[#144835]/10 text-[#144835]"
 : "bg-gray-100 text-gray-600 group-hover/upload:bg-[#144835] group-hover/upload:text-white"
 }`}>
 <UploadCloud size={12} /> {uploadingCertId === cert.id ? "Uploading…" : "Upload"}
 </div>
 <span className="text-xs font-medium text-gray-400 truncate max-w-[120px]">
 {hasCertificateFile(cert) ? cert.fileName || "File uploaded" : "No file chosen"}
 </span>
 <input
 type="file"
 className="hidden"
 accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
 disabled={uploadingCertId === cert.id}
 onChange={(e) => void handleCertificateUpload(e, index)}
 />
 </label>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Footer Actions & Warning */}
 <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50 max-w-xl">
 <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
 <p className="text-xs font-bold text-red-600 leading-relaxed">
 <span className="text-red-800 font-bold uppercase tracking-wider mr-1">Note:</span> 
 Document size must be 5 MB or less. Only PDF and JPG formats are supported for uploads.
 </p>
 </div>
 <button onClick={handleUpdateCertificates} className="inline-flex items-center justify-center px-8 py-3 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-sm hover:bg-[#0d3023] hover:shadow transition-all active:scale-95 whitespace-nowrap">
 Update Information
 </button>
 </div>
 </div>
 </div>
 )}
 
 {activeTab === "Photos" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
 
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <CameraIcon size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profile Photographs</h3>
 </div>
 </div>

 <div className="p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
 {[
 { id: 'student', label: "Student Photo", value: photos.student },
 { id: 'father', label: "Father's Photo", value: photos.father },
 { id: 'mother', label: "Mother's Photo", value: photos.mother },
 { id: 'guardian', label: "Guardian's Photo", value: photos.guardian }
 ].map((photoType) => (
 <div key={photoType.id} className="flex flex-col items-center group">
 <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b-2 border-emerald-100 w-full text-center group-hover:border-[#144835] transition-colors">{photoType.label}</h4>
 
 {/* Photo Display Box */}
 <div className="relative w-40 h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center overflow-hidden mb-5 group-hover:border-[#144835]/30 group-hover:bg-emerald-50/20 transition-all shadow-sm">
 {uploadingPhoto === photoType.id ? (
 <div className="flex flex-col items-center gap-3 text-emerald-600">
 <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
 <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
 </div>
 ) : photoType.value ? (
 <>
 <img src={photoType.value} alt={photoType.label} className="w-full h-full object-cover" />
 <button onClick={() => handlePhotoRemove(photoType.id as any)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition-colors z-10 ">
 <Trash2 size={14} strokeWidth={2.5} />
 </button>
 </>
 ) : (
 <div className="text-gray-300 flex flex-col items-center gap-2">
 <User size={48} strokeWidth={1.5} />
 <span className="text-xs font-bold uppercase tracking-wider text-gray-400">No Image</span>
 </div>
 )}
 </div>

 {/* Action Buttons */}
 <div className="w-full space-y-2.5 flex flex-col items-center">
 <div className="flex items-center gap-2 w-full justify-center">
 <label className="flex-1 max-w-[120px] h-8 flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm">
 <UploadCloud size={14} />
 <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
 <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, photoType.id as any)} />
 </label>
 </div>
 <button onClick={() => handleCaptureClick(photoType.id as any)} className="w-full max-w-[120px] h-8 flex items-center justify-center gap-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm text-xs font-bold uppercase tracking-wider">
 <CameraIcon size={14} /> Capture
 </button>
 <input type="file" id={`camera-input-${photoType.id}`} className="hidden" accept="image/*" capture="environment" onChange={(e) => handlePhotoUpload(e, photoType.id as any)} />
 </div>
 </div>
 ))}
 </div>

 {/* Footer Actions & Warning */}
 <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50 max-w-xl">
 <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
 <p className="text-xs font-bold text-red-600 leading-relaxed">
 <span className="text-red-800 font-bold uppercase tracking-wider mr-1">Note:</span> 
 Image Size Should be less than 10 MB. Only GIF, JPEG, PNG formats are supported.
 </p>
 </div>
 <button onClick={handleUpdatePhotos} className="inline-flex items-center justify-center px-8 py-3 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-sm hover:bg-[#0d3023] hover:shadow transition-all active:scale-95 whitespace-nowrap">
 Save Photos
 </button>
 </div>
 </div>
 </div>
 )}
 
 {activeTab === "Attendance" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 
 {/* Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
 <CheckCircle2 size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Present</p>
 <p className="text-xl font-bold text-gray-900 leading-none mt-1">{attendanceStats?.presentDays || 0}</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
 <XCircle size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Absent</p>
 <p className="text-xl font-bold text-gray-900 leading-none mt-1">{attendanceStats?.absentDays || 0}</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
 <AlertTriangle size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Late / Half Day</p>
 <p className="text-xl font-bold text-gray-900 leading-none mt-1">{attendanceStats?.lateDays || 0}</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-4 relative overflow-hidden">
 <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-emerald-50 to-transparent"></div>
 <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
 <Calendar size={20} strokeWidth={2.5} />
 </div>
 <div className="relative z-10">
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total %</p>
 <p className="text-xl font-bold text-[#144835] leading-none mt-1">{attendanceStats?.percentage || "0"}%</p>
 </div>
 </div>
 </div>

 {/* The Massive Grid */}
 <StudentAnnualAttendanceRegister
   attendance={student.attendance}
   academicYearName={currentYear?.name ?? student.academicYear}
 />

 </div>
 )}
 
 {activeTab === "Messages" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex items-center gap-2 px-1">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <MessageSquare size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
 Student ↔ Teacher chats
 </h3>
 <p className="text-[10px] font-semibold text-gray-400">
 Direct messages between this student and teachers
 </p>
 </div>
 </div>
 <StudentTeacherChatsPanel
 schoolId={schoolId}
 studentId={studentId}
 studentName={String(student?.name ?? student?.studentName ?? "")}
 />
 </div>
 )}

 {activeTab === "Performance" && (
 <StudentPerformancePanel
 schoolId={schoolId}
 studentId={studentId}
 academicYear={currentYear?.name ?? student?.academicYear ?? null}
 grade={String(student?.classId || student?.grade || "").trim()}
 section={String(student?.section || "").trim()}
 studentName={String(student?.name ?? student?.studentName ?? "").trim()}
 admissionNo={String(student?.admissionNo ?? student?.admNo ?? "").trim()}
 />
 )}

 {activeTab === "GatePass" && (
 <StudentGatePassesPanel
 schoolId={schoolId}
 studentId={studentId}
 academicYear={currentYear?.name ?? student?.academicYear ?? null}
 studentName={String(student?.name ?? student?.studentName ?? "").trim()}
 admissionNo={String(student?.admissionNo ?? student?.admNo ?? "").trim()}
 grade={String(student?.classId || student?.grade || "").trim()}
 section={String(student?.section || "").trim()}
 fatherName={String(student?.fatherName ?? "").trim()}
 motherName={String(student?.motherName ?? "").trim()}
 parentPhone={String(student?.fatherMobile1 || student?.mobileNumber || student?.permMobile || "").trim()}
 />
 )}

 {activeTab === "Activity Log" && (
 <StudentActivityLogPanel
 schoolId={schoolId}
 studentId={studentId}
 academicYear={currentYear?.name ?? student?.academicYear ?? null}
 />
 )}
{activeTab !== "Basic Details" && activeTab !== "Fee Details" && activeTab !== "Transport Details" && activeTab !== "Certificate Details" && activeTab !== "Photos" && activeTab !== "Attendance" && activeTab !== "Messages" && activeTab !== "Performance" && activeTab !== "GatePass" && activeTab !== "Activity Log" && (
 <div className="p-12 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
 <FileText size={24} className="text-gray-400" />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{activeTab}</h3>
 <p className="text-xs text-gray-500 mt-1">This module is currently under development.</p>
 </div>
 )}
 
 </div>
 </div>
 </div>
 </div>
 </div>
 <CapturePhotoModal 
 isOpen={isCaptureModalOpen}
 onClose={() => setIsCaptureModalOpen(false)}
 onCapture={handlePhotoCaptured}
 schoolId={schoolId}
 studentId={studentId}
 photoType={capturePhotoType}
 />
 </div>
 );
}
