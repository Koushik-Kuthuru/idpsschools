export function isAdminStandaloneRoute(pathname: string | null): boolean {
  return false;
}

const ADMIN_SETTINGS_ROUTE = /\/admin\/.*settings(?:\/|$)/;
const ADMIN_STUDENT_PROFILE_ROUTE = /\/admin\/academic\/students\/[^/]+\/profile(?:\/|$)/;

/** Routes where the admin sidebar should start collapsed (more horizontal space). */
export function isAdminSidebarCollapsedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return ADMIN_SETTINGS_ROUTE.test(pathname) || ADMIN_STUDENT_PROFILE_ROUTE.test(pathname);
}
