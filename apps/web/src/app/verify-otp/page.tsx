"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, GraduationCap, Shield, Lock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function VerifyOtpPage() {
 const [otp, setOtp] = useState(["", "", "", "", "", ""]);
 const [isLoading, setIsLoading] = useState(false);
 const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
 const router = useRouter();

 useEffect(() => {
 if (inputRefs.current[0]) {
 inputRefs.current[0].focus();
 }
 }, []);

 const handleChange = (index: number, value: string) => {
 if (isNaN(Number(value))) return;

 const newOtp = [...otp];
 newOtp[index] = value;
 setOtp(newOtp);

 // Move to next input
 if (value !== "" && index < 5) {
 inputRefs.current[index + 1]?.focus();
 }
 };

 const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
 // Move to previous input on Backspace
 if (e.key === "Backspace" && index > 0 && otp[index] === "") {
 inputRefs.current[index - 1]?.focus();
 }
 };

 const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
 e.preventDefault();
 const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
 const newOtp = [...otp];
 pastedData.forEach((char, index) => {
 if (index < 6 && !isNaN(Number(char))) {
 newOtp[index] = char;
 }
 });
 setOtp(newOtp);
 inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 const otpValue = otp.join("");
 if (otpValue.length === 6) {
 setIsLoading(true);
 // Simulate verification
 setTimeout(() => {
 setIsLoading(false);
 console.log("Verifying OTP:", otpValue);
 router.push("/reset-password");
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
 Verify Your <br />
 <span className="text-[#a2c144]">Identity</span>
 </h2>
 <p className="text-lg text-gray-300 leading-relaxed font-light">
 For your security, we need to verify it's really you. Please enter the code sent to your registered email.
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
 <h3 className="font-bold text-base">Secure Verification</h3>
 <p className="text-sm text-gray-400 mt-1">This one-time password is valid for 10 minutes only.</p>
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
 <Link
 href="/forgot-password"
 className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#144835] transition-colors mb-6 group"
 >
 <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
 Back to Email
 </Link>
 <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
 <span className="px-2 py-1 rounded bg-[#144835]/10 text-[#144835] text-xs font-bold uppercase tracking-wider">Step 2 of 3</span>
 </div>
 <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">Enter OTP</h2>
 <p className="text-gray-500">
 We've sent a 6-digit code to <span className="font-bold text-[#1A1A1A]">a***n@idps.edu.in</span>
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-8">
 <div className="flex justify-between gap-2">
 {otp.map((digit, index) => (
 <input
 key={index}
 ref={(el) => { inputRefs.current[index] = el; }}
 type="text"
 maxLength={1}
 value={digit}
 onChange={(e) => handleChange(index, e.target.value)}
 onKeyDown={(e) => handleKeyDown(index, e)}
 onPaste={handlePaste}
 className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-[#1A1A1A] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all shadow-sm"
 />
 ))}
 </div>

 <button
 type="submit"
 disabled={isLoading || otp.join("").length !== 6}
 className="w-full bg-[#144835] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 hover:bg-[#144835]/90 hover:shadow-lg hover:shadow-[#144835]/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
 >
 {isLoading ? (
 <>
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 <span>Verifying...</span>
 </>
 ) : (
 <>
 <span>Verify Code</span>
 <ArrowRight size={20} />
 </>
 )}
 </button>
 </form>

 <div className="mt-8 text-center space-y-4">
 <p className="text-sm text-gray-500">
 Didn't receive the code?{" "}
 <button className="text-[#144835] font-bold hover:underline transition-colors">Resend OTP</button>
 </p>
 <div className="flex items-center justify-center text-xs text-gray-400 font-medium bg-gray-50 py-2 rounded-lg mx-auto w-fit px-4">
 <Clock size={14} className="mr-1.5" />
 <span>Code expires in <span className="text-gray-600 font-bold">09:42</span></span>
 </div>
 </div>
 </div>
 </div>

 </main>
 );
}
