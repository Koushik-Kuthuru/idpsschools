"use client";

import Link from "next/link";
const SafeLink = Link as any;
import { ArrowLeft, ShieldAlert } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";

type TeacherAccessDeniedProps = {
  title?: string;
  message?: string;
  backHref: string;
  backLabel?: string;
};

export default function TeacherAccessDenied({
  title = "Access restricted",
  message = "You do not have permission to perform this action in the teacher portal.",
  backHref,
  backLabel = "Back",
}: TeacherAccessDeniedProps) {
  return (
    <div className="erp-body space-y-6 max-w-[1600px] mx-auto pb-10">
      <AdminPageHeader title={title} description={message} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
        <ShieldAlert className="text-amber-700 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-amber-900">{message}</p>
      </div>
      <SafeLink
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#144835]"
      >
        <ArrowLeft size={16} /> {backLabel}
      </SafeLink>
    </div>
  );
}
