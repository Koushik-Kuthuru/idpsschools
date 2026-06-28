"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import StudentDashboard from "./StudentDashboard";

/** @deprecated Use StudentDashboard with schoolId prop */
export default function DashboardView() {
  const pathname = usePathname();
  const schoolId = useMemo(() => {
    const match = pathname.match(/^\/schools\/([^/]+)/);
    return match ? match[1] : "idpscherukupalli";
  }, [pathname]);

  return <StudentDashboard schoolId={schoolId} />;
}
