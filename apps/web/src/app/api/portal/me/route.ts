import { getSchoolSlugFromCode } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveStaffSessionForPortal } from "@/lib/auth/resolve-staff-session";
import { resolvePortalAuthUser } from "@/lib/auth/resolvePortalAuthUser";
import {
  appendPortalSessionCookies,
  extractPortalRememberMe,
} from "@/lib/auth/portalSessionCookies";
import { loadStudentDetailForAuth } from "@/lib/portalMobileData";
import type { UserRole } from "@/lib/auth/roles";

export async function GET(req: Request) {
  const resolved = await resolvePortalAuthUser(req);
  if (!resolved) {
    return Response.json(
      { message: "Invalid credentials", code: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }

  const authId = resolved.user.id;
  const email = resolved.user.email ?? null;
  const authMetadata = (resolved.user.user_metadata ?? {}) as Record<string, unknown>;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authId)
    .maybeSingle();

  const usersTableMissing =
    profileError?.code === "PGRST205" ||
    String(profileError?.message ?? "").includes("Could not find the table");

  if (profileError && !usersTableMissing) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const metaRole = String(authMetadata.role ?? "").trim() || null;
  const metaSchoolSlug = String(authMetadata.school_id ?? "").trim() || null;
  const metaName = String(authMetadata.full_name ?? "").trim() || null;
  const metaEmployeeId = String(authMetadata.employee_id ?? "").trim() || null;
  const metaDesignation = String(authMetadata.designation ?? "").trim() || null;
  const metaDepartment = String(authMetadata.department ?? "").trim() || null;

  let schoolSlug: string | null = null;
  if (profile?.school_id) {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("code")
      .eq("id", profile.school_id)
      .single();
    schoolSlug = school?.code ? getSchoolSlugFromCode(school.code) : null;
  } else if (metaSchoolSlug) {
    schoolSlug = metaSchoolSlug;
  }

  const baseUser = {
    uid: authId,
    email: email || profile?.email || null,
    displayName: profile?.full_name || metaName || null,
    photoURL: profile?.avatar_url || null,
    phone: profile?.phone || undefined,
  };

  let role = (profile?.role ?? metaRole) as UserRole | string | null;
  let staffSession: Awaited<ReturnType<typeof resolveStaffSessionForPortal>> = null;

  if (schoolSlug && role !== "student" && role !== "super_admin") {
    staffSession = await resolveStaffSessionForPortal({
      admin: supabaseAdmin,
      authId,
      email,
      schoolSlug,
      employeeIdMeta: metaEmployeeId,
    });
    if (staffSession) {
      role = staffSession.role;
    }
  }

  let enrollment: Awaited<ReturnType<typeof loadStudentEnrollment>> = null;
  if ((role === "student" || metaRole === "student") && schoolSlug) {
    enrollment = await loadStudentEnrollment(schoolSlug, authId, email);
  }

  let staff: {
    designation?: string;
    department?: string;
    qualification?: string;
    joinedDate?: string;
    experienceYears?: number | null;
    status?: string;
  } | null = null;
  if (staffSession) {
    staff = {
      designation: staffSession.designation,
      department: staffSession.department,
    };
    if (profile?.school_id) {
      const { data: staffProfile } = await supabaseAdmin
        .from("staff_profiles")
        .select("qualification, date_of_joining, experience_years, status")
        .eq("user_id", authId)
        .eq("school_id", profile.school_id)
        .maybeSingle();
      if (staffProfile) {
        staff = {
          ...staff,
          qualification: staffProfile.qualification ?? undefined,
          joinedDate: staffProfile.date_of_joining
            ? new Date(String(staffProfile.date_of_joining)).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : undefined,
          experienceYears:
            typeof staffProfile.experience_years === "number" ? staffProfile.experience_years : null,
          status: staffProfile.status ?? undefined,
        };
      }
    }
  } else if (role === "teacher" && profile?.school_id) {
    const { data } = await supabaseAdmin
      .from("staff_profiles")
      .select("designation, department, qualification, date_of_joining, experience_years, status")
      .eq("user_id", authId)
      .eq("school_id", profile.school_id)
      .maybeSingle();
    staff = data
      ? {
          designation: data.designation ?? undefined,
          department: data.department ?? undefined,
          qualification: data.qualification ?? undefined,
          joinedDate: data.date_of_joining
            ? new Date(String(data.date_of_joining)).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : undefined,
          experienceYears:
            typeof data.experience_years === "number" ? data.experience_years : null,
          status: data.status ?? undefined,
        }
      : null;
  }

  const body = {
    user: {
      ...baseUser,
      displayName: baseUser.displayName || staffSession?.displayName || null,
      ...(enrollment ?? {}),
      designation: staff?.designation ?? metaDesignation ?? undefined,
      department: staff?.department ?? metaDepartment ?? undefined,
      employeeId: staffSession?.employeeId ?? metaEmployeeId ?? undefined,
      qualification: staff?.qualification,
      joinedDate: staff?.joinedDate,
      experienceYears: staff?.experienceYears,
      status: staff?.status,
    },
    role,
    schoolId: schoolSlug,
  };

  let response = Response.json(body);
  if (resolved.refreshed && resolved.refreshToken) {
    response = appendPortalSessionCookies(response, resolved.accessToken, resolved.refreshToken, {
      rememberMe: extractPortalRememberMe(req),
    });
  }
  return response;
}

async function loadStudentEnrollment(
  schoolSlug: string,
  authId: string,
  email: string | null
) {
  const detail = await loadStudentDetailForAuth(supabaseAdmin, {
    schoolSlug,
    authId,
    email,
  });
  if (!detail) return null;

  const className = String(detail.className ?? detail.classId ?? detail.grade ?? "").trim();
  const section = String(detail.section ?? "").trim();
  const admissionNo = String(detail.admissionNo ?? detail.admission_number ?? "").trim();

  return {
    grade: className,
    section,
    className: className && section ? `${className}-${section}` : className || section,
    rollNumber: String(detail.rollNumber ?? admissionNo),
    academicYearName: String(detail.academicYear ?? ""),
  };
}
