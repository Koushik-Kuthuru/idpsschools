"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/auth/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g., ["super_admin", "admin"]
  requiredSchoolId?: string; // Optional: restrict to a specific school
}

export default function ProtectedRoute({ children, allowedRoles, requiredSchoolId }: ProtectedRouteProps) {
  const { user, role, schoolId, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // 1. Not logged in
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Role Check
    if (allowedRoles && role && !allowedRoles.includes(role)) {
      console.warn(`Unauthorized: User role '${role}' not in allowed roles:`, allowedRoles);
      redirectToDashboard(role, schoolId, router);
      return;
    }

    // 3. School ID Check (if specific school is required)
    if (requiredSchoolId && role !== "super_admin" && schoolId !== requiredSchoolId) {
      console.warn(`Unauthorized: User school '${schoolId}' does not match required '${requiredSchoolId}'`);
      redirectToDashboard(role, schoolId, router);
      return;
    }

  }, [user, role, schoolId, loading, allowedRoles, requiredSchoolId, router, pathname]);

  if (loading && !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#144835]/30 border-t-[#144835] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If role/school checks fail, we don't render children while redirecting
  if (allowedRoles && role && !allowedRoles.includes(role)) return null;
  if (requiredSchoolId && role !== "super_admin" && schoolId !== requiredSchoolId) return null;

  return <>{children}</>;
}

function redirectToDashboard(role: string | null, schoolId: string | null, router: { push: (path: string) => void }) {
  router.push(getRoleHomePath(role, schoolId));
}
