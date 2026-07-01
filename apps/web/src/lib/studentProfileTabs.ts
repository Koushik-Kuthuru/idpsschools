/** Map short ?tab= URL values to full profile tab labels. */
const STUDENT_PROFILE_TAB_ALIASES: Record<string, string> = {
  Transport: "Transport Details",
  Fee: "Fee Details",
  Fees: "Fee Details",
  Basic: "Basic Details",
  Certificate: "Certificate Details",
  Activity: "Activity Log",
};

export function resolveStudentProfileTab(tabParam: string | null | undefined): string {
  if (!tabParam?.trim()) return "Basic Details";
  const decoded = decodeURIComponent(tabParam.trim());
  return STUDENT_PROFILE_TAB_ALIASES[decoded] ?? decoded;
}
