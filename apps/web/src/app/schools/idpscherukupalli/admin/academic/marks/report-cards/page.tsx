"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import MarksSectionNav from "@/components/admin/marks/MarksSectionNav";
import ReportCardsPanel from "@/components/admin/marks/ReportCardsPanel";

export default function ReportCardsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
      <AdminPageHeader
        title="Report Cards"
        description="Preview, generate, and print student report cards by class and exam"
        actions={<MarksSectionNav />}
      />
      <ReportCardsPanel />
    </div>
  );
}
