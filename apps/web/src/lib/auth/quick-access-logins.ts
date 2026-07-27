/**
 * Real portal credentials for login-page Quick Access buttons.
 * These call the normal /api/portal/auth/login path (not mock sessions).
 */
export type QuickAccessRole = "admin" | "teacher" | "student";

export type QuickAccessLogin = {
  identifier: string;
  password: string;
  prefer: "staff" | "student";
  label: string;
};

const CHERUKUPALLI: Record<QuickAccessRole, QuickAccessLogin> = {
  admin: {
    identifier: "k0ush9k",
    password: "koushik123",
    prefer: "staff",
    label: "Branch Admin",
  },
  teacher: {
    identifier: "ashoka",
    password: "ashoka",
    prefer: "staff",
    label: "Teacher",
  },
  student: {
    identifier: "1250",
    password: "421081",
    prefer: "student",
    label: "Student",
  },
};

/** Kalaburagi placeholders — update when branch accounts are provisioned. */
const KALABURAGI: Record<QuickAccessRole, QuickAccessLogin | null> = {
  admin: null,
  teacher: null,
  student: null,
};

export function getQuickAccessLogin(
  schoolId: "idpscherukupalli" | "idpskalaburagi",
  role: QuickAccessRole
): QuickAccessLogin | null {
  if (schoolId === "idpscherukupalli") return CHERUKUPALLI[role];
  return KALABURAGI[role];
}
