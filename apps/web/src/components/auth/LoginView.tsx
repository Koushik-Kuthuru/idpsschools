"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
const SafeLink = Link as any;
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/auth/roles";
import { User, Lock, Eye, EyeOff, ArrowRight, BookOpen, Shield, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LoginViewProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  schoolContext?: "idpskalaburagi" | "idpscherukupalli";
  requireSuperAdmin?: boolean;
}

export default function LoginView({
  title,
  subtitle,
  backgroundImage = "/login-bg.jpg",
  logo = "/idps-logo.png",
  primaryColor = "#144835",
  secondaryColor = "#a2c144",
  gradientFrom = "from-[#144835]/95",
  gradientTo = "to-[#0d2e21]/95",
  schoolContext,
  requireSuperAdmin = false,
}: LoginViewProps) {
  const router = useRouter();
  const { user, role, schoolId, loading, login, logout, devLogin } = useAuth();
  
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
        logout();
        return;
      }
      
      if (requireSuperAdmin && userRole !== "super_admin") {
        setError("Unauthorized access. Super Admin privileges required.");
        logout();
        return;
      }

      if (schoolContext && userSchoolId !== schoolContext) {
        setError("This account is not authorized for this branch portal.");
        logout();
        return;
      }
      
      const home = getRoleHomePath(userRole, userSchoolId);
      if (home === "/login") {
        setError("Your account is not assigned to any school. Contact Super Admin.");
        logout();
        return;
      }
      router.push(home);
    },
    [router, requireSuperAdmin, schoolContext, logout]
  );

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      redirectBasedOnRole(role, schoolId);
    }
  }, [loading, redirectBasedOnRole, role, schoolId, user]);

  const handleDevLogin = (roleMock: string) => {
    if (!schoolContext || !devLogin) return;
    devLogin(roleMock, schoolContext);
    router.push(getRoleHomePath(roleMock, schoolContext));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // AuthContext session listener loads profile and useEffect redirects.
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      const code = (err as { code?: string })?.code ?? "";
      if (
        code === "invalid_credentials" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        message.toLowerCase().includes("invalid login credentials")
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests" || message.toLowerCase().includes("too many")) {
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
        <div 
          className="w-10 h-10 border-4 rounded-full animate-spin border-t-transparent" 
          style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex font-jost bg-white overflow-hidden">
      {/* Left Side - Hero / Branding (Hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative text-white overflow-hidden flex-col justify-between p-12 z-0"
        style={{ backgroundColor: primaryColor }}
      >
        {/* Background Pattern/Image */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} z-10`}></div>
          <img
            src={backgroundImage}
            alt="Campus"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          {/* Abstract Shapes */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div 
            className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: `${secondaryColor}1a` }}
          ></div>
        </div>

        {/* Header Content */}
        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-auto drop-shadow-md" />
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
              {title} <br />
              <span style={{ color: secondaryColor }}>{subtitle}</span>
            </h2>
            <p className="text-lg text-white/85 leading-relaxed font-light">
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
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${secondaryColor}33` }}
                >
                  <item.icon size={20} style={{ color: secondaryColor }} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{item.title}</h3>
                  <p className="text-xs text-white/70 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 font-medium tracking-wider uppercase border-t border-white/10 pt-8">
            <p>© {new Date().getFullYear()} International Delhi Public School</p>
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
              <img src={logo} alt="Logo" className="w-full h-auto drop-shadow-md" />
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
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                  style={{ '--tw-group-focus-within-color': primaryColor } as any}
                >
                  <User size={20} className="group-focus-within:text-[var(--tw-group-focus-within-color)]" />
                </div>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium"
                  style={{ '--tw-ring-color': `${primaryColor}33`, borderColor: 'transparent' } as any}
                  onFocus={(e) => { e.target.style.borderColor = primaryColor; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors"
                >
                  <Lock size={20} className="group-focus-within:text-[var(--tw-group-focus-within-color)]" style={{ '--tw-group-focus-within-color': primaryColor } as any} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all font-medium"
                  style={{ '--tw-ring-color': `${primaryColor}33`, borderColor: 'transparent' } as any}
                  onFocus={(e) => { e.target.style.borderColor = primaryColor; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
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
                    rememberMe ? "" : "border-gray-300 bg-white"
                  )}
                  style={rememberMe ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={rememberMe} readOnly />
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>

              <SafeLink
                href="/forgot-password"
                className="text-sm font-bold hover:underline transition-all"
                style={{ color: primaryColor }}
              >
                Forgot Password?
              </SafeLink>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-4 rounded-xl font-bold text-base flex items-center justify-center space-x-2 shadow-lg transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none hover:-translate-y-0.5"
              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}33` }}
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

          {/* Quick Testing Login */}
          {schoolContext && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500 font-bold text-center mb-4">Quick Access (Dev Only)</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDevLogin("admin")}
                  className="text-xs font-semibold py-3 px-6 rounded-xl border transition-colors flex flex-col items-center gap-1 hover:bg-gray-50"
                  style={{ color: primaryColor, borderColor: `${primaryColor}33` }}
                >
                  <span>{schoolContext === "idpskalaburagi" ? "Kalaburagi" : "Cherukupalli"}</span>
                  <span className="text-gray-500">Admin Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("teacher")}
                  className="text-xs font-semibold py-3 px-6 rounded-xl border transition-colors flex flex-col items-center gap-1 hover:bg-gray-50"
                  style={{ color: primaryColor, borderColor: `${primaryColor}33` }}
                >
                  <span>{schoolContext === "idpskalaburagi" ? "Kalaburagi" : "Cherukupalli"}</span>
                  <span className="text-gray-500">Teacher Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin("student")}
                  className="text-xs font-semibold py-3 px-6 rounded-xl border transition-colors flex flex-col items-center gap-1 hover:bg-gray-50"
                  style={{ color: primaryColor, borderColor: `${primaryColor}33` }}
                >
                  <span>{schoolContext === "idpskalaburagi" ? "Kalaburagi" : "Cherukupalli"}</span>
                  <span className="text-gray-500">Student Login</span>
                </button>
              </div>
            </div>
          )}
          {requireSuperAdmin && (
             <div className="mt-6 border-t border-gray-100 pt-6">
             <p className="text-sm text-gray-500 font-bold text-center mb-4">Quick Access (Dev Only)</p>
             <div className="flex justify-center">
               <button
                 type="button"
                 onClick={() => {
                   if (devLogin) {
                     devLogin("super_admin", "superadmin");
                     router.push(getRoleHomePath("super_admin", "superadmin"));
                   }
                 }}
                 className="text-xs font-semibold py-3 px-6 rounded-xl border transition-colors flex flex-col items-center gap-1 hover:bg-gray-50"
                 style={{ color: primaryColor, borderColor: `${primaryColor}33` }}
               >
                 <span>Super Admin</span>
                 <span className="text-gray-500">Auto Login</span>
               </button>
             </div>
           </div>
          )}

          <div className="pt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="#" className="font-bold text-[#1A1A1A] transition-colors" style={{ '--tw-hover-color': primaryColor } as any} onMouseOver={(e) => { e.currentTarget.style.color = primaryColor; }} onMouseOut={(e) => { e.currentTarget.style.color = '#1A1A1A'; }}>Contact Administration</a>
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
