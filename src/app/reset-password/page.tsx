"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, CheckCircle2, XCircle, Shield, GraduationCap } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function ResetPasswordPage() {
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const router = useRouter();

 const requirements = [
 { label: "At least 8 characters", valid: password.length >= 8 },
 { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
 { label: "One special character", valid: /[!@#$%^&*]/.test(password) },
 ];

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (password === confirmPassword && requirements.every(r => r.valid)) {
 setIsLoading(true);
 // Simulate API call
 setTimeout(() => {
 setIsLoading(false);
 console.log("Resetting password...");
 router.push("/login");
 }, 1500);
 }
 };

 return (
 <main className="min-h-screen w-full flex font-jost bg-white overflow-hidden">

 {/* Left Side - Hero / Branding (Hidden on mobile) */}
 <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-[#144835] text-white overflow-hidden flex-col justify-between p-12 z-0">
 {/* Background Pattern/Image */}
 <div className="absolute inset-0 z-0">
 <div className="absolute inset-0 bg-gradient-to-br from-[#144835]/95 to-[#0d2e21]/95 z-10"></div>
 <img
 src="https://images.unsplash.com/photo-1509062522246-37559cc792f9?q=80&w=2070&auto=format&fit=crop"
 alt="Library"
 className="w-full h-full object-cover opacity-60 mix-blend-overlay"
 />
 {/* Abstract Shapes */}
 <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
 <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#a2c144]/10 rounded-full blur-3xl"></div>
 </div>

 {/* Header Content */}
 <div className="relative z-20">
 <div className="flex items-center gap-3 mb-8">
 <div className="w-16 flex items-center justify-center">
 <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-auto drop-shadow-md" />
 </div>
 </div>

 <div className="space-y-6 max-w-lg">
 <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
 Reset Your <br />
 <span className="text-[#a2c144]">Password</span>
 </h2>
 <p className="text-lg text-gray-300 leading-relaxed font-light">
 Create a strong, secure password to protect your account and personal information.
 </p>
 </div>
 </div>

 {/* Security Badge */}
 <div className="relative z-20">
 <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md">
 <div className="w-12 h-12 rounded-full bg-[#a2c144]/20 flex items-center justify-center flex-shrink-0">
 <Shield size={24} className="text-[#a2c144]" />
 </div>
 <div>
 <h3 className="font-bold text-base">Password Security</h3>
 <p className="text-sm text-gray-400 mt-1">Use a combination of letters, numbers, and symbols for maximum security.</p>
 </div>
 </div>

 <div className="flex items-center justify-between text-xs text-gray-400 font-medium tracking-wider uppercase border-t border-white/10 pt-8 mt-12">
 <p>© 2025 International Delhi Public School</p>
 </div>
 </div>
 </div>

 {/* Right Side - Form */}
 <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-6 sm:p-12 relative bg-white">
 <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">

 {/* Mobile Logo */}
 <div className="lg:hidden flex justify-center mb-8">
 <div className="w-20 flex items-center justify-center">
 <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-auto drop-shadow-md" />
 </div>
 </div>

 <div className="text-center lg:text-left">
 <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
 <span className="px-2 py-1 rounded bg-[#144835]/10 text-[#144835] text-xs font-bold uppercase tracking-wider">Step 3 of 3</span>
 </div>
 <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">New Password</h2>
 <p className="text-gray-500">
 Please enter your new password below.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">

 {/* New Password */}
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 ml-1" htmlFor="password">New Password</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors">
 <Lock size={20} />
 </div>
 <input
 id="password"
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all font-medium"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
 >
 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 </div>

 {/* Password Strength */}
 <div className="space-y-2">
 <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
 <span>Strength</span>
 <span>{
 requirements.filter(r => r.valid).length === 0 ? "Weak" :
 requirements.filter(r => r.valid).length === 3 ? <span className="text-green-600">Strong</span> :
 <span className="text-yellow-600">Medium</span>
 }</span>
 </div>
 <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full transition-all duration-500 ease-out rounded-full",
 requirements.filter(r => r.valid).length === 0 ? "w-[5%] bg-red-500" :
 requirements.filter(r => r.valid).length === 1 ? "w-[33%] bg-red-500" :
 requirements.filter(r => r.valid).length === 2 ? "w-[66%] bg-yellow-500" :
 "w-full bg-green-500"
 )}
 ></div>
 </div>
 </div>

 {/* Confirm Password */}
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 ml-1" htmlFor="confirmPassword">Confirm Password</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors">
 <CheckCircle2 size={20} className={cn(password && confirmPassword && password === confirmPassword ? "text-green-500" : "text-gray-400")} />
 </div>
 <input
 id="confirmPassword"
 type={showPassword ? "text" : "password"}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all font-medium"
 />
 </div>
 </div>

 {/* Requirements List */}
 <div className="grid grid-cols-1 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
 {requirements.map((req, idx) => (
 <div key={idx} className="flex items-center space-x-2 text-xs">
 {req.valid ? (
 <CheckCircle2 size={14} className="text-green-500" />
 ) : (
 <XCircle size={14} className="text-gray-300" />
 )}
 <span className={req.valid ? "text-gray-700 font-bold" : "text-gray-400"}>{req.label}</span>
 </div>
 ))}
 </div>

 <button
 type="submit"
 disabled={isLoading || !(password === confirmPassword && requirements.every(r => r.valid))}
 className="w-full bg-[#144835] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 hover:bg-[#144835]/90 hover:shadow-lg hover:shadow-[#144835]/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
 >
 {isLoading ? (
 <>
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 <span>Updating...</span>
 </>
 ) : (
 <>
 <span>Reset Password</span>
 <ArrowRight size={20} />
 </>
 )}
 </button>
 </form>
 </div>
 </div>

 </main>
 );
}
