import { ADMIN_PORTAL_ROLES } from "@/lib/auth/roles";

/** Roles allowed through the admin portal layout ProtectedRoute. */
export const ADMIN_LAYOUT_ALLOWED_ROLES = ADMIN_PORTAL_ROLES.map((r) =>
  r === "super_admin" ? "super_admin" : r
);
