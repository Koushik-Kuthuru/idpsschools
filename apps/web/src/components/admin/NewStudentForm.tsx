"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const SafeLink = Link as any;
import { useSchoolId } from "@/hooks/useSchoolId";
import { ArrowLeft, Save, User, Heart, Building, Users, Home, BookOpen, HelpCircle, Upload, CheckCircle2 } from "lucide-react";


import { provisionPortalUser } from "@/lib/auth/provision-client";
import { studentLoginEmail } from "@/lib/auth/roles";
import { buildPath, insertData, fetchMany, buildQuery, patchData, db, auth } from "@/lib/db-client";


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

type NewStudentFormProps = {
  listHref?: string;
  allowedClassKeys?: string[];
};

export default function NewStudentForm({ listHref, allowedClassKeys }: NewStudentFormProps = {}) {
    const schoolId = useSchoolId();
  const router = useRouter();
  const studentsListHref = listHref ?? `/schools/${schoolId}/admin/academic/students`;
  const restrictClasses = Boolean(allowedClassKeys?.length);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionInfo, setProvisionInfo] = useState<string | null>(null);
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({
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

    // Siblings
    siblings: Array(5).fill({ name: "", age: "", gender: "", school: "", class: "" })
  });

  useEffect(() => {
    const regNo = `RN${Math.floor(100000 + Math.random() * 900000)}`;
    const defaultPwd = `IDPS${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({
      ...prev,
      registrationNo: regNo,
      username: regNo,
      portalPassword: defaultPwd
    }));
  }, []);

  const [classes, setClasses] = useState<{grade: string, sections: string[]}[]>([]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const snap = await fetchMany(buildQuery(buildPath(db, "schools", schoolId, "classes")));
        const map = new Map<string, Set<string>>();
        snap.forEach((buildPath: any) => {
          const d = buildPath.data();
          const g = d.grade || d.name;
          if (g) {
            if (!map.has(g)) map.set(g, new Set());
            if (d.section) map.get(g)!.add(d.section);
          }
        });
        let clsList = Array.from(map.entries()).map(([g, s]) => ({ grade: g, sections: Array.from(s) }));
        if (restrictClasses && allowedClassKeys?.length) {
          const allowed = new Set(allowedClassKeys);
          clsList = clsList
            .map((c) => ({
              grade: c.grade,
              sections: c.sections.filter((sec) => allowed.has(`${c.grade}__${String(sec).toUpperCase()}`)),
            }))
            .filter((c) => c.sections.length > 0);
        }
        setClasses(clsList);
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    }
    loadClasses();
  }, [schoolId, restrictClasses, allowedClassKeys]);

  const currentSections = useMemo(() => {
    return classes.find(c => c.grade === formData.grade)?.sections || [];
  }, [classes, formData.grade]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSiblingChange = (index: number, key: string, value: any) => {
    const updated = [...formData.siblings];
    updated[index] = { ...updated[index], [key]: value };
    handleChange('siblings', updated);
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

  async function onSave() {
    setError(null);
    setProvisionInfo(null);
    if (!formData.studentName || !formData.grade) {
      setError("Please fill all required fields (Student Name, Grade).");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (restrictClasses && allowedClassKeys?.length) {
      const selectedKey = `${formData.grade}__${String(formData.section || "").toUpperCase()}`;
      if (!allowedClassKeys.includes(selectedKey)) {
        setError("You can only add students to your assigned class sections.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    try {
      setSaving(true);
      const username = `std_${formData.formNo || formData.registrationNo}`.toLowerCase();
      const portalPassword = username;
      const payload = {
        ...formData,
        username,
        portalPassword,
        loginEmail: studentLoginEmail(username, schoolId),
        firstName: formData.studentName.split(' ')[0],
        lastName: formData.studentName.split(' ').slice(1).join(' '),
        classId: formData.grade,
        rollNumber: formData.formNo || formData.registrationNo,
        admissionNo: formData.formNo || formData.registrationNo,
        status: "Active",
        portalAccess: true,
        createdAt: new Date().toISOString()
      };

      const docRef = await insertData(buildPath(db, "schools", schoolId, "students"), payload);

      const provision = await provisionPortalUser({
        type: "student",
        schoolId,
        displayName: String(formData.studentName),
        username,
        studentDocId: docRef.id,
        password: portalPassword,
        email: formData.email,
      });

      if (provision.ok && provision.uid) {
        await patchData(buildPath(db, "schools", schoolId, "students", docRef.id), {
          authUid: provision.uid,
          loginEmail: provision.loginEmail || provision.email,
          portalProvisioned: true,
        });
        setProvisionInfo(`Portal login created: ${provision.loginEmail || provision.email}`);
      } else if (provision.configured === false) {
        setProvisionInfo("Student saved. Portal login uses username + password on this record (server provisioning not configured).");
      } else if (provision.error) {
        setProvisionInfo(`Student saved. Portal auto-login pending: ${provision.error}`);
      }

      router.push(studentsListHref);
    } catch (e: any) {
      setError(e.message || "Unknown error occurred while adding student.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  const renderStepIndicator = () => (
    <div className="relative max-w-3xl mx-auto py-2">
      <div className="absolute top-6 sm:top-7 left-[12.5%] right-[12.5%] h-1 bg-gray-100 rounded-full z-0"></div>
      <div className="absolute top-6 sm:top-7 left-[12.5%] h-1 bg-gradient-to-r from-[#144835] to-emerald-500 rounded-full z-0 transition-all duration-700 ease-in-out" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 75}%` }}></div>
      
      <div className="flex items-start justify-between relative z-10">
        {[
          { id: 1, label: 'Profile', desc: 'Basic Details', icon: User },
          { id: 2, label: 'Health', desc: 'Physical & Bank', icon: Heart },
          { id: 3, label: 'Family', desc: 'Parents & Address', icon: Home },
          { id: 4, label: 'Academic', desc: 'Siblings & Form', icon: BookOpen }
        ].map((step) => {
          const Icon = step.icon;
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          return (
            <button
              key={step.id}
              onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
              className="flex flex-col items-center flex-1 focus:outline-none group"
              type="button"
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md border ${
                isCompleted ? 'bg-[#144835] border-[#144835] text-white' :
                isActive ? 'bg-gradient-to-br from-[#144835] to-emerald-700 border-[#144835] text-white ring-4 ring-[#144835]/15' :
                'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'
              }`}>
                {isCompleted ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider mt-2 transition-colors ${isActive ? 'text-[#144835]' : 'text-gray-500'}`}>{step.label}</span>
              <span className="text-xs font-bold text-gray-400 hidden sm:block mt-0.5">{step.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pt-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <SafeLink href={studentsListHref} className="inline-flex items-center gap-2 px-1 text-gray-500 hover:text-gray-900 transition-colors mb-2 text-xs font-bold uppercase tracking-wider">
            <ArrowLeft size={14} /> Back to Student List
          </SafeLink>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 uppercase">New Admission</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Enroll a new student into the school directory</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold border border-red-200/60 uppercase tracking-wide">
          {error}
        </div>
      )}

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
        {renderStepIndicator()}
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {/* STEP 1: STUDENT PROFILE */}
        <div className={currentStep === 1 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
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


        </div>

        {/* STEP 2: HEALTH & BANK */}
        <div className={currentStep === 2 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <FormGroup title="Health Status" icon={Heart}>
            <Select label="Blood Group" value={formData.bloodGroup} onChange={(e: any) => handleChange('bloodGroup', e.target.value)} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} tooltip="Select the student's blood group" />
            <Input label="Left Vision" value={formData.leftVision} onChange={(e: any) => handleChange('leftVision', e.target.value)} tooltip="Enter the left eye vision metric (e.g., 6/6)" />
            <Input label="Right Vision" value={formData.rightVision} onChange={(e: any) => handleChange('rightVision', e.target.value)} tooltip="Enter the right eye vision metric (e.g., 6/6)" />
            
            <Input label="Weight (Term 1)" type="number" value={formData.weightTerm1} onChange={(e: any) => handleChange('weightTerm1', e.target.value)} tooltip="Enter the student's weight in kilograms for Term 1" />
            <Input label="Height (Term 1)" type="number" value={formData.heightTerm1} onChange={(e: any) => handleChange('heightTerm1', e.target.value)} tooltip="Enter the student's height in centimeters for Term 1" />
            <Input label="Weight (Term 2)" type="number" value={formData.weightTerm2} onChange={(e: any) => handleChange('weightTerm2', e.target.value)} tooltip="Enter the student's weight in kilograms for Term 2" />
            <Input label="Height (Term 2)" type="number" value={formData.heightTerm2} onChange={(e: any) => handleChange('heightTerm2', e.target.value)} tooltip="Enter the student's height in centimeters for Term 2" />

            <Select label="Disability" value={formData.disability} onChange={(e: any) => handleChange('disability', e.target.value)} options={["None", "Visual Impairment", "Hearing Impairment", "Locomotor Disability", "Other"]} tooltip="Select disability classification if applicable" />
            <Input label="Sports Activity" value={formData.sportsActivity} onChange={(e: any) => handleChange('sportsActivity', e.target.value)} tooltip="Mention regular sports or physical activities the student is involved in" />
            <Input label="Admission Date" type="date" value={formData.admissionDate} onChange={(e: any) => handleChange('admissionDate', e.target.value)} tooltip="Official date of admission" />
          </FormGroup>

          <FormGroup title="Bank Details" icon={Building}>
            <Input label="Bank Name" value={formData.bankName} onChange={(e: any) => handleChange('bankName', e.target.value)} tooltip="Enter the bank name for official transactions" />
            <Input label="Branch Name" value={formData.branchName} onChange={(e: any) => handleChange('branchName', e.target.value)} tooltip="Enter the bank branch name" />
            <Input label="Account Number" value={formData.accountNo} onChange={(e: any) => handleChange('accountNo', e.target.value)} tooltip="Enter the student's or parent's bank account number" />
            <Input label="IFSC Code" value={formData.ifscCode} onChange={(e: any) => handleChange('ifscCode', e.target.value)} tooltip="Enter the bank's 11-character IFSC code" />
          </FormGroup>
        </div>

        {/* STEP 3: FAMILY & ADDRESS */}
        <div className={currentStep === 3 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <FormGroup title="Father Profile" icon={Users}>
            <Input label="Father Name" required value={formData.fatherName} onChange={(e: any) => handleChange('fatherName', e.target.value)} />
            <Input label="Email" type="email" value={formData.fatherEmail} onChange={(e: any) => handleChange('fatherEmail', e.target.value)} />
            <Input label="Nationality" value={formData.fatherNationality} onChange={(e: any) => handleChange('fatherNationality', e.target.value)} />
            <Input label="Occupation" value={formData.fatherOccupation} onChange={(e: any) => handleChange('fatherOccupation', e.target.value)} />
            <Input label="Department" value={formData.fatherDepartment} onChange={(e: any) => handleChange('fatherDepartment', e.target.value)} />
            <Input label="Designation" value={formData.fatherDesignation} onChange={(e: any) => handleChange('fatherDesignation', e.target.value)} />
            <Input label="Office Name" value={formData.fatherOffice} onChange={(e: any) => handleChange('fatherOffice', e.target.value)} />
            <Input label="Office Address" value={formData.fatherOfficeAddress} onChange={(e: any) => handleChange('fatherOfficeAddress', e.target.value)} />
            <Input label="Office Contact" value={formData.fatherOfficeContact} onChange={(e: any) => handleChange('fatherOfficeContact', e.target.value)} />
            <Input label="Aadhar No" value={formData.fatherAadhar} onChange={(e: any) => handleChange('fatherAadhar', e.target.value)} />
            <Input label="PAN No" value={formData.fatherPan} onChange={(e: any) => handleChange('fatherPan', e.target.value)} />
            <Input label="Annual Income" value={formData.fatherIncome} onChange={(e: any) => handleChange('fatherIncome', e.target.value)} />
            <Input label="Mobile 1" required value={formData.fatherMobile1} onChange={(e: any) => handleChange('fatherMobile1', e.target.value)} />
            <Input label="Mobile 2" value={formData.fatherMobile2} onChange={(e: any) => handleChange('fatherMobile2', e.target.value)} />
            <Input label="Religion" value={formData.fatherReligion} onChange={(e: any) => handleChange('fatherReligion', e.target.value)} />
            <Input label="Caste" value={formData.fatherCaste} onChange={(e: any) => handleChange('fatherCaste', e.target.value)} />
            <Select label="Marital Status" value={formData.fatherMarital} onChange={(e: any) => handleChange('fatherMarital', e.target.value)} options={["Married", "Single", "Divorced", "Widowed"]} />
          </FormGroup>

          <FormGroup title="Mother Profile" icon={Users}>
            <Input label="Mother Name" required value={formData.motherName} onChange={(e: any) => handleChange('motherName', e.target.value)} />
            <Input label="Email" type="email" value={formData.motherEmail} onChange={(e: any) => handleChange('motherEmail', e.target.value)} />
            <Input label="Nationality" value={formData.motherNationality} onChange={(e: any) => handleChange('motherNationality', e.target.value)} />
            <Input label="Occupation" value={formData.motherOccupation} onChange={(e: any) => handleChange('motherOccupation', e.target.value)} />
            <Input label="Department" value={formData.motherDepartment} onChange={(e: any) => handleChange('motherDepartment', e.target.value)} />
            <Input label="Designation" value={formData.motherDesignation} onChange={(e: any) => handleChange('motherDesignation', e.target.value)} />
            <Input label="Office Name" value={formData.motherOffice} onChange={(e: any) => handleChange('motherOffice', e.target.value)} />
            <Input label="Office Address" value={formData.motherOfficeAddress} onChange={(e: any) => handleChange('motherOfficeAddress', e.target.value)} />
            <Input label="Office Contact" value={formData.motherOfficeContact} onChange={(e: any) => handleChange('motherOfficeContact', e.target.value)} />
            <Input label="Aadhar No" value={formData.motherAadhar} onChange={(e: any) => handleChange('motherAadhar', e.target.value)} />
            <Input label="PAN No" value={formData.motherPan} onChange={(e: any) => handleChange('motherPan', e.target.value)} />
            <Input label="Annual Income" value={formData.motherIncome} onChange={(e: any) => handleChange('motherIncome', e.target.value)} />
            <Input label="Mobile 1" value={formData.motherMobile1} onChange={(e: any) => handleChange('motherMobile1', e.target.value)} />
            <Input label="Mobile 2" value={formData.motherMobile2} onChange={(e: any) => handleChange('motherMobile2', e.target.value)} />
            <Input label="Religion" value={formData.motherReligion} onChange={(e: any) => handleChange('motherReligion', e.target.value)} />
            <Input label="Caste" value={formData.motherCaste} onChange={(e: any) => handleChange('motherCaste', e.target.value)} />
            <Select label="Marital Status" value={formData.motherMarital} onChange={(e: any) => handleChange('motherMarital', e.target.value)} options={["Married", "Single", "Divorced", "Widowed"]} />
          </FormGroup>

          <FormGroup title="Permanent Address" icon={Home}>
            <div className="col-span-full sm:col-span-2">
              <Input label="Address Block" required value={formData.permAddress} onChange={(e: any) => handleChange('permAddress', e.target.value)} />
            </div>
            <Input label="Mobile" value={formData.permMobile} onChange={(e: any) => handleChange('permMobile', e.target.value)} />
            <Input label="WhatsApp" value={formData.permWhatsapp} onChange={(e: any) => handleChange('permWhatsapp', e.target.value)} />
            <Input label="City" value={formData.permCity} onChange={(e: any) => handleChange('permCity', e.target.value)} />
            <Input label="State" value={formData.permState} onChange={(e: any) => handleChange('permState', e.target.value)} />
            <Input label="Area" value={formData.permArea} onChange={(e: any) => handleChange('permArea', e.target.value)} />
            <Input label="Place / Landmark" value={formData.permPlace} onChange={(e: any) => handleChange('permPlace', e.target.value)} />
          </FormGroup>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Is Correspondence Address same as Permanent?</span>
            <Checkbox label="Same as Permanent" checked={formData.sameAsPerm} onChange={(e: any) => handleChange('sameAsPerm', e.target.checked)} />
          </div>

          {!formData.sameAsPerm && (
            <FormGroup title="Correspondence Address" icon={Home}>
              <div className="col-span-full sm:col-span-2">
                <Input label="Address Block" value={formData.corrAddress} onChange={(e: any) => handleChange('corrAddress', e.target.value)} />
              </div>
              <Input label="Mobile" value={formData.corrMobile} onChange={(e: any) => handleChange('corrMobile', e.target.value)} />
              <Input label="WhatsApp" value={formData.corrWhatsapp} onChange={(e: any) => handleChange('corrWhatsapp', e.target.value)} />
              <Input label="City" value={formData.corrCity} onChange={(e: any) => handleChange('corrCity', e.target.value)} />
              <Input label="State" value={formData.corrState} onChange={(e: any) => handleChange('corrState', e.target.value)} />
              <Input label="Area" value={formData.corrArea} onChange={(e: any) => handleChange('corrArea', e.target.value)} />
              <Input label="Place / Landmark" value={formData.corrPlace} onChange={(e: any) => handleChange('corrPlace', e.target.value)} />
            </FormGroup>
          )}
        </div>

        {/* STEP 4: SIBLINGS & SUBMIT */}
        <div className={currentStep === 4 ? "block animate-in fade-in slide-in-from-bottom-2 duration-300" : "hidden"}>
          <FormGroup title="Sibling Details (If Enrolled In Same School)" icon={Users}>
            {formData.siblings.map((sibling: any, idx: number) => (
              <div key={idx} className="col-span-full grid grid-cols-1 sm:grid-cols-5 gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <Input label={`Sibling ${idx+1} Name`} value={sibling.name} onChange={(e: any) => handleSiblingChange(idx, 'name', e.target.value)} />
                <Input label="Age" type="number" value={sibling.age} onChange={(e: any) => handleSiblingChange(idx, 'age', e.target.value)} />
                <Select label="Gender" value={sibling.gender} onChange={(e: any) => handleSiblingChange(idx, 'gender', e.target.value)} options={["Male", "Female", "Other"]} />
                <Input label="School Name" value={sibling.school} onChange={(e: any) => handleSiblingChange(idx, 'school', e.target.value)} />
                <Input label="Class" value={sibling.class} onChange={(e: any) => handleSiblingChange(idx, 'class', e.target.value)} />
              </div>
            ))}
          </FormGroup>
        </div>

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 bg-white p-4 rounded-xl shadow-sm">
          <button
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1 || saving}
            className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="inline-flex items-center justify-center px-6 py-2 bg-[#144835] text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-sm hover:bg-[#0d3023] hover:shadow transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-[#144835] to-emerald-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving Admission..." : "Submit Admission"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
