"use client";

import { useRouteParam } from "@/hooks/useRouteParams";
import AdminSectionDetailPage from "@/components/admin/AdminSectionDetailPage";

export default function SectionDetailRoute({
  params,
}: {
  params: Promise<{ grade: string; section: string }>;
}) {
  const grade = useRouteParam(params, "grade");
  const section = useRouteParam(params, "section");
  return <AdminSectionDetailPage grade={grade} section={section} />;
}
