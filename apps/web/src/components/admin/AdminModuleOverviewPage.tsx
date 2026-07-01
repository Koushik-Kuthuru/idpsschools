"use client";

import AdminPageHeader from "@/components/admin/PageHeader";

export default function AdminModuleOverviewPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader title={title} description={description} />
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-medium text-gray-500">This module is being set up. Check back soon.</p>
      </div>
    </div>
  );
}
