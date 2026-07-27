export const maxDuration = 60;
import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { currentAcademicYearName } from "@/lib/portalMobileData";
import {
  assertLeadershipAccess,
  loadBranchLeaveRequests,
  loadLeadershipAcademicDirectorDashboard,
  loadLeadershipAcademicManagerDashboard,
  loadLeadershipAcademicPerformance,
  loadLeadershipAnnouncements,
  loadLeadershipAttendance,
  loadLeadershipDashboard,
  loadLeadershipDepartments,
  loadLeadershipExams,
  loadLeadershipFinance,
  loadLeadershipNotifications,
  loadLeadershipProfile,
  loadLeadershipStaff,
  loadLeadershipVpDashboard,
  mapLeadershipLeaves,
  updateBranchLeaveStatus,
} from "@/lib/portalLeadershipData";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const { allowed } = await assertLeadershipAccess(ctx.supabaseAdmin, {
    schoolSlug,
    authId: user.authId,
    email: user.email,
    role: user.role,
  });
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "dashboard";
  const academicYear =
    url.searchParams.get("academicYear") ??
    (await currentAcademicYearName(ctx.supabaseAdmin, schoolSlug));
  const date = url.searchParams.get("date");

  try {
    if (resource === "dashboard") {
      const dashboard = await loadLeadershipDashboard(ctx.supabaseAdmin, schoolSlug, academicYear);
      return Response.json({ dashboard });
    }

    if (resource === "vp-dashboard") {
      const vpDashboard = await loadLeadershipVpDashboard(ctx.supabaseAdmin, schoolSlug, academicYear);
      return Response.json(vpDashboard);
    }

    if (resource === "academic-director-dashboard") {
      const data = await loadLeadershipAcademicDirectorDashboard(
        ctx.supabaseAdmin,
        schoolSlug,
        academicYear
      );
      return Response.json(data);
    }

    if (resource === "academic-manager-dashboard") {
      const data = await loadLeadershipAcademicManagerDashboard(
        ctx.supabaseAdmin,
        schoolSlug,
        academicYear
      );
      return Response.json(data);
    }

    if (resource === "staff") {
      const staff = await loadLeadershipStaff(ctx.supabaseAdmin, schoolSlug, academicYear);
      return Response.json(staff);
    }

    if (resource === "leaves") {
      const [rows, staffBundle] = await Promise.all([
        loadBranchLeaveRequests(ctx.supabaseAdmin, schoolSlug),
        loadLeadershipStaff(ctx.supabaseAdmin, schoolSlug, academicYear),
      ]);
      const staffDeptByEmployee = new Map(
        staffBundle.staffMembers.map((row) => [row.empId, String(row.department)])
      );
      const staffPhotoByEmployee = new Map(
        staffBundle.staffMembers
          .filter((row) => row.photoUrl)
          .map((row) => [row.empId, String(row.photoUrl)])
      );
      // Also match by staff display name when employee id is missing on leave rows.
      for (const member of staffBundle.staffMembers) {
        if (!member.photoUrl) continue;
        staffPhotoByEmployee.set(member.name, String(member.photoUrl));
      }
      return Response.json({
        leaves: mapLeadershipLeaves(rows, staffDeptByEmployee, staffPhotoByEmployee).map((leave) => ({
          ...leave,
          photoUrl:
            leave.photoUrl ||
            (leave.empId ? staffPhotoByEmployee.get(leave.empId) : "") ||
            staffPhotoByEmployee.get(leave.name) ||
            "",
        })),
      });
    }

    if (resource === "attendance") {
      const attendance = await loadLeadershipAttendance(
        ctx.supabaseAdmin,
        schoolSlug,
        academicYear,
        date
      );
      return Response.json(attendance);
    }

    if (resource === "announcements") {
      const announcements = await loadLeadershipAnnouncements(ctx.supabaseAdmin, schoolSlug);
      return Response.json({ announcements });
    }

    if (resource === "exams") {
      const exams = await loadLeadershipExams(ctx.supabaseAdmin, schoolSlug);
      return Response.json(exams);
    }

    if (resource === "academic-performance") {
      const term = url.searchParams.get("term");
      const performance = await loadLeadershipAcademicPerformance(
        ctx.supabaseAdmin,
        schoolSlug,
        academicYear,
        term
      );
      return Response.json(performance);
    }

    if (resource === "finance") {
      const finance = await loadLeadershipFinance(ctx.supabaseAdmin, schoolSlug, academicYear);
      return Response.json(finance);
    }

    if (resource === "departments") {
      const departments = await loadLeadershipDepartments(ctx.supabaseAdmin, schoolSlug);
      return Response.json(departments);
    }

    if (resource === "notifications") {
      const notifications = await loadLeadershipNotifications(ctx.supabaseAdmin, schoolSlug);
      return Response.json(notifications);
    }

    if (resource === "profile") {
      const profile = await loadLeadershipProfile(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
      });
      if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });
      return Response.json({ profile });
    }

    return Response.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    console.error("portal/leadership/data GET", err);
    const message = err instanceof Error ? err.message : "Failed to load leadership data";
    return Response.json({ error: message }, { status: 500 });
  }
});

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const { allowed } = await assertLeadershipAccess(ctx.supabaseAdmin, {
    schoolSlug,
    authId: user.authId,
    email: user.email,
    role: user.role,
  });
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "";
  const body = await req.json().catch(() => ({}));

  try {
    if (resource === "leaves") {
      const leaveId = String(body.leaveId ?? body.id ?? "").trim();
      const status = String(body.status ?? "").trim().toLowerCase();
      if (!leaveId) return Response.json({ error: "leaveId required" }, { status: 400 });
      if (status !== "approved" && status !== "rejected") {
        return Response.json({ error: "status must be approved or rejected" }, { status: 400 });
      }
      const leave = await updateBranchLeaveStatus(ctx.supabaseAdmin, leaveId, status);
      return Response.json({ leave });
    }

    return Response.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    console.error("portal/leadership/data POST", err);
    const message = err instanceof Error ? err.message : "Failed to update leadership data";
    return Response.json({ error: message }, { status: 500 });
  }
});
