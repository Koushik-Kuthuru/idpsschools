"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStaffPortalPermissions } from "@/hooks/useStaffPortalPermissions";
import {
  canAccessAdminPath,
  canAccessTeacherPath,
} from "@/lib/resolveStaffPortalPermissions";
import { SkeletonPage, SkeletonPortalDashboard } from "@/components/ui/Skeleton";

type PortalPermissionGuardProps = {
  schoolId: string;
  portal: "admin" | "teacher";
  children: React.ReactNode;
};

export default function PortalPermissionGuard({
  schoolId,
  portal,
  children,
}: PortalPermissionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = useStaffPortalPermissions(schoolId);

  useEffect(() => {
    if (permissions.loading || permissions.fullAccess) return;

    const home =
      portal === "admin"
        ? `/schools/${schoolId}/admin`
        : `/schools/${schoolId}/teachers`;

    const allowed =
      portal === "admin"
        ? canAccessAdminPath(pathname, schoolId, permissions)
        : canAccessTeacherPath(pathname, schoolId, permissions);

    if (!allowed) {
      router.replace(home);
    }
  }, [pathname, permissions, portal, router, schoolId]);

  if (permissions.loading) {
    return portal === "teacher" ? <SkeletonPortalDashboard /> : <SkeletonPage stats={4} rows={6} />;
  }

  return <>{children}</>;
}
