"use client";

import AdminPageHeader from "@/components/admin/PageHeader";
import MarksSectionNav from "@/components/admin/marks/MarksSectionNav";
import TestsPanel from "@/components/admin/marks/TestsPanel";

export default function TestsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
      <AdminPageHeader
        title="Tests"
        description="Schedule class tests by grade and section for marks entry and report cards"
        actions={<MarksSectionNav />}
      />
      <TestsPanel />
    </div>
  );
}
