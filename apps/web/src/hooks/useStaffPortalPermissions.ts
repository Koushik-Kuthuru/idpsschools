"use client";

import { adminFetch } from "@/lib/adminApi";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchDepartments } from "@/hooks/useBranchDepartments";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { clientCacheKey } from "@/lib/clientCache";
import {
  resolveStaffPermissionContext,
  type StaffPermissionContext,
} from "@/lib/resolveStaffPortalPermissions";
import type { BranchPortalPermissions, DesignationPermissionConfig } from "@/lib/portalPermissionsStore";
import { effectiveToLegacyPages, deserializeEffective } from "@/lib/rbac/resolve";
import type { SerializedEffective } from "@/lib/rbac/resolve";

type RbacMePayload = {
  effective: SerializedEffective;
};

/**
 * Resolves staff portal permissions from enterprise RBAC (role defaults + overrides).
 * Sidebar pages and PortalActionGate use this — no separate page matrix needed.
 */
export function useStaffPortalPermissions(schoolId: string): StaffPermissionContext & {
  loading: boolean;
  storedPermissions: BranchPortalPermissions;
  rbacEffective: SerializedEffective | null;
} {
  const { user, role } = useAuth();
  const { departments, loading: departmentsLoading } = useBranchDepartments(schoolId, undefined, {
    lite: true,
  });

  const rbacQuery = useCachedQuery<RbacMePayload>({
    cacheKey: clientCacheKey("rbac-effective", schoolId, user?.uid ?? "anon"),
    enabled: Boolean(schoolId && user?.uid),
    fetcher: async () => {
      // Ensure roles exist, then load effective permissions
      await adminFetch("/api/admin/rbac/me", {
        method: "POST",
        body: JSON.stringify({ schoolId }),
      }).catch(() => null);
      const res = await adminFetch(`/api/admin/rbac/me?schoolId=${encodeURIComponent(schoolId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load RBAC permissions");
      return { effective: data.effective };
    },
  });

  const context = useMemo(() => {
    const base = resolveStaffPermissionContext({
      schoolId,
      role,
      designation: user?.designation,
      department: user?.department,
      departments,
      storedPermissions: {},
    });

    // Admins always full access
    if (role === "admin" || role === "super_admin") {
      return {
        fullAccess: true,
        portalEnabled: true,
        config: null,
        designationId: base.designationId,
      };
    }

    const rbac = rbacQuery.data?.effective;
    const dashboardOnly: DesignationPermissionConfig = {
      portalEnabled: true,
      pages: {
        "web:dashboard": { enabled: true, actions: ["view"] },
      },
    };

    if (!rbac) {
      return {
        fullAccess: false,
        portalEnabled: true,
        config: dashboardOnly,
        designationId: base.designationId,
      };
    }

    if (rbac.fullAccess) {
      return {
        fullAccess: true,
        portalEnabled: true,
        config: null,
        designationId: base.designationId,
      };
    }

    const pages = effectiveToLegacyPages(deserializeEffective(rbac));
    // Always allow dashboard view if they have any access or a role
    if (!pages["web:dashboard"] && (rbac.roleIds?.length || Object.keys(pages).length > 0)) {
      pages["web:dashboard"] = { enabled: true, actions: ["view"] };
    }

    const config: DesignationPermissionConfig = {
      portalEnabled: rbac.portalEnabled !== false,
      pages: Object.keys(pages).length ? pages : dashboardOnly.pages,
    };
    return {
      fullAccess: false,
      portalEnabled: config.portalEnabled,
      config,
      designationId: base.designationId,
    };
  }, [
    schoolId,
    role,
    user?.designation,
    user?.department,
    departments,
    rbacQuery.data?.effective,
  ]);

  return {
    ...context,
    loading: departmentsLoading || rbacQuery.loading,
    storedPermissions: {},
    rbacEffective: rbacQuery.data?.effective ?? null,
  };
}
