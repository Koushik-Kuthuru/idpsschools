"use client";

import { useRouteParam } from "@/hooks/useRouteParams";
import AdminClassDetailPage from "@/components/admin/AdminClassDetailPage";

export default function ClassDetailRoute({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const grade = useRouteParam(params, "grade");
  return <AdminClassDetailPage grade={grade} />;
}
