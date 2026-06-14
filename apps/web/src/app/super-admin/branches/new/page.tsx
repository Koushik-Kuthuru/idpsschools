"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
 Save, 
 MapPin, 
 Mail, 
 Phone, 
 ChevronDown,
 ChevronRight,
 Upload,
 Globe,
 User,
 Layout,
 Coffee,
 Bus,
 BookOpen,
 Dumbbell,
 FlaskConical,
 Monitor,
 Music,
 Utensils,
 Lock,
 Eye,
 EyeOff
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function AddBranchPage() {
 const [showPassword, setShowPassword] = useState(false);
 const [isActive, setIsActive] = useState(true);
 const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
 const [logoPreview, setLogoPreview] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 
 // Form State
 const [formData, setFormData] = useState({
 branchName: "",
 branchCode: "BR-" + Math.floor(1000 + Math.random() * 9000), // Auto-generated mock
 establishedYear: "",
 affiliationBoard: "",
 schoolType: "",
 address: "",
 city: "",
 state: "",
 zipCode: "",
 country: "India",
 email: "",
 phone: "",
 website: "",
 principalName: "",
 studentCapacity: "",
 branchAdmin: "",
 username: "",
 password: "",
 academicYear: "2024-2025"
 });

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 const { name, value } = e.target;
 setFormData(prev => ({
 ...prev,
 [name]: value
 }));
 };

 const toggleFacility = (facility: string) => {
 if (selectedFacilities.includes(facility)) {
 setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
 } else {
 setSelectedFacilities([...selectedFacilities, facility]);
 }
 };

 const handleLogoClick = () => {
 fileInputRef.current?.click();
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setLogoPreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleSubmit = () => {
 // Basic Validation
 if (!formData.branchName || !formData.email || !formData.username || !formData.password) {
 alert("Please fill in all required fields (Branch Name, Email, Username, Password).");
 return;
 }

 const payload = {
 ...formData,
 isActive,
 facilities: selectedFacilities,
 logo: logoPreview, // Include logo in payload
 createdAt: new Date().toISOString()
 };

 console.log("Form Submitted:", payload);
 alert("Branch created successfully! (Check console for payload)");
 // Here you would typically make an API call
 };

 const facilities = [
 { id: "library", label: "Library", icon: BookOpen },
 { id: "labs", label: "Science Labs", icon: FlaskConical },
 { id: "transport", label: "Transport", icon: Bus },
 { id: "cafeteria", label: "Cafeteria", icon: Utensils },
 { id: "sports", label: "Sports Complex", icon: Dumbbell },
 { id: "smart_class", label: "Smart Classes", icon: Monitor },
 { id: "auditorium", label: "Auditorium", icon: Music },
 { id: "hostel", label: "Hostel", icon: Layout },
 ];

 return (
 <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24 font-jost">
 
 {/* Breadcrumb & Header */}
 <div className="space-y-4">
 <nav className="flex items-center text-xs font-medium text-gray-500">
 <Link href="/super-admin" className="hover:text-[#144835] transition-colors">Dashboard</Link>
 <ChevronRight size={14} className="mx-2" />
 <Link href="/super-admin/branches" className="hover:text-[#144835] transition-colors">Branches</Link>
 <ChevronRight size={14} className="mx-2" />
 <span className="text-[#144835] font-semibold">Create New Branch</span>
 </nav>
 
 <div>
 <h1 className="text-xl font-extrabold text-[#1A1A1A] uppercase tracking-tight">Create New Branch / School</h1>
 <p className="text-gray-500 mt-1">Setup a new campus or physical branch for the IDPS education network.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
 
 {/* Left Column (2/3 width) */}
 <div className="xl:col-span-2 space-y-8">
 
 {/* School Profile Card */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide flex items-center gap-2">
 <Layout size={20} /> School Profile
 </h2>
 
 <div className="flex flex-col md:flex-row gap-8 mb-8">
 {/* Logo Upload */}
 <div className="w-full md:w-48 flex-shrink-0">
 <label className="text-xs font-bold text-gray-700 mb-2 block">School Logo</label>
 <input 
 type="file" 
 ref={fileInputRef} 
 className="hidden" 
 accept="image/*"
 onChange={handleFileChange}
 />
 <div 
 onClick={handleLogoClick}
 className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#144835] hover:bg-[#144835]/5 transition-all group overflow-hidden relative"
 >
 {logoPreview ? (
 <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
 ) : (
 <>
 <Upload className="text-gray-400 group-hover:text-[#144835] mb-2" size={32} />
 <span className="text-xs text-gray-500 font-medium group-hover:text-[#144835]">Click to upload</span>
 <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</span>
 </>
 )}
 </div>
 </div>

 <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2 space-y-2">
 <label className="text-xs font-bold text-gray-700">Branch Name (required)</label>
 <input 
 type="text" 
 name="branchName"
 value={formData.branchName}
 onChange={handleChange}
 placeholder="Enter full school/branch name" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Branch Code</label>
 <input 
 type="text" 
 name="branchCode"
 value={formData.branchCode}
 disabled
 className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-500 cursor-not-allowed font-medium"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Established Year</label>
 <input 
 type="number" 
 name="establishedYear"
 value={formData.establishedYear}
 onChange={handleChange}
 placeholder="YYYY" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Affiliation Board</label>
 <div className="relative">
 <select 
 name="affiliationBoard"
 value={formData.affiliationBoard}
 onChange={handleChange}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer"
 >
 <option value="">Select Board</option>
 <option value="CBSE">CBSE</option>
 <option value="ICSE">ICSE</option>
 <option value="State Board">State Board</option>
 <option value="IB">IB</option>
 <option value="IGCSE">IGCSE</option>
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">School Type</label>
 <div className="relative">
 <select 
 name="schoolType"
 value={formData.schoolType}
 onChange={handleChange}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer"
 >
 <option value="">Select Type</option>
 <option value="K-12">K-12</option>
 <option value="Primary School">Primary School</option>
 <option value="Secondary School">Secondary School</option>
 <option value="Senior Secondary">Senior Secondary</option>
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Location & Contact Card */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide flex items-center gap-2">
 <MapPin size={20} /> Location & Contact
 </h2>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2 space-y-2">
 <label className="text-xs font-bold text-gray-700">Address Line 1</label>
 <input 
 type="text" 
 name="address"
 value={formData.address}
 onChange={handleChange}
 placeholder="Street address, P.O. box, etc." 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">City</label>
 <input 
 type="text" 
 name="city"
 value={formData.city}
 onChange={handleChange}
 placeholder="City" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">State / Province</label>
 <input 
 type="text" 
 name="state"
 value={formData.state}
 onChange={handleChange}
 placeholder="State" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Zip / Postal Code</label>
 <input 
 type="text" 
 name="zipCode"
 value={formData.zipCode}
 onChange={handleChange}
 placeholder="Zip Code" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Country</label>
 <div className="relative">
 <select 
 name="country"
 value={formData.country}
 onChange={handleChange}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer"
 >
 <option value="India">India</option>
 <option value="United Arab Emirates">United Arab Emirates</option>
 <option value="United States">United States</option>
 <option value="United Kingdom">United Kingdom</option>
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
 </div>
 </div>
 
 <div className="md:col-span-2 border-t border-gray-100 my-2"></div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Official Email (required)</label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input 
 type="email" 
 name="email"
 value={formData.email}
 onChange={handleChange}
 placeholder="admin@school.com" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Phone Number</label>
 <div className="relative">
 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input 
 type="tel" 
 name="phone"
 value={formData.phone}
 onChange={handleChange}
 placeholder="+91 98765 43210" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 </div>
 <div className="md:col-span-2 space-y-2">
 <label className="text-xs font-bold text-gray-700">Website</label>
 <div className="relative">
 <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input 
 type="url" 
 name="website"
 value={formData.website}
 onChange={handleChange}
 placeholder="https://www.yourschool.com" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-11 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Facilities Card */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide flex items-center gap-2">
 <Coffee size={20} /> Infrastructure & Facilities
 </h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {facilities.map((facility) => (
 <div 
 key={facility.id}
 onClick={() => toggleFacility(facility.id)}
 className={cn(
 "cursor-pointer rounded-lg p-4 border transition-all flex flex-col items-center justify-center gap-2 text-center group hover:shadow-md",
 selectedFacilities.includes(facility.id)
 ? "bg-[#144835]/5 border-[#144835] text-[#144835]"
 : "bg-white border-gray-200 hover:border-[#144835]/50 text-gray-600"
 )}
 >
 <facility.icon size={18} className={selectedFacilities.includes(facility.id) ? "text-[#144835]" : "text-gray-400 group-hover:text-[#144835]"} />
 <span className="text-xs font-bold">{facility.label}</span>
 </div>
 ))}
 </div>
 </div>

 </div>

 {/* Right Column (1/3 width) */}
 <div className="space-y-8">
 
 {/* Admin Assignment */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide flex items-center gap-2">
 <User size={20} /> Admin & Capacity
 </h2>
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Principal Name</label>
 <input 
 type="text" 
 name="principalName"
 value={formData.principalName}
 onChange={handleChange}
 placeholder="Dr. Name Surname" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Student Capacity</label>
 <input 
 type="number" 
 name="studentCapacity"
 value={formData.studentCapacity}
 onChange={handleChange}
 placeholder="e.g. 2500" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Assign Branch Admin</label>
 <div className="relative">
 <select 
 name="branchAdmin"
 value={formData.branchAdmin}
 onChange={handleChange}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer"
 >
 <option value="">Select a Staff Member</option>
 <option value="Sarah Jenkins">Sarah Jenkins</option>
 <option value="Michael Chen">Michael Chen</option>
 <option value="Robert Fox">Robert Fox</option>
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
 </div>
 </div>
 </div>
 </div>

 {/* Branch Credentials */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide flex items-center gap-2">
 <Lock size={20} /> Branch Credentials
 </h2>
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Username (required)</label>
 <input 
 type="text" 
 name="username"
 value={formData.username}
 onChange={handleChange}
 placeholder="e.g. branch_admin_01" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 </div>
 
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Password (required)</label>
 <div className="relative">
 <input 
 type={showPassword ? "text" : "password"}
 name="password"
 value={formData.password}
 onChange={handleChange}
 placeholder="Enter secure password" 
 className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-11 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] transition-all placeholder-gray-500"
 />
 <button 
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with numbers and symbols.</p>
 </div>
 </div>
 </div>

 {/* Settings */}
 <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
 <h2 className="text-lg font-bold text-[#144835] mb-6 uppercase tracking-wide">Settings</h2>
 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Academic Year</label>
 <div className="relative">
 <select 
 name="academicYear"
 value={formData.academicYear}
 onChange={handleChange}
 className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-10 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] cursor-pointer"
 >
 <option value="2024-2025">2024-2025 (Current)</option>
 <option value="2025-2026">2025-2026</option>
 <option value="2026-2027">2026-2027</option>
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-bold text-gray-700">Branch Status</label>
 <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-between">
 <div>
 <p className="text-xs font-bold text-gray-900">Active Status</p>
 <p className="text-xs text-gray-500 mt-0.5">Toggle branch visibility</p>
 </div>
 
 <button 
 onClick={() => setIsActive(!isActive)}
 className={cn(
 "w-10 h-6 rounded-full relative transition-colors duration-300 ease-in-out",
 isActive ? "bg-[#144835]" : "bg-gray-300"
 )}
 >
 <div className={cn(
 "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-300 ease-in-out",
 isActive ? "translate-x-6" : "translate-x-0.5"
 )} />
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>

 </div>

 {/* Footer Buttons */}
 <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40 md:pl-64">
 <div className="max-w-7xl mx-auto flex justify-end gap-4">
 <Link 
 href="/super-admin/branches"
 className="px-8 py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm uppercase tracking-wide"
 >
 Cancel
 </Link>
 <button 
 onClick={handleSubmit}
 className="px-8 py-3 bg-[#144835] text-white rounded-lg text-xs font-bold hover:bg-[#144835]/90 flex items-center gap-2 shadow-lg shadow-[#144835]/20 transition-all transform active:scale-95 uppercase tracking-wide"
 >
 <Save size={18} />
 Save Branch
 </button>
 </div>
 </div>
 </div>
 );
}
