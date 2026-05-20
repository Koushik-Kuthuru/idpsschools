"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Users, BookOpen, BarChart3 } from "lucide-react";

export default function LandingPage() {
 return (
 <main className="min-h-screen flex flex-col bg-white">
 {/* Navbar */}
 <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center space-x-3">
 <div className="w-12 flex items-center justify-center">
 <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-auto drop-shadow-md" />
 </div>
 <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">IDPS ERP</span>
 </div>
 <div className="flex items-center space-x-4">
 <Link
 href="/login"
 className="px-5 py-2.5 bg-[#004D40] text-white rounded-lg font-semibold text-sm hover:bg-[#003d33] transition-all flex items-center gap-2 shadow-lg shadow-[#004D40]/20"
 >
 Login Portal <ArrowRight size={16} />
 </Link>
 </div>
 </div>
 </div>
 </nav>

 {/* Hero Section */}
 <section className="relative pt-20 pb-32 overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-br from-[#F1F8F6] via-[#FFFFFF] to-[#E8F5F1] -z-10"></div>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004D40]/10 text-[#004D40] text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <span className="w-2 h-2 rounded-full bg-[#004D40]"></span>
 Next Gen School Management
 </div>
 <h1 className="text-5xl md:text-7xl font-extrabold text-[#1A1A1A] tracking-tight mb-8 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
 Empowering Education with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004D40] to-[#00897B]">Digital Excellence</span>
 </h1>
 <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-900">
 Streamline operations, enhance learning, and foster collaboration with the most advanced ERP system designed for International Delhi Public School.
 </p>
 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
 <Link
 href="/login"
 className="px-8 py-4 bg-[#004D40] text-white rounded-xl font-bold text-lg hover:bg-[#003d33] transition-all shadow-xl shadow-[#004D40]/20 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
 >
 Access Portal <ArrowRight size={20} />
 </Link>
 <button className="px-8 py-4 bg-white text-[#004D40] border-2 border-[#004D40]/10 rounded-xl font-bold text-lg hover:bg-[#F1F8F6] transition-all hover:-translate-y-1">
 Learn More
 </button>
 </div>
 </div>
 </section>

 {/* Features Grid */}
 <section className="py-24 bg-white">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
 {[
 {
 icon: <GraduationCap size={32} />,
 title: "Academic Excellence",
 desc: "Comprehensive tools for curriculum planning, grading, and student performance tracking."
 },
 {
 icon: <Users size={32} />,
 title: "Seamless Collaboration",
 desc: "Connect teachers, students, and parents in one unified digital ecosystem."
 },
 {
 icon: <BookOpen size={32} />,
 title: "Resource Management",
 desc: "Efficiently manage library, inventory, and school assets with ease."
 },
 {
 icon: <BarChart3 size={32} />,
 title: "Smart Analytics",
 desc: "Data-driven insights to make informed decisions for school growth."
 }
 ].map((feature, idx) => (
 <div key={idx} className="p-8 rounded-2xl bg-[#F8FAFB] hover:bg-[#F1F8F6] transition-colors group cursor-default">
 <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-[#004D40] shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
 {feature.icon}
 </div>
 <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{feature.title}</h3>
 <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="bg-[#1A1A1A] text-white py-12 mt-auto">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
 <div className="flex items-center space-x-3">
 <div className="w-10 flex items-center justify-center">
 <img src="/idps-logo.png" alt="IDPS Logo" className="w-full h-auto drop-shadow-md opacity-80" />
 </div>
 <span className="text-lg font-bold tracking-tight">IDPS ERP</span>
 </div>
 <p className="text-gray-400 text-sm">
 © 2025 International Delhi Public School. All rights reserved.
 </p>
 </div>
 </footer>
 </main>
 );
}
