"use client";

import { notFound, usePathname } from "next/navigation";
import AdminModuleOverviewPage from "@/components/admin/AdminModuleOverviewPage";
import { HOSTEL_SECTIONS, MESS_SECTIONS } from "@/lib/hostelMessSections";

export default function AdminHostelMessPage({ module }: { module: "hostel" | "mess" }) {
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean).pop() ?? "";
  const config = (module === "hostel" ? HOSTEL_SECTIONS : MESS_SECTIONS)[section];

  if (!config) notFound();

  return <AdminModuleOverviewPage title={config.title} description={config.description} />;
}
