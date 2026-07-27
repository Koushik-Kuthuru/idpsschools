"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isValidSchoolId } from "@/lib/schools";
import { SkeletonAppShell } from "@/components/ui/Skeleton";

export default function SchoolRouteGuard({
  schoolId,
  children,
}: {
  schoolId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isValidSchoolId(schoolId)) {
      router.replace("/schools");
    }
  }, [schoolId, router]);

  if (!isValidSchoolId(schoolId)) {
    return <SkeletonAppShell />;
  }

  return <>{children}</>;
}
