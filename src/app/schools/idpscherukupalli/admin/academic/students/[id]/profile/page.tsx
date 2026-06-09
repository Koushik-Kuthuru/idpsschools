"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouteParam } from "@/hooks/useRouteParams";
import { ArrowLeft, Pencil, User, AlertCircle, Users, BookOpen, Heart, Building, Home, FileText, Printer, MessageSquare, IndianRupee, Award, Bus, Camera, Calendar, TrendingUp, Ticket, List, Library, Wallet, MapPin, Clock, Phone, History, UploadCloud, FileCheck, FileMinus, Eye, Trash2, Camera as CameraIcon, CheckCircle2, XCircle, AlertTriangle, Smartphone, Bell, Check, Send, BarChart3, ChevronDown, Download, ShieldCheck, ShieldAlert, UserCheck, Clock4, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import CapturePhotoModal from "@/components/ui/CapturePhotoModal";
import { calculateAttendanceStats, AttendanceStats } from "@/utils/attendance";

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

export default function AdminStudentProfilePage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const studentId = useRouteParam(params, "id");
 const searchParams = useSearchParams();
 const schoolId = "idpscherukupalli"; // Update this per school
 const [student, setStudent] = useState<any | null>(null);
 const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
 const [feeStructure, setFeeStructure] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);
 
 const [perfClassFilter, setPerfClassFilter] = useState("Current Class");
 const [perfTermFilter, setPerfTermFilter] = useState("Term 1");
 const [perfExamTypeFilter, setPerfExamTypeFilter] = useState("All Exams");
 const initialTab = searchParams?.get("tab") || "Basic Details";
 const [activeTab, setActiveTab] = useState(initialTab);

 // Capture Modal State
 const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
 const [capturePhotoType, setCapturePhotoType] = useState<'student' | 'father' | 'mother' | 'guardian'>('student');
 const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

 const [feeCategory, setFeeCategory] = useState("GENERAL");
 const [feeTypeFilter, setFeeTypeFilter] = useState("MONTHLY");
 const [feeStatus, setFeeStatus] = useState("NEW");
 const [lastYearDue, setLastYearDue] = useState("0");
 const [discRemark, setDiscRemark] = useState("");
 const [photos, setPhotos] = useState({
 student: "",
 father: "",
 mother: "",
 guardian: ""
 });
 const [certificates, setCertificates] = useState([{"id":1,"name":"Admission Form","status":"NO","remark":"","fileUrl":"dummy-link.pdf"},{"id":2,"name":"School Leaving Certificate(TC)","status":"NO","remark":"","fileUrl":""},{"id":3,"name":"Bonafide Certificate","status":"NO","remark":"","fileUrl":""},{"id":4,"name":"Birth Certificate","status":"NO","remark":"","fileUrl":""},{"id":5,"name":"Caste Certificate","status":"NO","remark":"","fileUrl":""},{"id":6,"name":"All Documents","status":"NO","remark":"","fileUrl":"dummy-link.pdf"},{"id":7,"name":"Ration Card","status":"NO","remark":"","fileUrl":""},{"id":8,"name":"Student Adhar Certificate","status":"NO","remark":"","fileUrl":""},{"id":9,"name":"Father Adhar Certificate","status":"NO","remark":"","fileUrl":""},{"id":10,"name":"Mother Adhar Certificate","status":"NO","remark":"","fileUrl":""}]);
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
 

 const [feeGrid, setFeeGrid] = useState([
 { name: "LAST YEAR DUE", method: "-", values: Array(12).fill("0") },
 { name: "ADMISSION FEE", method: "ONE TIME", values: ["15000", ...Array(11).fill("0")] },
 { name: "TUITION FEE", method: "QUARTERLY", values: ["0", "0", "0", "38500", "0", "0", "38500", "0", "0", "38000", "0", "0"] },
 { name: "HOSTEL FEE", method: "QUARTERLY", values: ["0", "0", "0", "40000", "0", "0", "35000", "0", "0", "35000", "0", "0"] },
 { name: "IIT FEE", method: "-", values: Array(12).fill("0") },
 { name: "OLYMPIAD FEE", method: "-", values: Array(12).fill("0") },
 { name: "EXCURSION FEE", method: "-", values: Array(12).fill("0") },
 { name: "CURRICULUM FEE", method: "-", values: Array(12).fill("0") },
 { name: "FOOD FEE", method: "-", values: Array(12).fill("0") },
 { name: "MISCELLANEOUS", method: "-", values: Array(12).fill("0") },
 { name: "TRANSPORT FEE", method: "QUARTERLY", values: Array(12).fill("0") },
 ]);

 const handleFeeChange = (rowIdx: number, colIdx: number, val: string) => {
 const newGrid = [...feeGrid];
 // Allow only numbers
 if (/^\d*$/.test(val)) {
 newGrid[rowIdx].values[colIdx] = val === "" ? "0" : parseInt(val, 10).toString();
 setFeeGrid(newGrid);
 }
 };

 const resetFeeGrid = () => {
 setFeeCategory("GENERAL");
 setFeeTypeFilter("MONTHLY");
 setFeeStatus("NEW");
 setLastYearDue("0");
 setDiscRemark("");
 setFeeGrid(feeGrid.map(row => ({ ...row, values: Array(12).fill("0") })));
 };

 const calculateRowTotal = (values: string[]) => {
 return values.reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
 };

 
 useEffect(() => {
 // When Fee Type Filter changes, we could potentially clear out or reshape the grid.
 // For now, we just observe it. A full implementation would wipe rows that don't match the interval.
 }, [feeTypeFilter]);
 
 
 
 
 const handleUpdatePhotos = async () => {
 try {
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 // We also update the main student.photo field for backward compatibility with other parts of the app
 await updateDoc(docRef, { 
 photos,
 ...(photos.student ? { photo: photos.student } : {})
 });
 alert("Photos updated successfully!");
 } catch (err) {
 console.error("Error saving photos:", err);
 alert("Failed to save photos.");
 }
 };

 
 const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'student' | 'father' | 'mother' | 'guardian') => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (file.size > 10 * 1024 * 1024) {
 alert("File size exceeds 10MB limit.");
 return;
 }

 setUploadingPhoto(type);
 try {
 const fileRef = ref(storage, `schools/${schoolId}/students/${studentId}/photos/${type}_${Date.now()}`);
 
 // Increased timeout/retry logic internally handled by Firebase, but we add a safety timeout
 const uploadTask = uploadBytes(fileRef, file);
 
 const timeoutPromise = new Promise((_, reject) => 
 setTimeout(() => reject(new Error("Upload timed out. Please check your internet connection or try a smaller image.")), 30000)
 );

 const snapshot = await Promise.race([uploadTask, timeoutPromise]) as any;
 const url = await getDownloadURL(snapshot.ref);
 
 const newPhotos = { ...photos, [type]: url };
 setPhotos(newPhotos);

 if (type === 'student') {
 setStudent((prev: any) => ({ ...prev, photo: url }));
 }

 // Auto save to database
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, { 
 photos: newPhotos,
 ...(type === 'student' ? { photo: url } : {})
 });
 
 } catch (err: any) {
 console.error("Error uploading photo:", err);
 alert(`Failed to upload photo: ${err.message || "Please try again."}`);
 } finally {
 setUploadingPhoto(null);
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
 url = fileOrUrl;
 } else {
 const fileRef = ref(storage, `schools/${schoolId}/students/${studentId}/photos/${type}_${Date.now()}`);
 
 const uploadTask = uploadBytes(fileRef, fileOrUrl);
 const timeoutPromise = new Promise((_, reject) => 
 setTimeout(() => reject(new Error("Upload timed out. Please check your internet connection.")), 30000)
 );

 const snapshot = await Promise.race([uploadTask, timeoutPromise]) as any;
 url = await getDownloadURL(snapshot.ref);
 }
 
 const newPhotos = { ...photos, [type]: url };
 setPhotos(newPhotos);

 if (type === 'student') {
 setStudent((prev: any) => ({ ...prev, photo: url }));
 }

 // Auto save to database
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, { 
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
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, { 
 photos: newPhotos,
 ...(type === 'student' ? { photo: "" } : {})
 });
 } catch (err) {
 console.error("Error removing photo:", err);
 }
 };

 const handleUpdateCertificates = async () => {
 try {
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, { certificates });
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

 const handleUpdateTransportInfo = async () => {
 try {
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, {
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
 });
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

 const handleUpdateFeeStructure = async () => {
 try {
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 await updateDoc(docRef, {
 feeDetails: {
 feeCategory,
 feeTypeFilter,
 feeStatus,
 lastYearDue,
 discRemark,
 feeGrid
 }
 });
 alert("Fee structure saved to database successfully!");
 } catch (err) {
 console.error("Error saving fee structure:", err);
 alert("Failed to save fee structure.");
 }
 };

 const calculateGrandTotal = () => {
 const gridTotal = feeGrid.reduce((sum, row) => sum + calculateRowTotal(row.values), 0);
 return gridTotal + (parseInt(lastYearDue, 10) || 0);
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
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 const snap = await getDoc(docRef);
 if (snap.exists()) {
 const studentData = { id: snap.id, ...(snap.data() as any) };
 setStudent(studentData);

 // Calculate attendance stats
 const stats = calculateAttendanceStats(
 studentData.attendance?.presentDates || [],
 studentData.attendance?.absentDates || [],
 studentData.attendance?.lateDates || []
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
 setCertificates(studentData.certificates);
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
 if (studentData.feeDetails) {
 setFeeCategory(studentData.feeDetails.feeCategory || "GENERAL");
 setFeeTypeFilter(studentData.feeDetails.feeTypeFilter || "MONTHLY");
 setFeeStatus(studentData.feeDetails.feeStatus || "NEW");
 setLastYearDue(studentData.feeDetails.lastYearDue || "0");
 setDiscRemark(studentData.feeDetails.discRemark || "");
 if (studentData.feeDetails.feeGrid && Array.isArray(studentData.feeDetails.feeGrid)) {
 setFeeGrid(studentData.feeDetails.feeGrid);
 }
 }
 
 // Try to fetch fee structure for the student's class
 if (studentData.classId || studentData.grade) {
 const gradeToSearch = studentData.classId || studentData.grade;
 const feeQuery = query(collection(db, "schools", schoolId, "fee_structures"), where("grade", "==", gradeToSearch));
 const feeSnap = await getDocs(feeQuery);
 if (!feeSnap.empty) {
 setFeeStructure(feeSnap.docs[0].data());
 }
 }
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
 }, [studentId, schoolId]);

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 if (!student) {
 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10">
 <div>
 <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] uppercase">Student Profile</h1>
 <p className="mt-2 text-xs font-semibold text-slate-600">Student not found: {studentId}</p>
 </div>
 <Link
 href={`/schools/${schoolId}/admin/academic/students`}
 className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 w-fit"
 >
 <ArrowLeft size={16} /> Back to Student List
 </Link>
 </div>
 );
 }

 const getStatusColor = (status: string) => {
 if (status === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
 if (status === "Inactive") return "bg-red-50 text-red-700 border-red-200";
 return "bg-gray-50 text-gray-700 border-gray-200";
 };

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-2">
 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative">
 {/* Left Column: Summary Card */}
 <div className="xl:col-span-3 space-y-6 sticky top-6 h-fit max-h-[calc(100vh-3rem)] overflow-y-auto hide-scrollbar">
 <Link href={`/schools/${schoolId}/admin/academic/students`} className="inline-flex items-center gap-2 px-1 text-gray-500 hover:text-gray-900 transition-colors mb-1 text-sm font-bold">
 <ArrowLeft size={16} /> Back to Students
 </Link>
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
 <h3 className="text-xs font-extrabold uppercase tracking-wide text-emerald-200 mb-4">Current Academic Year</h3>
 <div className="space-y-4">
 <div>
 <p className="text-xs text-emerald-100/70 font-bold uppercase tracking-wider">Attendance</p>
 <div className="flex items-end gap-2 mt-1">
 <span className="text-2xl font-bold">92%</span>
 <span className="text-xs text-emerald-200 mb-1">present</span>
 </div>
 </div>
 <div className="w-full bg-black/20 rounded-full h-1.5">
 <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '92%' }}></div>
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
 <style jsx global>{`
 .hide-scrollbar::-webkit-scrollbar { display: none; }
 .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
 `}</style>
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
 <Link
 href={`/schools/${schoolId}/admin/academic/students/${encodeURIComponent(student.id)}/edit`}
 className="inline-flex items-center gap-2 rounded-lg bg-[#144835] px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:opacity-90 uppercase tracking-wide"
 >
 <Pencil size={14} /> Edit
 </Link>
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
 <InfoField label="User ID / Username" value={student.username} />
 <InfoField label="Portal Password" value={student.portalPassword} />
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
 {feeGrid.map((fee, rowIdx) => {
 let rowTotal = calculateRowTotal(fee.values);
 let displayValues = fee.values;
 
 if (fee.name === "LAST YEAR DUE") {
 displayValues = [lastYearDue, ...Array(11).fill("0")];
 rowTotal = parseInt(lastYearDue, 10) || 0;
 }
 return (
 <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-2 px-4 text-xs font-bold text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">{fee.name}</td>
 <td className="py-2 px-3 text-center">
 <span className="text-xs font-bold text-gray-400 bg-gray-100/50 px-2 py-1 rounded uppercase tracking-wider">{fee.method}</span>
 </td>
 {displayValues.map((val, colIdx) => (
 <td key={colIdx} className="py-2 px-1 text-center">
 <input 
 type="text" 
 value={displayValues[colIdx]}
 onChange={(e) => handleFeeChange(rowIdx, colIdx, e.target.value)}
 onFocus={(e) => e.target.value === "0" && e.target.select()}
 disabled={fee.name === "LAST YEAR DUE" && colIdx > 0}
 readOnly={fee.name === "LAST YEAR DUE"}
 className={`w-14 h-8 text-center text-xs font-bold ${displayValues[colIdx] === "0" || displayValues[colIdx] === "" ? 'text-gray-400 bg-gray-50/50' : 'text-gray-900 bg-emerald-50/50'} border border-transparent rounded-md focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 outline-none transition-all hover:bg-white hover:border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
 />
 </td>
 ))}
 <td className="py-2 px-4 text-right bg-emerald-50/30 border-l border-emerald-100/50">
 <span className="text-xs font-bold text-[#144835]">{rowTotal.toLocaleString()}</span>
 </td>
 </tr>
 )})}
 
 {/* Grand Total Row */}
 <tr className="bg-gray-50/80 border-t-2 border-gray-200">
 <td colSpan={14} className="py-4 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#f3f4f6]">Grand Total</td>
 <td className="py-4 px-4 text-right bg-emerald-100/50 border-l border-emerald-200/50">
 <span className="text-sm font-bold text-[#144835]">₹{calculateGrandTotal().toLocaleString()}</span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 
 {activeTab === "Fee Details" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {/* Alert Notice */}
 <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex items-start gap-3 shadow-sm">
 <div className="text-amber-500 mt-0.5"><AlertCircle size={18} strokeWidth={2.5}/></div>
 <div>
 <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Important Notice</h4>
 <p className="text-xs font-bold text-amber-700/80 mt-0.5">Transport/Bus Fee indicated here is for reference only. For changing Bus Fee, please go to the <strong>'Transport Details'</strong> section.</p>
 </div>
 </div>

 {/* Fee Structure Table Card */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
 
 {/* Top Controls Header */}
 <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
 <div className="flex flex-wrap items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</span>
 <select value={feeCategory} onChange={e => setFeeCategory(e.target.value)} className="h-8 rounded-lg border border-gray-200 bg-white px-3 py-0 text-xs font-bold text-[#144835] focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm cursor-pointer appearance-none pr-8 relative" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23144835' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1em 1em` }}>
 <option value="GENERAL">GENERAL</option>
 <option value="RTE">RTE</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Type</span>
 <select value={feeTypeFilter} onChange={e => setFeeTypeFilter(e.target.value)} className="h-8 rounded-lg border border-gray-200 bg-white px-3 py-0 text-xs font-bold text-[#144835] focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm cursor-pointer appearance-none pr-8 relative" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23144835' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1em 1em` }}>
 <option value="MONTHLY">MONTHLY</option>
 <option value="QUARTERLY">QUARTERLY</option>
 <option value="YEARLY">YEARLY</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
 <select value={feeStatus} onChange={e => setFeeStatus(e.target.value)} className="h-8 rounded-lg border border-gray-200 bg-white px-3 py-0 text-xs font-bold text-[#144835] focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm cursor-pointer appearance-none pr-8 relative" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23144835' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1em 1em` }}>
 <option value="NEW">NEW</option>
 <option value="OLD">OLD</option>
 </select>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Year Due</span>
 <input type="number" value={lastYearDue} onChange={e => setLastYearDue(e.target.value)} onFocus={(e) => e.target.value === "0" && e.target.select()} className="h-8 w-24 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm text-center" />
 </div>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Disc. Remark</span>
 <input type="text" value={discRemark} onChange={e => setDiscRemark(e.target.value)} placeholder="Optional remark..." className="h-8 w-full sm:w-48 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:border-[#144835] focus:ring-1 focus:ring-[#144835] outline-none shadow-sm placeholder:text-gray-400" />
 </div>
 </div>

 {/* Data Grid */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-gray-50/50 border-b border-gray-100">
 <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50/90 backdrop-blur-sm z-20 shadow-[1px_0_0_0_#f3f4f6]">Fee Type</th>
 <th className="py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Method</th>
 {["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"].map(m => (
 <th key={m} className="py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">{m}</th>
 ))}
 <th className="py-3 px-4 text-xs font-bold text-[#144835] uppercase tracking-wide text-right bg-emerald-50/50">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {[
 { name: "LAST YEAR DUE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "ADMISSION FEE", method: "ONE TIME", values: ["15000", ...Array(11).fill("0")], total: "15000" },
 { name: "TUITION FEE", method: "QUARTERLY", values: ["0", "0", "0", "38500", "0", "0", "38500", "0", "0", "38000", "0", "0"], total: "115000" },
 { name: "HOSTEL FEE", method: "QUARTERLY", values: ["0", "0", "0", "40000", "0", "0", "35000", "0", "0", "35000", "0", "0"], total: "110000" },
 { name: "IIT FEE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "OLYMPIAD FEE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "EXCURSION FEE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "CURRICULUM FEE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "FOOD FEE", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "MISCELLANEOUS", method: "-", values: Array(12).fill("0"), total: "0" },
 { name: "TRANSPORT FEE", method: "QUARTERLY", values: Array(12).fill("0"), total: "0" },
 ].map((fee, idx) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-2 px-4 text-xs font-bold text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">{fee.name}</td>
 <td className="py-2 px-3 text-center">
 <span className="text-xs font-bold text-gray-400 bg-gray-100/50 px-2 py-1 rounded uppercase tracking-wider">{fee.method}</span>
 </td>
 {fee.values.map((val, i) => (
 <td key={i} className="py-2 px-1 text-center">
 <input 
 type="text" 
 defaultValue={val} 
 className={`w-14 h-8 text-center text-xs font-bold ${val === "0" ? 'text-gray-400 bg-gray-50/50' : 'text-gray-900 bg-emerald-50/50'} border border-transparent rounded-md focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/20 outline-none transition-all hover:bg-white hover:border-gray-200 shadow-sm`}
 />
 </td>
 ))}
 <td className="py-2 px-4 text-right bg-emerald-50/30 border-l border-emerald-100/50">
 <span className="text-xs font-bold text-[#144835]">{fee.total}</span>
 </td>
 </tr>
 ))}
 
 {/* Grand Total Row */}
 <tr className="bg-gray-50/80 border-t-2 border-gray-200">
 <td colSpan={14} className="py-4 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wide sticky left-0 z-10 shadow-[1px_0_0_0_#f3f4f6]">Grand Total</td>
 <td className="py-4 px-4 text-right bg-emerald-100/50 border-l border-emerald-200/50">
 <span className="text-sm font-bold text-[#144835]">240000</span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Footer Update Action */}
 <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center gap-3">
 <button onClick={resetFeeGrid} className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors">Reset Values</button>
 <button onClick={handleUpdateFeeStructure} className="inline-flex items-center justify-center px-6 py-2.5 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-[#0d3023] hover:shadow transition-all active:scale-95">
 Update Fee Structure
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === "Transport Details" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 
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
 <div className="flex items-center gap-3">
 {cert.fileUrl ? (
 <button className="flex items-center gap-1 text-xs font-bold text-[#144835] hover:underline uppercase tracking-wider">
 <Eye size={12} /> Preview
 </button>
 ) : (
 <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1"><Eye size={12} /> No Doc</span>
 )}
 <div className="w-px h-3 bg-gray-200"></div>
 <label className="flex items-center gap-1.5 cursor-pointer group/upload">
 <div className="h-7 px-3 rounded-md bg-gray-100 text-gray-600 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider group-hover/upload:bg-[#144835] group-hover/upload:text-white transition-colors">
 <UploadCloud size={12} /> Upload
 </div>
 <span className="text-xs font-medium text-gray-400 truncate max-w-[100px]">No file chosen</span>
 <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg" />
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
 Document size should be greater than 1 MB. Only PDF and JPG formats are supported for uploads.
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
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col">
 <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-emerald-50 text-[#144835] flex items-center justify-center shrink-0">
 <Calendar size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Annual Attendance Register</h3>
 </div>
 <div className="flex items-center gap-3 text-xs font-bold text-gray-800 tracking-wide uppercase">
 <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200"></div> Present</span>
 <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200"></div> Absent</span>
 <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#144835] text-white flex items-center justify-center text-xs">S</div> Sunday/Holiday</span>
 </div>
 </div>

 <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
 <style jsx global>{`
 .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
 `}</style>
 <table className="w-full text-center border-collapse">
 <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_#f3f4f6]">
 <tr className="bg-[#144835]">
 <th className="py-3 px-2 text-xs font-bold text-white uppercase tracking-wide sticky left-0 z-30 bg-[#0d3023] w-20 shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">Date</th>
 {["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"].map(m => (
 <th key={m} className="py-3 px-2 text-xs font-bold text-white uppercase tracking-wide min-w-[40px] border-l border-white/10">{m}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
 <tr key={day} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-1.5 px-2 text-xs font-bold text-gray-600 sticky left-0 bg-gray-50 group-hover:bg-gray-100/80 z-10 shadow-[1px_0_0_0_#f3f4f6]">
 {day.toString().padStart(2, '0')}
 </td>
 {Array.from({ length: 12 }, (_, monthIdx) => {
 // Real data logic
 const monthMap = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
 const monthStr = monthMap[monthIdx];
 const dateStr = `${day}-${monthStr}`;
 
 // Using student.attendance array/object
 const isSunday = student.attendance?.sundays?.includes(dateStr) || (new Date(new Date().getFullYear(), (monthIdx + 3) % 12, day).getDay() === 0);
 const isAbsent = student.attendance?.absentDates?.includes(dateStr);
 const isPresent = student.attendance?.presentDates?.includes(dateStr);
 const isInvalidDate = (day === 31 && [0, 2, 4, 7, 9, 11].includes(monthIdx)) || (day > 28 && monthIdx === 10);
 
 let cellContent = "";
 let cellClass = "border-l border-gray-100";
 
 if (isInvalidDate) {
 cellClass += " bg-gray-100/50";
 return (
 <td key={monthIdx} className={`py-1.5 px-1 ${cellClass}`} style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
 {cellContent}
 </td>
 );
 } else if (isSunday) {
 cellContent = "SUN";
 cellClass += " bg-emerald-100/80 text-emerald-700 font-bold text-xs tracking-wider";
 } else if (isAbsent) {
 cellContent = "A";
 cellClass += " bg-red-50 text-red-600 font-bold text-xs";
 } else if (isPresent) {
 cellContent = "P";
 cellClass += " text-emerald-500 font-bold text-xs group-hover:text-emerald-600";
 } else {
 cellContent = "-";
 cellClass += " text-gray-300 font-bold text-xs";
 }

 return (
 <td key={monthIdx} className={`py-1.5 px-1 ${cellClass}`}>
 {cellContent}
 </td>
 );
 })}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 </div>
 )}
 
 {activeTab === "Messages" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col xl:flex-row">
 {/* Left Side: Compose Message */}
 <div className="flex-1 p-4 border-b xl:border-b-0 xl:border-r border-gray-100">
 <div className="flex items-center gap-2 mb-4">
 <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
 <MessageSquare size={20} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Compose Message</h3>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">Send alerts to parents</p>
 </div>
 </div>

 <div className="space-y-4">
 {/* Communication Method */}
 <div>
 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">1. Select Method</label>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {/* SMS Option */}
 <label className="relative cursor-pointer group">
 <input type="checkbox" name="messageMethod" value="sms" className="peer sr-only" defaultChecked />
 <div className="h-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 transition-all peer-checked:border-[#144835] peer-checked:bg-emerald-50/30 peer-checked:shadow-sm group-hover:border-gray-200">
 <MessageSquare size={24} className="text-gray-400 peer-checked:text-[#144835] transition-colors" strokeWidth={2} />
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider peer-checked:text-[#144835] transition-colors">SMS</span>
 </div>
 <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
 <div className="w-4 h-4 rounded-full bg-[#144835] flex items-center justify-center">
 <Check size={10} className="text-white" strokeWidth={3} />
 </div>
 </div>
 </label>
 
 {/* WhatsApp Option */}
 <label className="relative cursor-pointer group">
 <input type="checkbox" name="messageMethod" value="whatsapp" className="peer sr-only" />
 <div className="h-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 transition-all peer-checked:border-[#25D366] peer-checked:bg-[#25D366]/5 peer-checked:shadow-sm group-hover:border-gray-200">
 <Smartphone size={24} className="text-gray-400 peer-checked:text-[#25D366] transition-colors" strokeWidth={2} />
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider peer-checked:text-[#25D366] transition-colors">WhatsApp</span>
 </div>
 <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
 <div className="w-4 h-4 rounded-full bg-[#25D366] flex items-center justify-center">
 <Check size={10} className="text-white" strokeWidth={3} />
 </div>
 </div>
 </label>

 {/* App Option */}
 <label className="relative cursor-pointer group">
 <input type="checkbox" name="messageMethod" value="app" className="peer sr-only" />
 <div className="h-full p-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 flex flex-col items-center justify-center gap-2 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50/10 peer-checked:shadow-sm group-hover:border-gray-200">
 <Bell size={24} className="text-gray-400 peer-checked:text-blue-500 transition-colors" strokeWidth={2} />
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider peer-checked:text-blue-600 transition-colors">In-App</span>
 </div>
 <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity">
 <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
 <Check size={10} className="text-white" strokeWidth={3} />
 </div>
 </div>
 </label>
 </div>
 </div>

 {/* Message Content */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">2. Message Content</label>
 <button className="text-xs font-bold text-[#144835] hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 transition-colors">
 <FileText size={12} /> Use Template
 </button>
 </div>
 <textarea 
 rows={5}
 placeholder="Type your message here..."
 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all resize-none placeholder:text-gray-400"
 ></textarea>
 <div className="flex justify-between items-center mt-2">
 <p className="text-xs font-bold text-gray-400">Variables available: <span className="text-gray-500 bg-gray-100 px-1 rounded">{'{student_name}'}</span>, <span className="text-gray-500 bg-gray-100 px-1 rounded">{'{father_name}'}</span>, <span className="text-gray-500 bg-gray-100 px-1 rounded">{'{class}'}</span></p>
 <p className="text-xs font-bold text-gray-400">0 / 160 characters (1 SMS)</p>
 </div>
 </div>

 {/* Action */}
 <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
 <button className="px-6 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-wider transition-colors">
 Clear
 </button>
 <button className="px-6 py-2.5 rounded-xl bg-[#144835] text-white text-xs font-bold hover:bg-[#0d3023] uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 hover:-translate-y-0.5 flex items-center gap-2">
 <Send size={14} /> Send Message
 </button>
 </div>
 </div>
 </div>

 {/* Right Side: Communication History */}
 <div className="w-full xl:w-[350px] bg-gray-50/50 p-4 flex flex-col border-t xl:border-t-0 border-gray-100">
 <div className="flex items-center gap-2 mb-4">
 <div className="h-8 w-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-400 flex items-center justify-center shrink-0">
 <History size={16} strokeWidth={2.5} />
 </div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent History</h3>
 </div>

 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
 
 {(student.messages || []).length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <MessageSquare size={24} className="text-gray-300 mb-2" />
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">No Message History</p>
 </div>
 ) : (
 (student.messages || []).map((msg: any, idx: number) => (
 <div key={idx} className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group transition-colors ${
 msg.method === 'whatsapp' ? 'hover:border-[#25D366]/30' : 
 msg.method === 'app' ? 'hover:border-blue-500/30' : 
 'hover:border-[#144835]/30'
 }`}>
 <div className={`absolute left-0 top-0 bottom-0 w-1 ${
 msg.method === 'whatsapp' ? 'bg-[#25D366]' : 
 msg.method === 'app' ? 'bg-blue-500' : 
 'bg-[#144835]'
 }`}></div>
 <div className="flex justify-between items-start mb-2">
 <div className="flex items-center gap-1.5">
 {msg.method === 'whatsapp' ? <Smartphone size={12} className="text-[#25D366]" /> : 
 msg.method === 'app' ? <Bell size={12} className="text-blue-500" /> : 
 <MessageSquare size={12} className="text-[#144835]" />}
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{msg.method}</span>
 </div>
 <span className="text-xs font-bold text-gray-400">{msg.date}</span>
 </div>
 <p className="text-xs font-medium text-gray-700 line-clamp-2">{msg.content}</p>
 <div className="mt-3 flex items-center gap-1">
 {msg.status === 'Delivered' || msg.status === 'Read' ? (
 <CheckCircle2 size={12} className={msg.method === 'whatsapp' ? 'text-[#25D366]' : msg.method === 'app' ? 'text-blue-500' : 'text-[#144835]'} strokeWidth={2.5} />
 ) : (
 <Check size={12} className="text-gray-300" strokeWidth={3} />
 )}
 <span className={`text-xs font-bold uppercase tracking-wide ${
 msg.method === 'whatsapp' ? 'text-[#25D366]' : 
 msg.method === 'app' ? 'text-blue-500' : 
 'text-[#144835]'
 }`}>{msg.status || 'Sent'}</span>
 </div>
 </div>
 ))
 )}
 </div>
 <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 uppercase tracking-wide hover:bg-gray-100 hover:text-gray-600 transition-colors">
 View All History
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === "Performance" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {/* Filters Row */}
 <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-wrap items-center justify-between gap-4">
 <div className="flex flex-wrap items-center gap-3">
 {/* Class Filter */}
 <div className="relative group">
 <select 
 value={perfClassFilter}
 onChange={(e) => setPerfClassFilter(e.target.value)}
 className="appearance-none pl-4 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] hover:bg-gray-100 transition-colors cursor-pointer"
 >
 <option value="Current Class">Class {student?.classId || student?.grade || '10'}</option>
 <option value="Previous Class 1">Class {parseInt(student?.classId || student?.grade || '10') - 1 || '9'}</option>
 <option value="Previous Class 2">Class {parseInt(student?.classId || student?.grade || '10') - 2 || '8'}</option>
 </select>
 <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#144835] transition-colors" strokeWidth={3} />
 </div>

 {/* Term Filter */}
 <div className="relative group">
 <select 
 value={perfTermFilter}
 onChange={(e) => setPerfTermFilter(e.target.value)}
 className="appearance-none pl-4 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] hover:bg-gray-100 transition-colors cursor-pointer"
 >
 <option value="Term 1">Term 1</option>
 <option value="Term 2">Term 2</option>
 <option value="Final">Final</option>
 </select>
 <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#144835] transition-colors" strokeWidth={3} />
 </div>

 {/* Exam Type Filter */}
 <div className="relative group">
 <select 
 value={perfExamTypeFilter}
 onChange={(e) => setPerfExamTypeFilter(e.target.value)}
 className="appearance-none pl-4 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] hover:bg-gray-100 transition-colors cursor-pointer"
 >
 <option value="All Exams">All Exams / Tests</option>
 <option value="Unit Test 1">Unit Test 1</option>
 <option value="Half Yearly">Half Yearly</option>
 <option value="Annual Exam">Annual Exam</option>
 </select>
 <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#144835] transition-colors" strokeWidth={3} />
 </div>
 </div>

 <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#144835]/10 text-[#144835] text-xs font-bold uppercase tracking-wider hover:bg-[#144835]/20 transition-colors">
 <Download size={14} strokeWidth={2.5} />
 Download Report
 </button>
 </div>

 {/* Overall Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden group">
 <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-emerald-50 to-transparent"></div>
 <div className="flex items-center gap-3 mb-3 relative z-10">
 <div className="h-10 w-10 rounded-full bg-emerald-100/50 text-[#144835] flex items-center justify-center shrink-0">
 <BarChart3 size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overall Grade</p>
 <h4 className="text-base font-bold text-gray-900 leading-none mt-1">{student.performanceStats?.overallGrade || "-"}</h4>
 </div>
 </div>
 <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 inline-flex px-2 py-1 rounded-md">
 <TrendingUp size={12} strokeWidth={3} /> Top 5% in class
 </div>
 </div>

 <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
 <Award size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Marks</p>
 <h4 className="text-base font-bold text-gray-900 leading-none mt-1">{student.performanceStats?.totalObtained || 0}<span className="text-xs text-gray-400 ml-1 font-bold">/ {student.performanceStats?.totalMax || 0}</span></h4>
 </div>
 </div>
 <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
 <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '90.3%' }}></div>
 </div>
 </div>

 <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
 <BookOpen size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Percentage</p>
 <h4 className="text-base font-bold text-gray-900 leading-none mt-1">{student.performanceStats?.percentage || "0"}%</h4>
 </div>
 </div>
 <p className="text-xs font-bold text-gray-500 mt-2">Excellent performance</p>
 </div>

 <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
 <AlertCircle size={20} strokeWidth={2.5} />
 </div>
 <div>
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Needs Focus</p>
 <h4 className="text-sm font-bold text-gray-900 leading-tight mt-1">{student.performanceStats?.needsFocus || "-"}</h4>
 </div>
 </div>
 <p className="text-xs font-bold text-amber-600 bg-amber-50 inline-flex px-2 py-1 rounded-md mt-1">Lowest Score: 78%</p>
 </div>
 </div>

 {/* Detailed Subject Wise Marks Grid */}
 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
 <List size={16} strokeWidth={2.5} />
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Subject Wise Performance</h3>
 <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mt-0.5">Showing: {perfClassFilter} • {perfTermFilter}</p>
 </div>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Subject</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Max Marks</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Marks Obtained</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Percentage</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Grade</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Remarks</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {(student.performance?.[perfTermFilter]?.[perfExamTypeFilter] || []).map((item: any, idx: number) => {
 const maxMarks = item.max || 100; const obtainedMarks = item.obtained || 0; const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
 return (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-2.5 px-4">
 <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">{item.subject}</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="text-xs font-bold text-gray-500">{maxMarks}</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="text-xs font-bold text-gray-900">{obtainedMarks}</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <div className="flex items-center justify-center gap-2">
 <span className="text-xs font-bold text-[#144835] w-8">{percentage}%</span>
 <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden md:block">
 <div 
 className={`h-1.5 rounded-full ${percentage >= 90 ? 'bg-[#144835]' : percentage >= 80 ? 'bg-emerald-500' : percentage >= 70 ? 'bg-amber-400' : 'bg-red-500'}`} 
 style={{ width: `${percentage}%` }}
 ></div>
 </div>
 </div>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold tracking-wider ${
 (item.grade || '-') === 'A1' ? 'bg-[#144835]/10 text-[#144835]' :
 (item.grade || '-') === 'A2' ? 'bg-emerald-50 text-emerald-600' :
 (item.grade || '-') === 'B1' ? 'bg-blue-50 text-blue-600' :
 'bg-amber-50 text-amber-600'
 }`}>
 {(item.grade || '-')}
 </span>
 </td>
 <td className="py-2.5 px-4 text-right">
 <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{(item.remark || '-')}</span>
 </td>
 </tr>
 );
 })}
 
 {(student.performance?.[perfTermFilter]?.[perfExamTypeFilter] || []).length === 0 && (
 <tr>
 <td colSpan={6} className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
 No Performance Data Found for Selected Filters
 </td>
 </tr>
 )}
 </tbody>
 <tfoot className="bg-[#144835]/5 border-t border-gray-100">
 <tr>
 <td className="py-2.5 px-4">
 <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Grand Total</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="text-xs font-bold text-gray-900">600</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="text-xs font-bold text-[#144835]">542</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="text-xs font-bold text-[#144835]">90.3%</span>
 </td>
 <td className="py-2.5 px-4 text-center">
 <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-[#144835] text-white text-xs font-bold tracking-wider">A+</span>
 </td>
 <td className="py-2.5 px-4 text-right">
 <span className="text-xs font-bold text-[#144835] uppercase tracking-wide">Pass</span>
 </td>
 </tr>
 </tfoot>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === "GatePass" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gate Pass History</h3>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">Record of early departures and pickups</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#144835] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0d3023] transition-all shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:-translate-y-0.5">
 <Ticket size={14} strokeWidth={2.5} />
 Generate New Pass
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">#</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Pass Details</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Taken By</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Reason / Message</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Gate Status</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Photo ID</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {(student.gatePasses || []).map((pass: any, idx: number) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-2 px-4 text-center">
 <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
 </td>
 <td className="py-2 px-4">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{pass.type}</span>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Calendar size={10} /> {pass.date}</span>
 <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Clock4 size={10} /> {pass.time}</span>
 </div>
 </div>
 </td>
 <td className="py-2 px-4">
 <div className="flex flex-col">
 <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{pass.takenBy}</span>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">{pass.relation}</span>
 <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Phone size={10} /> {pass.mobile}</span>
 </div>
 </div>
 </td>
 <td className="py-2 px-4 max-w-[200px]">
 <p className="text-xs font-medium text-gray-600 line-clamp-2">{pass.message}</p>
 </td>
 <td className="py-2 px-4 text-center">
 {pass.confirmed ? (
 <div className="inline-flex flex-col items-center gap-1">
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
 <ShieldCheck size={12} strokeWidth={2.5} />
 <span className="text-xs font-bold uppercase tracking-wide">Confirmed</span>
 </div>
 <span className="text-xs font-bold text-gray-400">at Gate</span>
 </div>
 ) : (
 <div className="inline-flex flex-col items-center gap-1">
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
 <ShieldAlert size={12} strokeWidth={2.5} />
 <span className="text-xs font-bold uppercase tracking-wide">Pending</span>
 </div>
 <button className="text-xs font-bold text-[#144835] hover:text-emerald-700 hover:underline uppercase tracking-wider transition-colors">Mark Confirmed</button>
 </div>
 )}
 </td>
 <td className="py-2 px-4">
 <div className="flex justify-center">
 <div className="h-10 w-14 rounded-md overflow-hidden border-2 border-gray-100 shadow-sm relative group/photo cursor-pointer transition-all hover:scale-105 hover:shadow-md hover:border-[#144835]/30">
 <img src={pass.photo} alt="Taken By" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-[#144835]/60 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
 <Eye size={16} className="text-white" strokeWidth={2.5} />
 </div>
 </div>
 </div>
 </td>
 <td className="py-2 px-4 text-right">
 <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-[#144835] hover:text-white transition-colors shadow-sm">
 <Printer size={14} strokeWidth={2.5} />
 </button>
 </td>
 </tr>
 ))}
 
 {(student.gatePasses || []).length === 0 && (
 <tr>
 <td colSpan={7} className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
 No Gate Passes Found
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === "Activity Log" && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Activity Log</h3>
 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">Audit trail of changes made to this student's profile</p>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-gray-50/80 border-b border-gray-100">
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">#</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Date & Time</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Module</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Activity Details</th>
 <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-right">Changed By</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {(student.activityLog || []).length === 0 ? (
 <tr>
 <td colSpan={5} className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">
 No Activity Logs Found
 </td>
 </tr>
 ) : (
 (student.activityLog || []).map((log: any, idx: number) => (
 <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
 <td className="py-3 px-4 text-center">
 <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
 </td>
 <td className="py-3 px-4">
 <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><Clock4 size={12} /> {log.date || "-"}</span>
 </td>
 <td className="py-3 px-4">
 <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">{log.module || "General"}</span>
 </td>
 <td className="py-3 px-4 max-w-[300px]">
 <p className="text-xs font-medium text-gray-800 leading-snug">{log.message}</p>
 </td>
 <td className="py-3 px-4 text-right">
 <span className="text-xs font-bold text-[#144835] uppercase tracking-wider">{log.user || "System"}</span>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
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
