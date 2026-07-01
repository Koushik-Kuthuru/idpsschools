"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSchoolId } from "@/hooks/useSchoolId";

export default function DepositFeePage() {
  const router = useRouter();
  const schoolId = useSchoolId();

  useEffect(() => {
    router.replace(`/schools/${schoolId}/admin/finance/fees?tab=pay-fee`);
  }, [router, schoolId]);

  return null;
}
