"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StudentListCohort } from "@/lib/loadBranchStudents";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type StudentsSectionNavProps = {
  schoolId: string;
  active: StudentListCohort | "siblings";
};

export default function StudentsSectionNav({ schoolId, active }: StudentsSectionNavProps) {
  const pathname = usePathname();
  const base = `/schools/${schoolId}/admin/academic/students`;

  const tabs: { cohort: StudentListCohort | "siblings"; href: string; label: string }[] = [
    { cohort: "enrolled", href: base, label: "All Enrolled" },
    { cohort: "new-admissions", href: `${base}/new-admissions`, label: "New Admissions" },
    { cohort: "nso", href: `${base}/nso`, label: "NSO (Left School)" },
    { cohort: "cancelled", href: `${base}/cancelled`, label: "Admission Cancelled" },
    { cohort: "siblings", href: `${base}/siblings`, label: "Siblings" },
  ];

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide"
      role="tablist"
      aria-label="Student record sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.cohort === active || pathname === tab.href;
        return (
          <Link
            key={tab.cohort}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2",
              isActive
                ? "bg-[#144835]/5 text-[#144835] border-[#144835]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
