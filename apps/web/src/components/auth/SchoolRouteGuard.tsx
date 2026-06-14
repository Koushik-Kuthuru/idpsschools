"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isValidSchoolId } from "@/lib/schools";

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
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
