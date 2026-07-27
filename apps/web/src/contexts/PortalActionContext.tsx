"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useStaffPortalPermissions } from "@/hooks/useStaffPortalPermissions";
import {
  hasPageAction,
  resolveWebModuleLabelForPath,
  type StaffPermissionContext,
} from "@/lib/resolveStaffPortalPermissions";
import type { PermissionAction } from "@/lib/portalPermissionsStore";

type PortalActionContextValue = {
  loading: boolean;
  fullAccess: boolean;
  portalEnabled: boolean;
  moduleLabel: string | null;
  can: (action: PermissionAction) => boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canExport: boolean;
  canDelete: boolean;
  canApprove: boolean;
};

const PortalActionContext = createContext<PortalActionContextValue | null>(null);

const ALLOW_WITHOUT_MODULE: PermissionAction[] = ["view"];

export function PortalActionProvider({
  schoolId,
  portal,
  children,
}: {
  schoolId: string;
  portal: "admin" | "teacher";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const permissions = useStaffPortalPermissions(schoolId);

  const moduleLabel = useMemo(
    () => resolveWebModuleLabelForPath(pathname, schoolId, portal),
    [pathname, schoolId, portal]
  );

  const can = useCallback(
    (action: PermissionAction) => {
      if (permissions.fullAccess) return true;
      if (permissions.loading) return false;
      if (!permissions.portalEnabled) {
        return action === "view" && moduleLabel === "Dashboard";
      }
      if (!moduleLabel) {
        return ALLOW_WITHOUT_MODULE.includes(action);
      }
      return hasPageAction(permissions, moduleLabel, action);
    },
    [permissions, moduleLabel]
  );

  const value = useMemo<PortalActionContextValue>(
    () => ({
      loading: permissions.loading,
      fullAccess: permissions.fullAccess,
      portalEnabled: permissions.portalEnabled,
      moduleLabel,
      can,
      canView: can("view"),
      canCreate: can("create"),
      canEdit: can("edit"),
      canExport: can("export"),
      canDelete: can("delete"),
      canApprove: can("approve"),
    }),
    [permissions, moduleLabel, can]
  );

  return <PortalActionContext.Provider value={value}>{children}</PortalActionContext.Provider>;
}

export function usePortalActions() {
  const context = useContext(PortalActionContext);
  if (!context) {
    return {
      loading: false,
      fullAccess: true,
      portalEnabled: true,
      moduleLabel: null,
      can: () => true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canExport: true,
      canDelete: true,
      canApprove: true,
    };
  }
  return context;
}

export function PortalActionGate({
  action,
  children,
  fallback = null,
}: {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, loading } = usePortalActions();
  if (loading) return null;
  if (!can(action)) return <>{fallback}</>;
  return <>{children}</>;
}

function applyDomActionVisibility(
  schoolId: string,
  portal: "admin" | "teacher",
  permissions: StaffPermissionContext
) {
  if (permissions.fullAccess) return;

  const roots = document.querySelectorAll("main.erp-portal");
  roots.forEach((root) => {
    root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href") ?? "";
      if (!href.includes("/new") && !href.includes("/edit")) return;

      const label = resolveWebModuleLabelForPath(href, schoolId, portal);
      const action: PermissionAction = href.includes("/new") ? "create" : "edit";
      const allowed = label ? hasPageAction(permissions, label, action) : false;
      anchor.style.display = allowed ? "" : "none";
      anchor.setAttribute("aria-hidden", allowed ? "false" : "true");
    });

    root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      const text = button.textContent?.trim().toLowerCase() ?? "";
      if (!text) return;
      const isSave =
        text === "save" ||
        text.startsWith("save ") ||
        text.includes("save changes") ||
        text.includes("save updates") ||
        text.includes("publish");
      if (!isSave) return;

      const label = resolveWebModuleLabelForPath(window.location.pathname, schoolId, portal);
      const allowed = label ? hasPageAction(permissions, label, "edit") : false;
      button.style.display = allowed ? "" : "none";
      button.disabled = !allowed;
    });
  });
}

export function PortalDomActionEnforcer({
  schoolId,
  portal,
}: {
  schoolId: string;
  portal: "admin" | "teacher";
}) {
  const pathname = usePathname();
  const permissions = useStaffPortalPermissions(schoolId);

  useEffect(() => {
    if (permissions.loading) return;

    applyDomActionVisibility(schoolId, portal, permissions);

    const observer = new MutationObserver(() => {
      applyDomActionVisibility(schoolId, portal, permissions);
    });

    document.querySelectorAll("main.erp-portal").forEach((root) => {
      observer.observe(root, { childList: true, subtree: true });
    });

    return () => observer.disconnect();
  }, [pathname, permissions, schoolId, portal]);

  return null;
}
