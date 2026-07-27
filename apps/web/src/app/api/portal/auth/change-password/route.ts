import { createClient } from "@supabase/supabase-js";
import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { bridgeSupabaseEnv } from "@/lib/supabase/env";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { resolveStaffSessionContext } from "@/lib/auth/resolve-staff-session";
import { loadStaffProfileData, saveStaffProfileData } from "@/lib/loadBranchStaff";
import type { StaffProfileData, StaffYearProfile } from "@/lib/staffProfileStore";
import { hashPortalPassword } from "@/lib/auth/password-hash";
import { portalAuthPasswordCandidates } from "@/lib/auth/portal-password";
import { staffPortalPasswordAccepted } from "@/lib/auth/staff-password";

const MIN_PASSWORD_LENGTH = 8;

function withoutStoredPasswords(profile: StaffProfileData): StaffProfileData {
  const next: StaffProfileData = { ...profile };
  delete next.portalPassword;
  delete next.password;
  delete next.portalPasswordHash;

  if (profile.years) {
    next.years = Object.fromEntries(
      Object.entries(profile.years).map(([year, value]) => {
        const yearProfile: StaffYearProfile = { ...(value ?? {}) };
        delete yearProfile.portalPassword;
        delete yearProfile.password;
        delete yearProfile.portalPasswordHash;
        return [year, yearProfile];
      })
    );
  }

  return next;
}

function profilePasswordFields(profile: StaffProfileData): {
  password: string;
  passwordHash: string;
} {
  const yearProfiles = Object.values(profile.years ?? {}).reverse();
  const yearPassword = yearProfiles.find((year) => year?.portalPassword)?.portalPassword;
  const yearPasswordHash = yearProfiles.find((year) => year?.portalPasswordHash)?.portalPasswordHash;
  return {
    password: String(profile.portalPassword ?? yearPassword ?? profile.password ?? "").trim(),
    passwordHash: String(profile.portalPasswordHash ?? yearPasswordHash ?? "").trim(),
  };
}

async function currentPasswordIsValidViaAuth(email: string, password: string): Promise<boolean> {
  const env = bridgeSupabaseEnv();
  if (!env.url || !env.publishableKeys?.default) return false;

  const client = createClient(env.url, env.publishableKeys.default, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const candidate of portalAuthPasswordCandidates(password)) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: candidate });
    if (!error && data.user) {
      await client.auth.signOut();
      return true;
    }
  }
  return false;
}

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const authId = String(ctx.userClaims?.id ?? "").trim();
  const email = String(ctx.userClaims?.email ?? "").trim().toLowerCase();
  if (!authId || !email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "").trim();
  const schoolSlug = String(
    body.schoolId ?? new URL(req.url).searchParams.get("schoolId") ?? ""
  ).trim();

  if (!currentPassword || !newPassword || !schoolSlug) {
    return Response.json({ error: "Current password and new password are required" }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return Response.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (currentPassword.trim() === newPassword) {
    return Response.json({ error: "New password must be different from the current password" }, { status: 400 });
  }

  const staff = await resolveStaffSessionContext({
    admin: ctx.supabaseAdmin,
    authId,
    email,
    schoolSlug,
  });
  if (!staff) {
    return Response.json({ error: "Staff account could not be verified" }, { status: 403 });
  }

  const branchId = await resolveBranchUuid(ctx.supabaseAdmin, schoolSlug);
  if (!branchId) {
    return Response.json({ error: "School branch was not found" }, { status: 404 });
  }

  const originalProfile = await loadStaffProfileData(ctx.supabaseAdmin, branchId, staff.recordId);
  const credentials = profilePasswordFields(originalProfile);
  const profileOk = staffPortalPasswordAccepted({
    entered: currentPassword,
    profilePassword: credentials.password,
    profilePasswordHash: credentials.passwordHash,
    usernameOrEmployeeId: staff.employeeId,
  });
  const authOk = profileOk ? true : await currentPasswordIsValidViaAuth(email, currentPassword);
  if (!profileOk && !authOk) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const changedAt = new Date().toISOString();
  const nextProfile: StaffProfileData = {
    ...withoutStoredPasswords(originalProfile),
    portalPasswordHash: hashPortalPassword(newPassword),
    passwordChangedAt: changedAt,
    passwordChangedBy: staff.displayName,
  };

  await saveStaffProfileData(ctx.supabaseAdmin, branchId, staff.recordId, nextProfile);

  const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(authId, {
    password: newPassword,
  });
  if (authError) {
    await saveStaffProfileData(ctx.supabaseAdmin, branchId, staff.recordId, originalProfile).catch(
      () => undefined
    );
    return Response.json({ error: "Password could not be updated" }, { status: 500 });
  }

  const notification = {
    category: "Settings",
    description: `${staff.displayName} (${staff.employeeId}) changed their portal password.`,
    href: `/schools/${schoolSlug}/admin/hr/${
      staff.staffKind === "teaching" ? "teaching-staff" : "non-teaching-staff"
    }`,
    actorUserId: authId,
    actorName: staff.displayName,
    eventType: "staff_password_changed",
    createdAt: changedAt,
  };
  const { error: notificationError } = await ctx.supabaseAdmin.from("notices").insert({
    branch_id: branchId,
    title: `__admin_notification__:Staff password changed`,
    content: JSON.stringify(notification),
    target: "admin",
    posted_by: staff.displayName,
    posted_on: changedAt.slice(0, 10),
  });

  if (notificationError) {
    console.error("staff password change notification failed:", notificationError.message);
  }

  return Response.json({
    success: true,
    notificationCreated: !notificationError,
    passwordChangedAt: changedAt,
  });
});
