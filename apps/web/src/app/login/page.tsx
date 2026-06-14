"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/auth/roles";
import { User, Lock, Eye, EyeOff, ArrowRight, BookOpen, Shield, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs));
}

export default function LoginPage() {
 const router = useRouter();
 const { user, role, schoolId, loading, login } = useAuth();
 
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [rememberMe, setRememberMe] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const redirectBasedOnRole = useCallback(
   (userRole: string | null, userSchoolId: string | null) => {
     if (!userRole) {
       setError("Your account has no role assigned. Contact your administrator.");
       return;
     }
     const home = getRoleHomePath(userRole, userSchoolId);
     if (home === "/login") {
       setError("Your account is not assigned to any school. Contact Super Admin.");
       return;
     }
     router.push(home);
   },
   [router]
 );

 // Redirect if already logged in
 useEffect(() => {
 if (!loading && user && role) {
 redirectBasedOnRole(role, schoolId);
 }
 }, [loading, redirectBasedOnRole, role, schoolId, user]);

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 setIsLoading(true);

 try {
 await login(email, password);
 // onAuthStateChanged in AuthContext will update state,
 // and the useEffect above will redirect the user.
 } catch (err: any) {
 console.error(err);
 const code = err?.code ?? "";
 if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
 setError("Invalid email or password. Please try again.");
 } else if (code === "auth/too-many-requests") {
 setError("Too many failed attempts. Please try again later.");
 } else if (code === "auth/user-disabled") {
 setError("This account has been disabled. Contact your administrator.");
 } else {
 setError("Sign in failed. Please check your credentials and try again.");
 }
 setIsLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen w-full flex items-center justify-center bg-white">
 <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <main className="min-h-screen w-full flex font-jost bg-white overflow-hidden">

 {/* Left Side - Hero / Branding (Hidden on mobile) */}
 <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-[#144835] text-white overflow-hidden flex-col justify-between p-12 z-0">
 {/* Background Pattern/Image */}
 <div className="absolute inset-0 z-0">
 <div className="absolute inset-0 bg-gradient-to-br from-[#144835]/95 to-[#0d2e21]/95 z-10"></div>
 <img
 src="/login-bg.jpg"
 alt="School Campus"
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
 <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
 Empowering the <br />
 <span className="text-[#a2c144]">Future of Education</span>
 </h2>
 <p className="text-lg text-gray-300 leading-relaxed font-light">
 Streamline operations, enhance learning experiences, and foster collaboration with our comprehensive school management system.
 </p>
 </div>
 </div>

 {/* Feature List */}
 <div className="relative z-20">
 <div className="grid grid-cols-2 gap-6 mb-12">
 {[
 { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade data protection" },
 { icon: BookOpen, title: "Smart Learning", desc: "Integrated LMS & resources" },
 ].map((item, idx) => (
 <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
 <div className="w-10 h-10 rounded-full bg-[#a2c144]/20 flex items-center justify-center flex-shrink-0">
 <item.icon size={20} className="text-[#a2c144]" />
 </div>
 <div>
 <h3 className="font-bold text-sm">{item.title}</h3>
 <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="flex items-center justify-between text-xs text-gray-400 font-medium tracking-wider uppercase border-t border-white/10 pt-8">
 <p>© 2025 International Delhi Public School</p>
 <div className="flex gap-6">
 <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
 <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
 </div>
 </div>
 </div>
 </div>

 {/* Right Side - Login Form */}
 <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-6 sm:p-12 relative bg-white">
 <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">

 {/* Mobile Logo (Visible only on small screens) */}
 <div className="lg:hidden flex justify-center mb-8">
 <div className="w-20 flex items-center justify-center">
 <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-auto drop-shadow-md" />
 </div>
 </div>

 <div className="text-center lg:text-left">
 <h2 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">Welcome Back</h2>
 <p className="text-gray-500">Please sign in to access your dashboard.</p>
 </div>

 {error && (
 <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
 {error}
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-6">

 {/* Email Input */}
 <div className="space-y-2">
 <label className="text-sm font-bold text-gray-700 ml-1" htmlFor="email">Email or Username</label>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors">
 <User size={20} />
 </div>
 <input
 id="email"
 type="text"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="Enter your email"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all font-medium"
 />
 </div>
 </div>

 {/* Password Input */}
 <div className="space-y-2">
 <div className="flex justify-between items-center ml-1">
 <label className="text-sm font-bold text-gray-700" htmlFor="password">Password</label>
 </div>
 <div className="relative group">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#144835] transition-colors">
 <Lock size={20} />
 </div>
 <input
 id="password"
 type={showPassword ? "text" : "password"}
 required
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

 {/* Remember Me & Forgot Password */}
 <div className="flex items-center justify-between">
 <label className="flex items-center space-x-2.5 cursor-pointer group select-none">
 <div
 className={cn(
 "w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center",
 rememberMe
 ? "bg-[#144835] border-[#144835]"
 : "border-gray-300 bg-white group-hover:border-[#144835]"
 )}
 onClick={() => setRememberMe(!rememberMe)}
 >
 {rememberMe && <CheckCircle2 size={12} className="text-white" />}
 </div>
 <input type="checkbox" className="hidden" checked={rememberMe} readOnly />
 <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Remember me</span>
 </label>

 <Link
 href="/forgot-password"
 className="text-sm font-bold text-[#144835] hover:text-[#0d2e21] hover:underline transition-all"
 >
 Forgot Password?
 </Link>
 </div>

 {/* Login Button */}
 <button
 type="submit"
 disabled={isLoading}
 className="w-full bg-[#144835] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 hover:bg-[#144835]/90 hover:shadow-lg hover:shadow-[#144835]/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
 >
 {isLoading ? (
 <>
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 <span>Signing In...</span>
 </>
 ) : (
 <>
 <span>Sign In</span>
 <ArrowRight size={20} />
 </>
 )}
 </button>
 </form>

 <div className="pt-6 text-center">
 <p className="text-sm text-gray-500">
 Don't have an account?{' '}
 <a href="#" className="font-bold text-[#1A1A1A] hover:text-[#144835] transition-colors">Contact Administration</a>
 </p>
 </div>

 {/* Footer Links (Mobile only) */}
 <div className="lg:hidden mt-8 flex justify-center space-x-6 text-gray-400 text-xs font-bold uppercase tracking-wider">
 <a href="#" className="hover:text-gray-600">Privacy</a>
 <a href="#" className="hover:text-gray-600">Terms</a>
 <a href="#" className="hover:text-gray-600">Help</a>
 </div>
 </div>
 </div>

 </main>
 );
}
