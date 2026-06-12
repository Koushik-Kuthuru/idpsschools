"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { useSchoolId } from "@/hooks/useSchoolId";

const faqs = [
  {
    q: "How do I add a new student?",
    a: "Go to Academic → Students and click Add Student. You can also import students from Excel using the Import button.",
  },
  {
    q: "Where can I manage fee reminders?",
    a: "Open Finance → Fees to view collections, send reminders, and track outstanding balances.",
  },
  {
    q: "How do I mark daily attendance?",
    a: "Navigate to Academic → Attendance, pick the date and class, then save the roster after marking students.",
  },
  {
    q: "Who do I contact for technical issues?",
    a: "Use the support options below or reach your branch IT coordinator for account and access help.",
  },
];

export default function AdminHelpCenterView() {
  const schoolId = useSchoolId();
  const base = `/schools/${schoolId}/admin`;

  const quickLinks = [
    { label: "Students", href: `${base}/academic/students`, icon: GraduationCap },
    { label: "Attendance", href: `${base}/academic/attendance`, icon: BookOpen },
    { label: "Fees", href: `${base}/finance/fees`, icon: Wallet },
    { label: "Staff", href: `${base}/hr/teaching-staff`, icon: Users },
    { label: "Messages", href: `${base}/communication/messages`, icon: MessageSquare },
    { label: "Settings", href: `${base}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Help Center"
        description="Guides, shortcuts, and support for the admin portal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CircleHelp size={18} className="text-[#144835]" />
            <h2 className="text-sm font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-gray-200 bg-gray-50/40 open:bg-white open:border-[#144835]/20 transition-colors"
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-gray-900 flex items-center justify-between gap-3">
                  <span>{item.q}</span>
                  <ChevronRight size={14} className="text-gray-400 group-open:rotate-90 transition-transform shrink-0" />
                </summary>
                <p className="px-4 pb-3 text-xs font-medium text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Quick links</h2>
            <div className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 hover:border-[#144835]/30 hover:bg-[#144835]/[0.03] hover:text-[#144835] transition-colors"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-[#144835]">
                      <Icon size={15} />
                    </span>
                    {link.label}
                    <ChevronRight size={14} className="ml-auto text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-[#144835] rounded-xl border border-[#144835] p-5 text-white">
            <h2 className="text-sm font-bold">Need more help?</h2>
            <p className="text-xs text-white/80 mt-1 leading-relaxed">
              Contact your branch support team for training, permissions, or billing questions.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="mailto:support@idps.edu"
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 transition-colors"
              >
                <Mail size={14} /> support@idps.edu
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 transition-colors"
              >
                <Phone size={14} /> +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
