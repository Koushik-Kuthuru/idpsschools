"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import AnnualFeeCalculationsTab from "@/components/admin/fees/AnnualFeeCalculationsTab";
import { useAcademicYear } from "@/contexts/AcademicYearContext";

export default function AdminAnnualFeeCollectionPage() {
  const { currentYear } = useAcademicYear();

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0">
      <AdminPageHeader
        title="Annual Fee Collection"
        description={`Student-wise annual fee collection for ${currentYear?.name ?? "the active academic year"}.`}
      />
      <AnnualFeeCalculationsTab />
    </div>
  );
}
