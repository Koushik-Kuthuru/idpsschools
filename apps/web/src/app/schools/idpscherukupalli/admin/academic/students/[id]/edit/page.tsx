"use client";

import { useSchoolId } from "@/hooks/useSchoolId";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRouteParam } from "@/hooks/useRouteParams";
import { ArrowLeft, Save, User, Heart, Building, Users, Home, BookOpen, FileText, CheckCircle2, GraduationCap, Sparkles, HelpCircle, Upload, X } from "lucide-react";
import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Tooltip Component
const TooltipIcon = ({ text }: { text?: string }) => {
 if (!text) return null;
 return (
 <div className="relative flex items-center group/tooltip ml-1.5 cursor-help">
 <HelpCircle size={12} className="text-gray-400 group-hover/tooltip:text-[#144835] transition-colors" />
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-gray-600 text-white text-xs font-medium px-2 py-1.5 rounded-md shadow-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 whitespace-normal text-center leading-tight">
 {text}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-gray-600"></div>
 </div>
 </div>
 );
};

// Reusable Components for Form Elements
const FormGroup = ({ title, icon: Icon, children }: { title: string, icon?: any, children: React.ReactNode }) => (
 <section className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center gap-2">
 {Icon && (
 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-gray-100 text-[#144835] flex items-center justify-center shrink-0">
 <Icon size={14} strokeWidth={2.5} />
 </div>
 )}
 <div>
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">{title}</h2>
 </div>
 </div>
 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-4 bg-white">
 {children}
 </div>
 </section>
);

const Input = ({ label, type = "text", value, onChange, placeholder, required, disabled = false, tooltip }: any) => {
 const hasValue = value !== undefined && value !== null && value !== "";
 return (
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center group-focus-within:text-[#144835] transition-colors relative">
 <span>{label} {required && <span className="text-red-500">*</span>}</span>
 <TooltipIcon text={tooltip} />
 </label>
 <input
 type={type}
 value={value}
 onChange={onChange}
 disabled={disabled}
 placeholder={placeholder}
 className={`w-full h-8 rounded-lg border border-gray-200 px-2.5 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm disabled:text-gray-400 disabled:cursor-not-allowed placeholder:text-gray-400 ${hasValue ? 'bg-emerald-50/50' : 'bg-gray-50/50'} ${disabled && hasValue ? 'bg-emerald-50/30' : ''} ${disabled && !hasValue ? 'bg-gray-100' : ''}`}
 />
 </div>
 );
};

const Select = ({ label, value, onChange, options, required, disabled = false, tooltip }: any) => {
 const hasValue = value !== undefined && value !== null && value !== "";
 return (
 <div className="flex flex-col group">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 flex items-center group-focus-within:text-[#144835] transition-colors relative">
 <span>{label} {required && <span className="text-red-500">*</span>}</span>
 <TooltipIcon text={tooltip} />
 </label>
 <select
 value={value}
 onChange={onChange}
 disabled={disabled}
 className={`w-full h-8 rounded-lg border border-gray-200 px-2.5 py-0 text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 outline-none transition-all shadow-sm disabled:text-gray-400 disabled:cursor-not-allowed appearance-none ${hasValue ? 'bg-emerald-50/50' : 'bg-gray-50/50'} ${disabled && hasValue ? 'bg-emerald-50/30' : ''} ${disabled && !hasValue ? 'bg-gray-100' : ''}`}
 style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
 >
 <option value="" disabled>-- Select --</option>
 {options.map((o: any) => (
 <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
 ))}
 </select>
 </div>
 );
};

const Checkbox = ({ label, checked, onChange, tooltip }: any) => (
 <label className="flex items-center gap-2 cursor-pointer mt-5 group w-fit relative">
 <input
 type="checkbox"
 checked={checked}
 onChange={onChange}
 className="w-3.5 h-3.5 rounded border-gray-300 text-[#144835] focus:ring-[#144835] focus:ring-2 cursor-pointer transition-all"
 />
 <span className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wide group-hover:text-[#144835] transition-colors">
 {label}
 <TooltipIcon text={tooltip} />
 </span>
 </label>
);

export default function AdminEditStudentPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const schoolId = useSchoolId();
 const router = useRouter();
 
 const [saving, setSaving] = useState(false);
 const studentId = useRouteParam(params, "id");
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function loadStudent() {
 if (!studentId) return;
 try {
 setLoading(true);
 const docRef = doc(db, "schools", schoolId, "students", studentId);
 const snap = await getDoc(docRef);
 if (snap.exists()) {
 const data = snap.data();
 let loadedSiblings = data.siblings || [];
 if (loadedSiblings.length < 5) {
 const diff = 5 - loadedSiblings.length;
 loadedSiblings = [...loadedSiblings, ...Array(diff).fill({ name: "", age: "", gender: "", school: "", class: "" })];
 }
 setFormData(prev => ({
 ...prev,
 ...data,
 siblings: loadedSiblings
 }));
 } else {
 setError("Student not found");
 }
 } catch (err) {
 console.error(err);
 setError("Failed to load student data.");
 } finally {
 setLoading(false);
 }
 }
 loadStudent();
 }, [studentId, schoolId]);

 const [error, setError] = useState<string | null>(null);
 
 // Wizard State
 const [currentStep, setCurrentStep] = useState(1);
 const totalSteps = 4;

 // Form State
 const [formData, setFormData] = useState<Record<string, any>>({
 // Header bits
 hasSibling: "No", enqNo: "", session: "2024-2025",
 
 // Student Profile
 photo: null, registrationNo: "", grade: "", section: "", srnNo: "", formNo: "", studentType: "", username: "", portalPassword: "", studentName: "", gender: "", dob: "", aadharNo: "", house: "", stream: "", email: "", prevAttendance: "", motherTongue: "", onlyChild: false, adoptedChild: "", minority: "", minoritySpecify: "", nationality: "INDIAN", mediumOfInstruction: "ENGLISH", casteCategory: "", optionalSubject: "", offeredSubject: "", penNo: "",

 // Health
 bloodGroup: "", leftVision: "", rightVision: "", weightTerm1: "", heightTerm1: "", weightTerm2: "", heightTerm2: "", disability: "", sportsActivity: "", admissionDate: new Date().toISOString().split('T')[0],

 // Bank
 bankName: "", branchName: "", accountNo: "", ifscCode: "",

 // Family - Father
 fatherName: "", fatherEmail: "", fatherNationality: "INDIAN", fatherOccupation: "", fatherDepartment: "", fatherDesignation: "", fatherOffice: "", fatherOfficeAddress: "", fatherOfficeContact: "", fatherAadhar: "", fatherPan: "", fatherIncome: "", fatherMobile1: "", fatherMobile2: "", fatherReligion: "", fatherCaste: "", fatherMarital: "",
 
 // Family - Mother
 motherName: "", motherEmail: "", motherNationality: "INDIAN", motherOccupation: "", motherDepartment: "", motherDesignation: "", motherOffice: "", motherOfficeAddress: "", motherOfficeContact: "", motherAadhar: "", motherPan: "", motherIncome: "", motherMobile1: "", motherMobile2: "", motherReligion: "", motherCaste: "", motherMarital: "",
 
 // Family - Guardian
 guardianName: "", guardianEmail: "", guardianNationality: "", guardianOccupation: "", guardianDepartment: "", guardianDesignation: "", guardianOffice: "", guardianOfficeAddress: "", guardianOfficeContact: "", guardianAadhar: "", guardianPan: "", guardianIncome: "", guardianMobile1: "", guardianMobile2: "", guardianReligion: "", guardianCaste: "", guardianMarital: "",

 // Permanent Address
 permAddress: "", permMobile: "", permWhatsapp: "", permPlace: "", permArea: "", permLocation: "", permState: "", permCity: "",
 
 // Correspondance Address
 sameAsPerm: false, corrAddress: "", corrMobile: "", corrWhatsapp: "", corrPlace: "", corrArea: "", corrLocation: "", corrState: "", corrCity: "",

 // Siblings (Array of 5)
 siblings: Array(5).fill({ name: "", age: "", gender: "", school: "", class: "" })
 });

 const handleChange = (field: string, value: any) => {
 setFormData(prev => ({ ...prev, [field]: value }));
 };

 const handleSiblingChange = (index: number, field: string, value: string) => {
 const newSiblings = [...formData.siblings];
 newSiblings[index] = { ...newSiblings[index], [field]: value };
 handleChange('siblings', newSiblings);
 };

 const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 handleChange('photo', reader.result);
 };
 reader.readAsDataURL(file);
 }
 };

 // Generate Registration No
 useEffect(() => {
 handleChange('registrationNo', `RN${Math.floor(Math.random() * 10000)}`);
 }, []);

 const [classes, setClasses] = useState<{grade: string, sections: string[]}[]>([]);

 useEffect(() => {
 async function loadClasses() {
 try {
 const snap = await getDocs(query(collection(db, "schools", schoolId, "classes")));
 const map = new Map<string, Set<string>>();
 snap.forEach(doc => {
 const d = doc.data();
 const g = d.grade || d.name;
 if (g) {
 if (!map.has(g)) map.set(g, new Set());
 if (d.section) map.get(g)!.add(d.section);
 }
 });
 const clsList = Array.from(map.entries()).map(([g, s]) => ({ grade: g, sections: Array.from(s) }));
 setClasses(clsList);
 } catch (e) {
 console.error("Failed to load classes", e);
 }
 }
 loadClasses();
 }, [schoolId]);

 const currentSections = useMemo(() => {
 return classes.find(c => c.grade === formData.grade)?.sections || [];
 }, [classes, formData.grade]);

 async function onSave() {
 setError(null);
 if (!formData.studentName || !formData.grade) {
 setError("Please fill all required fields (Student Name, Grade).");
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 try {
 setSaving(true);
 const payload = {
 ...formData,
 username: (formData.username || "").toLowerCase(),
 firstName: formData.studentName.split(' ')[0],
 lastName: formData.studentName.split(' ').slice(1).join(' '),
 classId: formData.grade,
 rollNumber: formData.formNo || formData.registrationNo,
 status: "Active",
 createdAt: new Date().toISOString()
 };
 
 await updateDoc(doc(db, "schools", schoolId, "students", studentId), payload);
 router.push(`/schools/${schoolId}/admin/academic/students`);
 } catch (e: any) {
 setError(e.message || "Unknown error");
 window.scrollTo({ top: 0, behavior: 'smooth' });
 } finally {
 setSaving(false);
 }
 }

 const renderStepIndicator = () => (
 <div className="relative max-w-3xl mx-auto py-2">
 {/* Background Track */}
 <div className="absolute top-6 sm:top-7 left-[12.5%] right-[12.5%] h-1 bg-gray-100 rounded-full z-0"></div>
 {/* Active Track */}
 <div className="absolute top-6 sm:top-7 left-[12.5%] h-1 bg-gradient-to-r from-[#144835] to-emerald-500 rounded-full z-0 transition-all duration-700 ease-in-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 75}%` }}></div>
 
 <div className="flex items-start justify-between relative z-10">
 {[
 { id: 1, label: 'Profile', desc: 'Basic Details', icon: User },
 { id: 2, label: 'Health', desc: 'Physical & Bank', icon: Heart },
 { id: 3, label: 'Family', desc: 'Parents & Address', icon: Home },
 { id: 4, label: 'Docs', desc: 'Other Details', icon: FileText }
 ].map(step => {
 const Icon = step.icon;
 const isActive = currentStep === step.id;
 const isCompleted = currentStep > step.id;
 
 return (
 <div key={step.id} className="flex flex-col items-center group cursor-pointer w-[25%]" onClick={() => isCompleted && setCurrentStep(step.id)}>
 <div className={`w-8 sm:w-10 h-8 sm:h-10 mx-auto rounded-xl flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 bg-white ${
 isCompleted 
 ? 'border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/10' 
 : isActive 
 ? 'border-[#144835] text-[#144835] shadow-lg shadow-[#144835]/10 scale-110 ring-2 ring-[#144835]/10' 
 : 'border-gray-100 text-gray-400 shadow-sm'
 }`}>
 {isCompleted ? <CheckCircle2 size={18} strokeWidth={3} className="animate-in zoom-in duration-300" /> : <Icon size={isActive ? 18 : 16} strokeWidth={isActive ? 2.5 : 2} />}
 </div>
 <div className={`mt-2 flex flex-col items-center text-center transition-all duration-300 ${isActive ? 'translate-y-0.5 opacity-100' : 'opacity-70'}`}>
 <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-[#144835]' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
 {step.label}
 </span>
 <span className={`hidden sm:block text-xs font-bold mt-0.5 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
 {step.desc}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );

 if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-[#144835] border-t-transparent rounded-full animate-spin" /></div>;

 return (
 <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-8 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-2">
 {/* Top Header - Glassmorphism */}
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/80 backdrop-blur-xl p-3 sm:px-4 sm:py-3 rounded-xl border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] mx-auto">
 <div className="flex items-center gap-3">
 <Link href={`/schools/${schoolId}/admin/academic/students`} className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all group">
 <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
 </Link>
 <div>
 <div className="flex items-center gap-2">
 <div className="bg-emerald-100/50 p-1 rounded text-emerald-600 hidden sm:block">
 <GraduationCap size={14} strokeWidth={2.5} />
 </div>
 <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#144835] to-emerald-600 bg-clip-text text-transparent tracking-tight">Edit Student</h1>
 </div>
 <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
 <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">Step {currentStep} of {totalSteps}</span>
 <span className="text-gray-300">•</span>
 <span className="uppercase tracking-wider">{['Student Profile', 'Health & Bank', 'Family & Address', 'Other Details'][currentStep - 1]}</span>
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-extrabold uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
 Back
 </button>
 {currentStep < totalSteps ? (
 <button onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))} className="flex-1 sm:flex-none px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#144835] to-[#1a5c44] text-white text-xs font-extrabold uppercase tracking-wide hover:opacity-90 transition-all shadow-sm shadow-[#144835]/20 flex items-center justify-center gap-1.5">
 Next
 </button>
 ) : (
 <button onClick={onSave} disabled={saving} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-70 text-white px-5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition-all shadow-sm shadow-emerald-500/20">
 <Save size={14} />
 <span>{saving ? "Saving..." : "Save"}</span>
 </button>
 )}
 </div>
 </div>

 {error && (
 <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs font-bold flex items-center gap-2 shadow-sm">
 <div className="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">!</div>
 {error}
 </div>
 )}

 {/* Wizard Progress Indicator */}
 <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#144835] to-emerald-400 opacity-20"></div>
 {renderStepIndicator()}
 </div>

 <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
 
 {/* STEP 1: STUDENT PROFILE */}
 <div className={currentStep === 1 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
 
 {/* Pre-Form Controls */}
 <div className="bg-gradient-to-br from-slate-50 to-gray-50/50 p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
 <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
 <button className="bg-white border border-[#40b8e6] text-[#40b8e6] hover:bg-[#40b8e6] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5">
 <Sparkles size={12} />
 Get Approved List
 </button>
 <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex-1 sm:flex-none">
 <span className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
 Enq. No:
 <TooltipIcon text="Enter the enquiry number of the student if applicable" />
 </span>
 <input type="text" placeholder="ENTER NO." value={formData.enqNo} onChange={e => handleChange('enqNo', e.target.value)} className="w-20 sm:w-24 border-none bg-transparent p-0 text-xs font-bold outline-none focus:ring-0 placeholder:text-gray-300" />
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
 <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex-1 sm:flex-none">
 <span className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
 Sibling:
 <TooltipIcon text="Select Yes if the student has a sibling studying in this school" />
 </span>
 <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="sibling" value="Yes" checked={formData.hasSibling === "Yes"} onChange={e => handleChange('hasSibling', e.target.value)} className="text-[#144835] w-3 h-3 focus:ring-[#144835] transition-all" /> <span className="text-black">Yes</span></label>
 <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="sibling" value="No" checked={formData.hasSibling === "No"} onChange={e => handleChange('hasSibling', e.target.value)} className="text-[#144835] w-3 h-3 focus:ring-[#144835] transition-all" /> <span className="text-black">No</span></label>
 </div>
 <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex-1 sm:flex-none">
 <span className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wide">
 Session:
 <TooltipIcon text="Select the academic session for which the student is enrolling" />
 </span>
 <select value={formData.session} onChange={e => handleChange('session', e.target.value)} className="border-none bg-transparent p-0 text-xs font-bold outline-none focus:ring-0 cursor-pointer pr-5 text-gray-900">
 <option>2024-2025</option>
 <option>2025-2026</option>
 <option>2026-2027</option>
 </select>
 </div>
 </div>
 </div>

 <FormGroup title="Student Profile" icon={User}>
 <div className="col-span-full mb-2">
 <label className="flex flex-col items-center justify-center w-28 h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-500/50 cursor-pointer transition-all group overflow-hidden relative">
 {formData.photo ? (
 <>
 <img src={formData.photo} alt="Student" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
 <span className="text-white text-xs font-bold">Change</span>
 </div>
 </>
 ) : (
 <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-emerald-600 transition-colors">
 <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
 <Upload size={14} strokeWidth={2.5} />
 </div>
 <span className="text-xs font-bold uppercase tracking-wider text-center px-2">Upload<br/>Photo</span>
 </div>
 )}
 <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
 </label>
 </div>
 <Input label="Registration No." value={formData.registrationNo} disabled tooltip="Auto-generated unique registration number for the student" />
 <Select label="Class" required value={formData.grade} onChange={(e: any) => handleChange('grade', e.target.value)} options={classes.map(c => c.grade)} tooltip="Select the class/grade the student is enrolling in" />
 <Select label="Section" value={formData.section} onChange={(e: any) => handleChange('section', e.target.value)} options={currentSections} tooltip="Select the section/division for the class" />
 
 <Input label="SRN NO." value={formData.srnNo} onChange={(e: any) => handleChange('srnNo', e.target.value)} tooltip="Enter the Student Registration Number (State specific)" />
 <Input label="Form No." value={formData.formNo} onChange={(e: any) => handleChange('formNo', e.target.value)} tooltip="Enter the physical admission form number if applicable" />
 <Select label="Student Type" value={formData.studentType} onChange={(e: any) => handleChange('studentType', e.target.value)} options={["Day Scholar", "Boarder"]} tooltip="Select if the student is a day scholar or living in the hostel" />

 <Input label="Stu. Name" required value={formData.studentName} onChange={(e: any) => handleChange('studentName', e.target.value)} tooltip="Enter the full name of the student as per official documents" />
 <Select label="Gender" value={formData.gender} onChange={(e: any) => handleChange('gender', e.target.value)} options={["Male", "Female", "Other"]} tooltip="Select the student's gender" />
 <Input label="Date of Birth" type="date" value={formData.dob} onChange={(e: any) => handleChange('dob', e.target.value)} tooltip="Select the student's date of birth" />

 <Input label="Aadhar No." value={formData.aadharNo} onChange={(e: any) => handleChange('aadharNo', e.target.value)} tooltip="Enter the 12-digit Aadhar number of the student" />
 <Select label="House" value={formData.house} onChange={(e: any) => handleChange('house', e.target.value)} options={["Red", "Blue", "Green", "Yellow"]} tooltip="Select the assigned school house for activities" />
 <Select label="Stream" value={formData.stream} onChange={(e: any) => handleChange('stream', e.target.value)} options={["Science", "Commerce", "Arts", "General"]} tooltip="Select the academic stream (for higher secondary classes)" />

 <Input label="Email" type="email" value={formData.email} onChange={(e: any) => handleChange('email', e.target.value)} tooltip="Enter the student's or primary parent's email address" />
 <Input label="Previous Yr attendance" value={formData.prevAttendance} onChange={(e: any) => handleChange('prevAttendance', e.target.value)} tooltip="Enter the attendance percentage from the previous academic year" />
 <Input label="Mother Tongue" value={formData.motherTongue} onChange={(e: any) => handleChange('motherTongue', e.target.value)} tooltip="Enter the student's native language" />
 <Checkbox label="Only Child" checked={formData.onlyChild} onChange={(e: any) => handleChange('onlyChild', e.target.checked)} tooltip="Check if the student is the only child of the parents" />

 <Select label="Adopted child" value={formData.adoptedChild} onChange={(e: any) => handleChange('adoptedChild', e.target.value)} options={["Yes", "No"]} tooltip="Select Yes if the student is legally adopted" />
 <Select label="Belong to minority" value={formData.minority} onChange={(e: any) => handleChange('minority', e.target.value)} options={["Yes", "No"]} tooltip="Select Yes if the student belongs to a minority community" />
 <Input label="Specify" value={formData.minoritySpecify} onChange={(e: any) => handleChange('minoritySpecify', e.target.value)} disabled={formData.minority !== "Yes"} tooltip="Specify the minority community if 'Yes' is selected above" />

 <Input label="Nationality" value={formData.nationality} onChange={(e: any) => handleChange('nationality', e.target.value)} tooltip="Enter the student's nationality" />
 <Input label="Medium of Instruction" value={formData.mediumOfInstruction} onChange={(e: any) => handleChange('mediumOfInstruction', e.target.value)} tooltip="Enter the medium of instruction in the previous school" />
 <Select label="Caste category" value={formData.casteCategory} onChange={(e: any) => handleChange('casteCategory', e.target.value)} options={["General", "OBC", "SC", "ST", "Other"]} tooltip="Select the social caste category" />

 <Select label="Optional Subject" value={formData.optionalSubject} onChange={(e: any) => handleChange('optionalSubject', e.target.value)} options={["Computer Science", "Physical Education", "Hindi"]} tooltip="Select an optional subject if applicable" />
 <Select label="Offered Subject" value={formData.offeredSubject} onChange={(e: any) => handleChange('offeredSubject', e.target.value)} options={["Math", "Biology"]} tooltip="Select a core offered subject if applicable" />
 <Input label="Pen No" value={formData.penNo} onChange={(e: any) => handleChange('penNo', e.target.value)} tooltip="Enter the Permanent Education Number (PEN) if applicable" />
 </FormGroup>

 {/* Prominent Credentials Card */}
 <div className="mt-4 p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col md:grid md:grid-cols-5 gap-4">
    <div className="col-span-full border-b border-amber-200/50 pb-2.5 mb-1 flex items-center gap-2">
      <span className="text-lg">🔒</span>
      <div>
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Portal Access Credentials</h3>
        <p className="text-xs text-amber-600 font-bold uppercase mt-0.5">Critical information required for student/parent dashboard login</p>
      </div>
    </div>
    <div className="col-span-2">
      <Input label="Portal User ID / Username" value={formData.username || ""} onChange={(e: any) => handleChange('username', e.target.value)} tooltip="Defaults to the student's Registration/Admission Number." required />
    </div>
    <div className="col-span-2">
      <Input label="Portal Login Password" value={formData.portalPassword || ""} onChange={(e: any) => handleChange('portalPassword', e.target.value)} tooltip="Portal access password." required />
    </div>
    <div className="col-span-1 flex items-end">
      <button 
        type="button" 
        onClick={() => handleChange('username', formData.registrationNo || formData.admissionNo || formData.rollNumber)}
        className="w-full h-8 rounded-lg border border-amber-300 hover:bg-amber-100/50 text-xs font-bold uppercase text-amber-800 transition-all tracking-wide shadow-sm"
      >
        Reset to Roll No
      </button>
    </div>
  </div>
  </div>

 {/* STEP 2: HEALTH & BANK */}
 <div className={currentStep === 2 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
 <FormGroup title="Health Status" icon={Heart}>
 <Select label="Blood Group" value={formData.bloodGroup} onChange={(e: any) => handleChange('bloodGroup', e.target.value)} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} tooltip="Select the student's blood group" />
 <Input label="Left Vision" value={formData.leftVision} onChange={(e: any) => handleChange('leftVision', e.target.value)} tooltip="Enter the left eye vision metric (e.g., 6/6)" />
 <Input label="Right Vision" value={formData.rightVision} onChange={(e: any) => handleChange('rightVision', e.target.value)} tooltip="Enter the right eye vision metric (e.g., 6/6)" />

 <Input label="Weight (I TERM)" placeholder="WEIGHT I TERM" value={formData.weightTerm1} onChange={(e: any) => handleChange('weightTerm1', e.target.value)} tooltip="Enter the student's weight recorded in the 1st Term (in kg)" />
 <Input label="Height (I TERM)" placeholder="HEIGHT I TERM" value={formData.heightTerm1} onChange={(e: any) => handleChange('heightTerm1', e.target.value)} tooltip="Enter the student's height recorded in the 1st Term (in cm)" />
 <Input label="Weight (II TERM)" placeholder="WEIGHT II TERM" value={formData.weightTerm2} onChange={(e: any) => handleChange('weightTerm2', e.target.value)} tooltip="Enter the student's weight recorded in the 2nd Term (in kg)" />
 <div className="col-start-1 md:col-start-1 lg:col-start-1"></div>
 <Input label="Height (II TERM)" placeholder="HEIGHT II TERM" value={formData.heightTerm2} onChange={(e: any) => handleChange('heightTerm2', e.target.value)} tooltip="Enter the student's height recorded in the 2nd Term (in cm)" />

 <Select label="Type of Disability" value={formData.disability} onChange={(e: any) => handleChange('disability', e.target.value)} options={["None", "Visual", "Hearing", "Physical", "Other"]} tooltip="Select any physical or learning disability if applicable" />
 <Select label="Sports Activity" value={formData.sportsActivity} onChange={(e: any) => handleChange('sportsActivity', e.target.value)} options={["Cricket", "Football", "Basketball", "Tennis"]} tooltip="Select the preferred sports activity for the student" />
 <Input label="Admission Date" type="date" value={formData.admissionDate} onChange={(e: any) => handleChange('admissionDate', e.target.value)} tooltip="Select the official date of admission to the school" />
 </FormGroup>

 <FormGroup title="Bank Details" icon={Building}>
 <Input label="Bank Name" value={formData.bankName} onChange={(e: any) => handleChange('bankName', e.target.value)} tooltip="Enter the name of the bank where the student/parent holds an account" />
 <Input label="Branch Name" value={formData.branchName} onChange={(e: any) => handleChange('branchName', e.target.value)} tooltip="Enter the specific branch name of the bank" />
 <Input label="A/C No." value={formData.accountNo} onChange={(e: any) => handleChange('accountNo', e.target.value)} tooltip="Enter the bank account number" />
 <Input label="IFSC Code" value={formData.ifscCode} onChange={(e: any) => handleChange('ifscCode', e.target.value)} tooltip="Enter the IFSC code of the bank branch" />
 </FormGroup>
 </div>

 {/* STEP 3: FAMILY & ADDRESS */}
 <div className={currentStep === 3 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
 <section className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50/80 to-white flex items-center gap-2">
 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-gray-100 text-blue-600 flex items-center justify-center shrink-0">
 <Users size={14} strokeWidth={2.5} />
 </div>
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">Family Profile</h2>
 </div>
 <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 bg-white">
 {/* FATHER */}
 <div className="space-y-4 lg:pr-4">
 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 py-1.5 px-3 rounded-lg text-center border border-gray-100">Father Profile</h3>
 <Input label="Father Name" value={formData.fatherName} onChange={(e: any) => handleChange('fatherName', e.target.value)} tooltip="Enter the father's full name" />
 <Input label="Father Email" value={formData.fatherEmail} onChange={(e: any) => handleChange('fatherEmail', e.target.value)} tooltip="Enter the father's email address" />
 <Input label="Nationality" value={formData.fatherNationality} onChange={(e: any) => handleChange('fatherNationality', e.target.value)} tooltip="Enter the father's nationality" />
 <Select label="Occupation" options={["Service", "Business", "Professional", "Other"]} value={formData.fatherOccupation} onChange={(e: any) => handleChange('fatherOccupation', e.target.value)} tooltip="Select the father's main occupation" />
 <Select label="Department" options={["Govt", "Private", "Self", "Other"]} value={formData.fatherDepartment} onChange={(e: any) => handleChange('fatherDepartment', e.target.value)} tooltip="Select the sector of employment" />
 <Select label="Designation" options={["Manager", "Director", "Executive", "Other"]} value={formData.fatherDesignation} onChange={(e: any) => handleChange('fatherDesignation', e.target.value)} tooltip="Select the job designation or title" />
 <Input label="Name Of Office" value={formData.fatherOffice} onChange={(e: any) => handleChange('fatherOffice', e.target.value)} tooltip="Enter the name of the company or office" />
 <Input label="Office Address" value={formData.fatherOfficeAddress} onChange={(e: any) => handleChange('fatherOfficeAddress', e.target.value)} tooltip="Enter the address of the workplace" />
 <Input label="Office Contact No." value={formData.fatherOfficeContact} onChange={(e: any) => handleChange('fatherOfficeContact', e.target.value)} tooltip="Enter the office phone number" />
 <Input label="Aadhar No" value={formData.fatherAadhar} onChange={(e: any) => handleChange('fatherAadhar', e.target.value)} tooltip="Enter the father's 12-digit Aadhar number" />
 <Input label="Father PAN No" value={formData.fatherPan} onChange={(e: any) => handleChange('fatherPan', e.target.value)} tooltip="Enter the father's PAN card number" />
 <Input label="Annual Income" value={formData.fatherIncome} onChange={(e: any) => handleChange('fatherIncome', e.target.value)} tooltip="Enter the approximate annual income" />
 <Input label="Father's Mobile" value={formData.fatherMobile1} onChange={(e: any) => handleChange('fatherMobile1', e.target.value)} tooltip="Enter the primary mobile number" />
 <Input label="Father's Mobile2" value={formData.fatherMobile2} onChange={(e: any) => handleChange('fatherMobile2', e.target.value)} tooltip="Enter an alternate mobile number if any" />
 <Input label="Father's Religion" value={formData.fatherReligion} onChange={(e: any) => handleChange('fatherReligion', e.target.value)} tooltip="Enter the father's religion" />
 <Input label="Father's Caste" value={formData.fatherCaste} onChange={(e: any) => handleChange('fatherCaste', e.target.value)} tooltip="Enter the father's caste" />
 <Input label="Marital Status" value={formData.fatherMarital} onChange={(e: any) => handleChange('fatherMarital', e.target.value)} tooltip="Enter marital status (e.g., Married, Divorced)" />
 </div>

 {/* MOTHER */}
 <div className="space-y-4 lg:px-4 pt-4 lg:pt-0">
 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 py-1.5 px-3 rounded-lg text-center border border-gray-100">Mother Profile</h3>
 <Input label="Mother Name" value={formData.motherName} onChange={(e: any) => handleChange('motherName', e.target.value)} tooltip="Enter the mother's full name" />
 <Input label="Mother Email" value={formData.motherEmail} onChange={(e: any) => handleChange('motherEmail', e.target.value)} tooltip="Enter the mother's email address" />
 <Input label="Nationality" value={formData.motherNationality} onChange={(e: any) => handleChange('motherNationality', e.target.value)} tooltip="Enter the mother's nationality" />
 <Select label="Occupation" options={["Homemaker", "Service", "Business", "Other"]} value={formData.motherOccupation} onChange={(e: any) => handleChange('motherOccupation', e.target.value)} tooltip="Select the mother's main occupation" />
 <Select label="Department" options={["Govt", "Private", "Self", "Other"]} value={formData.motherDepartment} onChange={(e: any) => handleChange('motherDepartment', e.target.value)} tooltip="Select the sector of employment" />
 <Select label="Designation" options={["Manager", "Director", "Executive", "Other"]} value={formData.motherDesignation} onChange={(e: any) => handleChange('motherDesignation', e.target.value)} tooltip="Select the job designation or title" />
 <Input label="Name Of Office" value={formData.motherOffice} onChange={(e: any) => handleChange('motherOffice', e.target.value)} tooltip="Enter the name of the company or office" />
 <Input label="Office Address" value={formData.motherOfficeAddress} onChange={(e: any) => handleChange('motherOfficeAddress', e.target.value)} tooltip="Enter the address of the workplace" />
 <Input label="Office Contact No." value={formData.motherOfficeContact} onChange={(e: any) => handleChange('motherOfficeContact', e.target.value)} tooltip="Enter the office phone number" />
 <Input label="Aadhar No" value={formData.motherAadhar} onChange={(e: any) => handleChange('motherAadhar', e.target.value)} tooltip="Enter the mother's 12-digit Aadhar number" />
 <Input label="Mother PAN No" value={formData.motherPan} onChange={(e: any) => handleChange('motherPan', e.target.value)} tooltip="Enter the mother's PAN card number" />
 <Input label="Annual Income" value={formData.motherIncome} onChange={(e: any) => handleChange('motherIncome', e.target.value)} tooltip="Enter the approximate annual income" />
 <Input label="Mother's Mobile" value={formData.motherMobile1} onChange={(e: any) => handleChange('motherMobile1', e.target.value)} tooltip="Enter the primary mobile number" />
 <Input label="Mother's Mobile2" value={formData.motherMobile2} onChange={(e: any) => handleChange('motherMobile2', e.target.value)} tooltip="Enter an alternate mobile number if any" />
 <Input label="Mother's Religion" value={formData.motherReligion} onChange={(e: any) => handleChange('motherReligion', e.target.value)} tooltip="Enter the mother's religion" />
 <Input label="Mother's Caste" value={formData.motherCaste} onChange={(e: any) => handleChange('motherCaste', e.target.value)} tooltip="Enter the mother's caste" />
 <Input label="Marital Status" value={formData.motherMarital} onChange={(e: any) => handleChange('motherMarital', e.target.value)} tooltip="Enter marital status (e.g., Married, Divorced)" />
 </div>

 {/* GUARDIAN */}
 <div className="space-y-4 lg:pl-4 pt-4 lg:pt-0">
 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 py-1.5 px-3 rounded-lg text-center border border-gray-100">Guardian Profile</h3>
 <Input label="Guardian Name" value={formData.guardianName} onChange={(e: any) => handleChange('guardianName', e.target.value)} tooltip="Enter the legal guardian's full name (if applicable)" />
 <Input label="Guardian Email" value={formData.guardianEmail} onChange={(e: any) => handleChange('guardianEmail', e.target.value)} tooltip="Enter the guardian's email address" />
 <Input label="Nationality" value={formData.guardianNationality} onChange={(e: any) => handleChange('guardianNationality', e.target.value)} tooltip="Enter the guardian's nationality" />
 <Select label="Occupation" options={["Service", "Business", "Professional", "Other"]} value={formData.guardianOccupation} onChange={(e: any) => handleChange('guardianOccupation', e.target.value)} tooltip="Select the guardian's main occupation" />
 <Select label="Department" options={["Govt", "Private", "Self", "Other"]} value={formData.guardianDepartment} onChange={(e: any) => handleChange('guardianDepartment', e.target.value)} tooltip="Select the sector of employment" />
 <Select label="Designation" options={["Manager", "Director", "Executive", "Other"]} value={formData.guardianDesignation} onChange={(e: any) => handleChange('guardianDesignation', e.target.value)} tooltip="Select the job designation or title" />
 <Input label="Name Of Office" value={formData.guardianOffice} onChange={(e: any) => handleChange('guardianOffice', e.target.value)} tooltip="Enter the name of the company or office" />
 <Input label="Office Address" value={formData.guardianOfficeAddress} onChange={(e: any) => handleChange('guardianOfficeAddress', e.target.value)} tooltip="Enter the address of the workplace" />
 <Input label="Office Contact No." value={formData.guardianOfficeContact} onChange={(e: any) => handleChange('guardianOfficeContact', e.target.value)} tooltip="Enter the office phone number" />
 <Input label="Aadhar No" value={formData.guardianAadhar} onChange={(e: any) => handleChange('guardianAadhar', e.target.value)} tooltip="Enter the guardian's 12-digit Aadhar number" />
 <Input label="Guardian PAN No" value={formData.guardianPan} onChange={(e: any) => handleChange('guardianPan', e.target.value)} tooltip="Enter the guardian's PAN card number" />
 <Input label="Annual Income" value={formData.guardianIncome} onChange={(e: any) => handleChange('guardianIncome', e.target.value)} tooltip="Enter the approximate annual income" />
 <Input label="Guardian's Mobile" value={formData.guardianMobile1} onChange={(e: any) => handleChange('guardianMobile1', e.target.value)} tooltip="Enter the primary mobile number" />
 <Input label="Guardian's Mobile2" value={formData.guardianMobile2} onChange={(e: any) => handleChange('guardianMobile2', e.target.value)} tooltip="Enter an alternate mobile number if any" />
 <Input label="Guardian's Religion" value={formData.guardianReligion} onChange={(e: any) => handleChange('guardianReligion', e.target.value)} tooltip="Enter the guardian's religion" />
 <Input label="Guardian's Caste" value={formData.guardianCaste} onChange={(e: any) => handleChange('guardianCaste', e.target.value)} tooltip="Enter the guardian's caste" />
 <Input label="Marital Status" value={formData.guardianMarital} onChange={(e: any) => handleChange('guardianMarital', e.target.value)} tooltip="Enter marital status (e.g., Married, Divorced)" />
 </div>
 </div>
 </section>

 <FormGroup title="Permanent Address" icon={Home}>
 <div className="col-span-full grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2"><Input label="Address" value={formData.permAddress} onChange={(e: any) => handleChange('permAddress', e.target.value)} tooltip="Enter the complete permanent residential address (House No, Street)" /></div>
 <div className="grid grid-cols-2 gap-3">
 <Input label="Mobile No." placeholder="SMS NO." value={formData.permMobile} onChange={(e: any) => handleChange('permMobile', e.target.value)} tooltip="Enter the primary mobile number for official SMS alerts" />
 <Input label="Whatsapp" placeholder="WHATSAPP NO" value={formData.permWhatsapp} onChange={(e: any) => handleChange('permWhatsapp', e.target.value)} tooltip="Enter the mobile number available on WhatsApp for updates" />
 </div>
 </div>
 <Select label="Place" options={["Urban", "Rural"]} value={formData.permPlace} onChange={(e: any) => handleChange('permPlace', e.target.value)} tooltip="Select whether the address is in an Urban or Rural area" />
 <Select label="Area" options={["Area 1", "Area 2"]} value={formData.permArea} onChange={(e: any) => handleChange('permArea', e.target.value)} tooltip="Select the specific area or zone" />
 <Select label="Location" options={["Loc 1", "Loc 2"]} value={formData.permLocation} onChange={(e: any) => handleChange('permLocation', e.target.value)} tooltip="Select the specific locality" />
 <div className="col-start-1 lg:col-start-1"><Select label="State" options={["Karnataka", "Maharashtra", "AP"]} value={formData.permState} onChange={(e: any) => handleChange('permState', e.target.value)} tooltip="Select the state of residence" /></div>
 <Select label="City" options={["Kalaburagi", "Hyderabad", "Pune"]} value={formData.permCity} onChange={(e: any) => handleChange('permCity', e.target.value)} tooltip="Select the city of residence" />
 </FormGroup>

 <FormGroup title="Correspondance Address" icon={Home}>
 <div className="col-span-full">
 <Checkbox label="Same As Above" checked={formData.sameAsPerm} onChange={(e: any) => handleChange('sameAsPerm', e.target.checked)} tooltip="Check this if the correspondence address is exactly the same as the permanent address" />
 </div>
 <div className="col-span-full grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2"><Input label="Address" disabled={formData.sameAsPerm} value={formData.sameAsPerm ? formData.permAddress : formData.corrAddress} onChange={(e: any) => handleChange('corrAddress', e.target.value)} tooltip="Enter the current correspondence/mailing address" /></div>
 <div className="grid grid-cols-2 gap-3">
 <Input label="Mobile No." disabled={formData.sameAsPerm} value={formData.sameAsPerm ? formData.permMobile : formData.corrMobile} onChange={(e: any) => handleChange('corrMobile', e.target.value)} tooltip="Enter the correspondence mobile number" />
 <Input label="Whatsapp" disabled={formData.sameAsPerm} value={formData.sameAsPerm ? formData.permWhatsapp : formData.corrWhatsapp} onChange={(e: any) => handleChange('corrWhatsapp', e.target.value)} tooltip="Enter the correspondence WhatsApp number" />
 </div>
 </div>
 <Select label="Place" disabled={formData.sameAsPerm} options={["Urban", "Rural"]} value={formData.sameAsPerm ? formData.permPlace : formData.corrPlace} onChange={(e: any) => handleChange('corrPlace', e.target.value)} tooltip="Select whether the address is in an Urban or Rural area" />
 <Select label="Area" disabled={formData.sameAsPerm} options={["Area 1", "Area 2"]} value={formData.sameAsPerm ? formData.permArea : formData.corrArea} onChange={(e: any) => handleChange('corrArea', e.target.value)} tooltip="Select the specific area or zone" />
 <Select label="Location" disabled={formData.sameAsPerm} options={["Loc 1", "Loc 2"]} value={formData.sameAsPerm ? formData.permLocation : formData.corrLocation} onChange={(e: any) => handleChange('corrLocation', e.target.value)} tooltip="Select the specific locality" />
 <div className="col-start-1 lg:col-start-1"><Select label="State" disabled={formData.sameAsPerm} options={["Karnataka", "Maharashtra", "AP"]} value={formData.sameAsPerm ? formData.permState : formData.corrState} onChange={(e: any) => handleChange('corrState', e.target.value)} tooltip="Select the state" /></div>
 <Select label="City" disabled={formData.sameAsPerm} options={["Kalaburagi", "Hyderabad", "Pune"]} value={formData.sameAsPerm ? formData.permCity : formData.corrCity} onChange={(e: any) => handleChange('corrCity', e.target.value)} tooltip="Select the city" />
 </FormGroup>
 </div>

 {/* STEP 4: OTHER DETAILS */}
 <div className={currentStep === 4 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
 <section className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white flex items-center gap-2">
 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-gray-100 text-amber-600 flex items-center justify-center shrink-0">
 <BookOpen size={14} strokeWidth={2.5} />
 </div>
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
 Parent Qualification
 <TooltipIcon text="Enter the highest educational qualifications of the parents and guardian" />
 </h2>
 </div>
 <div className="p-4 overflow-x-auto bg-white">
 <table className="w-full text-left min-w-[800px]">
 <thead>
 <tr>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-l-lg w-[20%]">Qualification</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[20%]">Specialization</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[25%]">Name Of Institute</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[15%]">State</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-r-lg w-[20%]">City</th>
 </tr>
 </thead>
 <tbody>
 <tr><td colSpan={5} className="py-2 text-xs font-bold text-[#144835] uppercase tracking-wider">Qualification Of Father :</td></tr>
 {['Highest School Qualification', 'Graduate', 'Post-Graduate', 'Doctorate', 'Other'].map(q => (
 <tr key={`f-${q}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
 <td className="py-1.5 px-3 text-xs font-semibold text-gray-700">{q}</td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 </tr>
 ))}

 <tr><td colSpan={5} className="py-2 text-xs font-bold text-[#144835] uppercase tracking-wider border-t border-gray-100 mt-1">Qualification Of Mother :</td></tr>
 {['Highest School Qualification', 'Graduate', 'Post-Graduate', 'Doctorate', 'Other'].map(q => (
 <tr key={`m-${q}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
 <td className="py-1.5 px-3 text-xs font-semibold text-gray-700">{q}</td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 </tr>
 ))}

 <tr><td colSpan={5} className="py-2 text-xs font-bold text-[#144835] uppercase tracking-wider border-t border-gray-100 mt-1">Qualification Of Guardian :</td></tr>
 {['Highest School Qualification', 'Graduate', 'Post-Graduate', 'Doctorate', 'Other'].map(q => (
 <tr key={`g-${q}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
 <td className="py-1.5 px-3 text-xs font-semibold text-gray-700">{q}</td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><input className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 <td className="py-1.5 px-3"><select className="w-full h-7 rounded-md border border-gray-200 px-2 text-xs outline-none focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--Select--</option></select></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

 <section className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-pink-50/80 to-white flex items-center gap-2">
 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-gray-100 text-pink-600 flex items-center justify-center shrink-0">
 <Users size={14} strokeWidth={2.5} />
 </div>
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
 Sibling Information
 <TooltipIcon text="Provide details of up to 5 siblings (brothers/sisters) of the student" />
 </h2>
 </div>
 <div className="p-4 overflow-x-auto bg-white">
 <table className="w-full text-left min-w-[800px]">
 <thead>
 <tr>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-l-lg w-[25%] text-center">Name</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[15%] text-center">Age</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[20%] text-center">Gender</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 w-[25%] text-center">Current School</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 rounded-r-lg w-[15%] text-center">Current Class</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {formData.siblings.map((sib: any, i: number) => (
 <tr key={i} className="hover:bg-gray-50/50 transition-colors">
 <td className="py-2 px-2"><input placeholder="NAME" value={sib.name} onChange={(e) => handleSiblingChange(i, 'name', e.target.value)} className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs uppercase placeholder:text-gray-300 font-bold outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-2 px-2"><input placeholder="AGE" value={sib.age} onChange={(e) => handleSiblingChange(i, 'age', e.target.value)} className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs uppercase placeholder:text-gray-300 font-bold outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all text-center" /></td>
 <td className="py-2 px-2"><input placeholder="GENDER" value={sib.gender} onChange={(e) => handleSiblingChange(i, 'gender', e.target.value)} className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs uppercase placeholder:text-gray-300 font-bold outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all text-center" /></td>
 <td className="py-2 px-2"><input placeholder="SCHOOL" value={sib.school} onChange={(e) => handleSiblingChange(i, 'school', e.target.value)} className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs uppercase placeholder:text-gray-300 font-bold outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-2 px-2"><input placeholder="CLASS" value={sib.class} onChange={(e) => handleSiblingChange(i, 'class', e.target.value)} className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs uppercase placeholder:text-gray-300 font-bold outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all text-center" /></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

 <section className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden flex flex-col mb-4 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
 <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-teal-50/80 to-white flex items-center gap-2">
 <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-gray-100 text-teal-600 flex items-center justify-center shrink-0">
 <FileText size={14} strokeWidth={2.5} />
 </div>
 <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">Other Details</h2>
 </div>
 <div className="p-4 overflow-x-auto space-y-6 bg-white">
 <div>
 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-50 py-1.5 px-3 rounded-lg mb-3 border border-gray-100 flex items-center gap-2 w-fit">
 Submissive Documents:
 <TooltipIcon text="Mark the status of documents submitted by the student during admission" />
 </h3>
 <table className="w-full text-left min-w-[800px]">
 <thead>
 <tr className="border-b border-gray-200">
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase w-12">SR</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase">CERTIFICATES</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase text-center">COLLECTED</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase">REMARKS</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {[
 "Admission Form", "School Leaving Certificate(TC)", "Bonafide Certificate", "Birth Certificate", "Caste Certificate", "All Documents", "Ration Card", "Student Adhar Certificate", "Father Adhar Certificate", "Mother Adhar Certificate"
 ].map((doc, i) => (
 <tr key={i} className="hover:bg-gray-50/50 transition-colors">
 <td className="py-2 px-3 text-xs font-bold text-gray-500">{i + 1}</td>
 <td className="py-2 px-3 text-xs font-bold text-gray-700">{doc}</td>
 <td className="py-2 px-3">
 <div className="flex items-center justify-center gap-4">
 <label className="flex items-center gap-1 cursor-pointer text-xs font-extrabold text-gray-600 uppercase group"><input type="radio" name={`doc-${i}`} className="text-[#144835] focus:ring-[#144835] w-3 h-3 transition-all" /> <span className="group-hover:text-[#144835]">YES</span></label>
 <label className="flex items-center gap-1 cursor-pointer text-xs font-extrabold text-gray-600 uppercase group"><input type="radio" name={`doc-${i}`} className="text-[#144835] focus:ring-[#144835] w-3 h-3 transition-all" defaultChecked /> <span className="group-hover:text-[#144835]">NO</span></label>
 <label className="flex items-center gap-1 cursor-pointer text-xs font-extrabold text-gray-600 uppercase group"><input type="radio" name={`doc-${i}`} className="text-[#144835] focus:ring-[#144835] w-3 h-3 transition-all" /> <span className="group-hover:text-[#144835]">N/A</span></label>
 <label className="flex items-center gap-1 cursor-pointer text-xs font-extrabold text-gray-600 uppercase group"><input type="radio" name={`doc-${i}`} className="text-[#144835] focus:ring-[#144835] w-3 h-3 transition-all" /> <span className="group-hover:text-[#144835]">PARTIAL</span></label>
 </div>
 </td>
 <td className="py-2 px-3"><input className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div>
 <h3 className="text-xs font-bold text-gray-800 text-center mb-3 flex items-center justify-center gap-2">
 Previous Schooling (most recent school first)
 <TooltipIcon text="Enter details of up to 3 previous schools attended by the student" />
 </h3>
 <table className="w-full text-left min-w-[800px]">
 <thead>
 <tr>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase w-10 bg-gray-50 rounded-l-lg">Sr</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase bg-gray-50">School Name & Address</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase text-center bg-gray-50">Class</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase text-center bg-gray-50">Session</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase text-center bg-gray-50">Curriculum</th>
 <th className="py-2 px-3 text-xs font-bold text-gray-500 uppercase bg-gray-50 rounded-r-lg">Subjects</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100">
 {[1, 2, 3].map((num) => (
 <tr key={num} className="hover:bg-gray-50/50 transition-colors">
 <td className="py-2 px-3 text-xs font-bold text-gray-500">{num}.</td>
 <td className="py-2 px-3"><input className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-2 px-3"><select className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--</option></select></td>
 <td className="py-2 px-3"><input className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 <td className="py-2 px-3"><select className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all"><option>--</option></select></td>
 <td className="py-2 px-3"><input className="w-full h-8 rounded-md border border-gray-200 bg-gray-50/50 px-2 text-xs outline-none focus:bg-white focus:border-[#144835] focus:ring-2 focus:ring-[#144835]/10 transition-all" /></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm relative">
 <div className="absolute top-2 right-3">
 <TooltipIcon text="Configure transport and bus route details if the student requires school transport" />
 </div>
 <Select label="Transport :" options={["NO", "YES"]} value="NO" onChange={()=>{}} tooltip="Select YES if school transport is required" />
 <Select label="Bus No.:" options={["--"]} value="--" onChange={()=>{}} tooltip="Assign a specific school bus number" />
 <Input label="Driver Name :" disabled value="" tooltip="Driver name (auto-filled based on Bus No)" />
 <Input label="Mobile :" disabled value="" tooltip="Driver mobile number (auto-filled based on Bus No)" />

 <Select label="Route :" options={["No Transport"]} value="No Transport" onChange={()=>{}} tooltip="Select the designated bus route" />
 <Select label="Stoppage :" options={["--"]} value="--" onChange={()=>{}} tooltip="Select the specific bus stop/pickup point" />
 <Input label="Fee :" disabled value="0" tooltip="Monthly transport fee (auto-calculated)" />
 <Input label="Pick :" disabled value="0" tooltip="Scheduled pickup time" />

 <Input label="Drop :" disabled value="0" tooltip="Scheduled drop-off time" />
 <Select label="Fee Category :" options={["-Select-"]} value="-Select-" onChange={()=>{}} tooltip="Select the transport fee category/slab" />
 <div className="md:col-start-4"><Select label="Fee Type" options={["MONTHLY"]} value="MONTHLY" onChange={()=>{}} tooltip="Select the payment frequency for transport" /></div>
 </div>
 </div>
 </section>
 </div>

 {/* Wizard Footer Navigation */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100 bg-white p-4 sm:p-5 rounded-xl shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
 <button 
 type="button" 
 onClick={() => {
 setCurrentStep(prev => Math.max(1, prev - 1));
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 disabled={currentStep === 1}
 className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-extrabold uppercase tracking-wide hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
 >
 Previous Step
 </button>
 
 {currentStep < totalSteps ? (
 <button 
 type="button" 
 onClick={() => {
 setCurrentStep(prev => Math.min(totalSteps, prev + 1));
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-gradient-to-r from-[#144835] to-[#1a5c44] text-white text-xs font-extrabold uppercase tracking-wide hover:opacity-90 transition-all shadow-md shadow-[#144835]/20"
 >
 Next Step
 </button>
 ) : (
 <button 
 type="button" 
 onClick={onSave}
 disabled={saving}
 className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-70 text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
 >
 <Save size={16} />
 <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
 </button>
 )}
 </div>

 </form>
 </div>
 );
}
