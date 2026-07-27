import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadStudentProfileData } from "@/lib/studentProfileStore";
import { loadStaffProfileData } from "@/lib/loadBranchStaff";
import { looksLikeStaffIdentifier, resolvePortalAccount } from "@/lib/auth/portal-credentials";
import {
  demoStaffPasswordAccepted,
  isDemoStaffIdentifier,
  resolveDemoStaffAccount,
} from "@/lib/auth/demo-staff-logins";
import { autoProvisionAndSignIn } from "@/lib/auth/provision";
import { staffPortalPasswordAccepted } from "@/lib/auth/staff-password";
import { appendPortalSessionCookies } from "@/lib/auth/portalSessionCookies";
import {
  normalizePortalAuthPassword,
  portalAuthPasswordCandidates,
} from "@/lib/auth/portal-password";
import { displayAdmissionNo } from "@/lib/admissionNo";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 20;
const attempts = new Map<string, { failures: number; resetAt: number }>();

function clientKey(req: Request, identifier: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `${ip}:${identifier.trim().toLowerCase()}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) return false;
  return entry.failures >= LOGIN_MAX_FAILURES;
}

function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { failures: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.failures += 1;
}

function clearLoginFailures(key: string): void {
  attempts.delete(key);
}

function passwordMatchesAny(entered: string, candidates: string[]): boolean {
  const enteredTrim = String(entered ?? "").trim();
  if (!enteredTrim) return false;
  const enteredSet = new Set(portalAuthPasswordCandidates(enteredTrim));
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (value === enteredTrim) return true;
    if (value.toLowerCase() === enteredTrim.toLowerCase()) return true;
    for (const alt of portalAuthPasswordCandidates(value)) {
      if (enteredSet.has(alt)) return true;
    }
    // Short AccEvate passwords are padded to 6 chars for Supabase Auth.
    if (normalizePortalAuthPassword(value) === normalizePortalAuthPassword(enteredTrim)) {
      return true;
    }
  }
  return false;
}

function studentPasswordAccepted(params: {
  entered: string;
  profilePassword: string;
  admissionNo?: string;
  username?: string;
}): boolean {
  const entered = String(params.entered ?? "").trim();
  if (!entered) return false;

  const profilePassword = String(params.profilePassword ?? "").trim();
  // No stored portal password yet — accept what they typed (provision will set Auth).
  if (!profilePassword) return true;

  const admissionNo = displayAdmissionNo(params.admissionNo ?? "") || String(params.admissionNo ?? "").trim();
  const username = String(params.username ?? "").trim().replace(/^std_/i, "");

  return passwordMatchesAny(entered, [profilePassword, admissionNo, username].filter(Boolean));
}

async function loadProfilePassword(
  account: NonNullable<Awaited<ReturnType<typeof resolvePortalAccount>>>
): Promise<{ password: string; passwordHash: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const branchId = await resolveBranchUuid(supabaseAdmin, account.schoolSlug);
  if (!branchId) return { password: "", passwordHash: "" };

  if (account.kind === "student") {
    const profile = await loadStudentProfileData(supabaseAdmin, branchId, account.recordId);
    return {
      password: String(profile.portalPassword ?? "").trim(),
      passwordHash: "",
    };
  }

  const profile = await loadStaffProfileData(supabaseAdmin, branchId, account.recordId);
  const yearProfiles = Object.values(profile.years ?? {}).reverse();
  const yearPassword = yearProfiles.find((year) => year?.portalPassword)?.portalPassword;
  const yearPasswordHash = yearProfiles.find((year) => year?.portalPasswordHash)?.portalPasswordHash;
  return {
    password: String(profile.portalPassword ?? yearPassword ?? profile.password ?? "").trim(),
    passwordHash: String(profile.portalPasswordHash ?? yearPasswordHash ?? "").trim(),
  };
}

/** Staff may use the employee ID only until they set a custom password. */
async function staffPasswordAccepted(
  entered: string,
  profilePassword: string,
  profilePasswordHash: string,
  account: NonNullable<Awaited<ReturnType<typeof resolvePortalAccount>>>
): Promise<boolean> {
  return staffPortalPasswordAccepted({
    entered,
    profilePassword,
    profilePasswordHash,
    usernameOrEmployeeId: String(account.username ?? account.recordId ?? ""),
  });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json().catch(() => ({}));
    const identifier = String(body.identifier ?? body.email ?? body.username ?? "").trim();
    const password = String(body.password ?? "");
    const schoolSlug = body.schoolId ? String(body.schoolId).trim() : null;
    const prefer =
      body.prefer === "staff"
        ? "staff"
        : body.prefer === "student"
          ? "student"
          : looksLikeStaffIdentifier(identifier)
            ? "staff"
            : undefined;
    const rememberMe = body.rememberMe !== false && body.rememberMe !== "false" && body.rememberMe !== 0;

    if (!identifier || !password) {
      return Response.json({ error: "Invalid login credentials", code: "missing_fields" }, { status: 401 });
    }

    const rateKey = clientKey(req, identifier);
    if (isRateLimited(rateKey)) {
      return Response.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const account = await resolvePortalAccount(supabaseAdmin, identifier, {
      schoolSlug,
      prefer,
    }).then(
      (resolved) =>
        resolved ??
        (prefer === "staff" || isDemoStaffIdentifier(identifier)
          ? resolveDemoStaffAccount(identifier, schoolSlug)
          : null)
    );

    if (!account) {
      recordFailedLogin(rateKey);
      return Response.json(
        {
          error: "Invalid login credentials",
          code: "account_not_found",
          ...(process.env.NODE_ENV !== "production"
            ? {
                detail: `No portal account matched "${identifier}"${schoolSlug ? ` in ${schoolSlug}` : ""}.`,
              }
            : {}),
        },
        { status: 401 }
      );
    }

    const isDemoStaff = isDemoStaffIdentifier(identifier) && account.kind === "staff";
    const credentials = isDemoStaff
      ? { password: identifier.trim().toUpperCase(), passwordHash: "" }
      : await loadProfilePassword(account);

    if (
      account.kind === "staff" &&
      !isDemoStaff &&
      !(await staffPasswordAccepted(
        password,
        credentials.password,
        credentials.passwordHash,
        account
      ))
    ) {
      recordFailedLogin(rateKey);
      return Response.json(
        {
          error: "Invalid login credentials",
          code: "bad_password",
          ...(process.env.NODE_ENV !== "production"
            ? { detail: "Staff password did not match portal password / employee ID default." }
            : {}),
        },
        { status: 401 }
      );
    }

    if (isDemoStaff && !demoStaffPasswordAccepted(identifier, password)) {
      recordFailedLogin(rateKey);
      return Response.json({ error: "Invalid login credentials", code: "bad_password" }, { status: 401 });
    }

    if (
      account.kind === "student" &&
      !studentPasswordAccepted({
        entered: password,
        profilePassword: credentials.password,
        admissionNo: account.username,
        username: account.username,
      })
    ) {
      recordFailedLogin(rateKey);
      return Response.json(
        {
          error: "Invalid login credentials",
          code: "bad_password",
          ...(process.env.NODE_ENV !== "production"
            ? { detail: "Student portal password did not match." }
            : {}),
        },
        { status: 401 }
      );
    }

    try {
      const enteredPassword = password.trim();
      const storedPassword = credentials.password.trim();
      const matchedStoredPassword =
        account.kind !== "student" ||
        !storedPassword ||
        passwordMatchesAny(enteredPassword, [storedPassword]);
      // If they logged in with admission/username fallback, sync Auth to the stored portal password.
      const signInPassword =
        account.kind === "student" && storedPassword && !matchedStoredPassword
          ? storedPassword
          : enteredPassword;

      const session = await autoProvisionAndSignIn({
        admin: supabaseAdmin,
        identifier,
        password: signInPassword,
        account,
        // Stored profile password (may differ by whitespace from what the user typed).
        // autoProvisionAndSignIn retries Auth with both and re-syncs when they match loosely.
        profilePassword: isDemoStaff ? password : storedPassword || signInPassword,
      });

      clearLoginFailures(rateKey);

      return appendPortalSessionCookies(
        Response.json({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
          rememberMe,
          role: account.role,
          schoolId: account.schoolSlug,
          displayName: account.displayName,
          designation: account.roleTitle ?? account.role,
          department: account.department,
          employeeId: account.kind === "staff" ? account.username : undefined,
          user: session.user,
        }),
        session.access_token,
        session.refresh_token,
        { rememberMe }
      );
    } catch (signInErr) {
      recordFailedLogin(rateKey);
      const message = signInErr instanceof Error ? signInErr.message : "Sign-in failed";
      if (process.env.NODE_ENV !== "production") {
        console.error("portal login sign-in/provision failed:", signInErr);
      }
      return Response.json(
        {
          error:
            message.toLowerCase().includes("invalid login") ||
            message.toLowerCase().includes("invalid email or password")
              ? "Invalid login credentials"
              : process.env.NODE_ENV === "production"
                ? "Invalid login credentials"
                : message,
          code: "signin_failed",
          ...(process.env.NODE_ENV !== "production" ? { detail: message } : {}),
        },
        { status: 401 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    if (process.env.NODE_ENV !== "production") {
      console.error("portal login failed:", err);
    }
    // Surface provisioning / auth backend errors; keep credential guesses opaque.
    const lower = message.toLowerCase();
    if (
      lower.includes("invalid login") ||
      lower.includes("invalid_credentials") ||
      lower.includes("invalid email or password")
    ) {
      return Response.json({ error: "Invalid login credentials" }, { status: 401 });
    }
    return Response.json(
      { error: process.env.NODE_ENV === "production" ? "Invalid login credentials" : message },
      { status: 401 }
    );
  }
}
