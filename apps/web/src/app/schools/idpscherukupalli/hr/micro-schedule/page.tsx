"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSchoolId } from "@/hooks/useSchoolId";

/** Legacy HR route — Micro Schedule now lives under Academic → Timetable. */
export default function HrMicroSchedulePage() {
  const schoolId = useSchoolId();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/schools/${schoolId}/admin/academic/timetable?tab=micro`);
  }, [router, schoolId]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-gray-500">
      Opening Micro Schedule in Timetable…
    </div>
  );
}
