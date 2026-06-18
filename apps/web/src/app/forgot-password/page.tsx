"use client";

import React, { useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
;
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, GraduationCap, Shield, Lock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function ForgotPasswordPage() {
 const [email, setEmail] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const router = useRouter();

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 // Simulate API call
 setTimeout(() => {
 setIsLoading(false);
 console.log("Sending OTP to:", email);
 router.push("/verify-otp");
 }, 1500);
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
 Secure Account <br />
 <span className="text-[#a2c144]">Recovery</span>
 </h2>
 <p className="text-lg text-gray-300 leading-relaxed font-light">
 Don't worry, it happens to the best of us. We'll help you get back into your account securely and quickly.
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
 <h3 className="font-bold text-base">Enterprise Security</h3>
 <p className="text-sm text-gray-400 mt-1">Your data is protected with end-to-end encryption and secure OTP verification.</p>
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
 <SafeLink
 href="/login"
 className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#144835] transition-colors mb-6 group"
 >
 <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
 Back to Login
 </SafeLink>
 <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">Forgot Password?</h2>
 <p className="text-gray-500">Enter your email address and we'll send you a code to reset your password.</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">

 {/* Email Input */}
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 ml-1" htmlFor="email">Email Address</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors">
 <Mail size={20} />
 </div>
 <input
 id="email"
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="name@school.edu.in"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all font-medium"
 />
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isLoading}
 className="w-full bg-[#144835] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 hover:bg-[#144835]/90 hover:shadow-lg hover:shadow-[#144835]/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
 >
 {isLoading ? (
 <>
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 <span>Sending OTP...</span>
 </>
 ) : (
 <>
 <span>Send Verification Code</span>
 <ArrowRight size={20} />
 </>
 )}
 </button>
 </form>

 <div className="pt-6 text-center border-t border-gray-100">
 <p className="text-sm text-gray-500">
 Having trouble?{' '}
 <a href="#" className="font-bold text-[#1A1A1A] hover:text-[#144835] transition-colors">Contact Support</a>
 </p>
 </div>
 </div>
 </div>

 </main>
 );
}
