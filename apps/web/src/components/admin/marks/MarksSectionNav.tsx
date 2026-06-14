"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSchoolId } from "@/hooks/useSchoolId";
import { ClipboardList, FileText, BarChart3 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MarksSectionNav() {
  const schoolId = useSchoolId();
  const base = `/schools/${schoolId}/admin/academic/marks`;
  const pathname = usePathname();
  const isMarks = pathname === base || pathname === `${base}/`;
  const isTests = pathname?.startsWith(`${base}/tests`);
  const isReportCards = pathname?.startsWith(`${base}/report-cards`);

  const linkCls = (active: boolean, primary?: boolean) =>
    cn(
      "h-9 inline-flex items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors",
      active
        ? "bg-[#144835] text-white shadow-md shadow-[#144835]/20 hover:bg-[#144835]/90"
        : primary
          ? "border border-[#144835]/30 bg-[#144835]/5 text-[#144835] hover:bg-[#144835]/10"
          : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
    );

  return (
    <>
      <Link href={base} className={linkCls(isMarks)}>
        <BarChart3 size={14} />
        Marks
      </Link>
      <Link href={`${base}/tests`} className={linkCls(isTests)}>
        <ClipboardList size={14} />
        Tests
      </Link>
      <Link href={`${base}/report-cards`} className={linkCls(isReportCards, true)}>
        <FileText size={14} />
        Report Cards
      </Link>
    </>
  );
}
