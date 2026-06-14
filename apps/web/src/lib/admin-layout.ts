export function isAdminStandaloneRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    /\/admin\/settings(?:\/|$)/.test(pathname) ||
    /\/admin\/profile\/settings(?:\/|$)/.test(pathname)
  );
}
