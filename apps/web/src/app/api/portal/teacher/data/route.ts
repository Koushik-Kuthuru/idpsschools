export const maxDuration = 60;
import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import {
  buildTeacherDashboard,
  currentAcademicYearName,
  loadBranchAnnouncements,
  loadBranchEvents,
  loadBranchTimetable,
  loadHomeworkForSchool,
  loadTeacherAttendanceHistory,
  loadTeacherAttendanceRoster,
  loadTeacherClasses,
  loadStaffOwnAttendance,
  loadStaffOwnPayroll,
  loadTeacherLeaveBalance,
  loadTeacherLeaves,
  loadTeacherNotifications,
  loadTeacherScopedStudents,
  loadTeacherStudentsPage,
  loadTeacherStudentDetail,
  resolveTeacherDisplayName,
  resolveTeacherTimetableName,
  saveTeacherAttendance,
} from "@/lib/portalMobileData";
import { classScopeKey, parseClassScopeKey } from "@/lib/teacherClassScope";
import { loadTeacherClassSubjects } from "@/lib/loadBranchTimetables";
import {
  computeTeacherTimetableSnapshot,
  parseClassFromSubject,
  subjectFromTeacherTimetableLabel,
  getWeekdayName,
  classKeysDueForAttendance,
} from "@/lib/teacherTimetableUtils";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "dashboard";
  const academicYear =
    url.searchParams.get("academicYear") ??
    (await currentAcademicYearName(ctx.supabaseAdmin, schoolSlug));

  try {
    if (resource === "dashboard") {
      const teacherName = await resolveTeacherTimetableName(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        academicYear
      );

      const settled = await Promise.allSettled([
        // Keep dashboard light: timetable + homework/announcements only.
        // Class roster/counts are fetched via resource=classes (includeStudents=0).
        loadHomeworkForSchool(ctx.supabaseAdmin, schoolSlug),
        loadBranchAnnouncements(ctx.supabaseAdmin, schoolSlug),
        loadBranchTimetable(ctx.supabaseAdmin, schoolSlug, teacherName, academicYear),
        loadBranchEvents(ctx.supabaseAdmin, schoolSlug),
      ]);

      const homework = settled[0].status === "fulfilled" ? settled[0].value : [];
      const announcements = settled[1].status === "fulfilled" ? settled[1].value : [];
      const timetablePeriods = settled[2].status === "fulfilled" ? settled[2].value : [];
      const events = settled[3].status === "fulfilled" ? settled[3].value : [];

      const loadErrors = settled
        .map((result, index) => {
          if (result.status !== "rejected") return null;
          const labels = ["homework", "announcements", "timetable", "events"] as const;
          return `${labels[index]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`;
        })
        .filter(Boolean);

      const timetableSnapshot = computeTeacherTimetableSnapshot(timetablePeriods);
      const today = new Date().toISOString().slice(0, 10);
      const upcomingExams = events.filter((row) => {
        const type = String(row.event_type ?? "").toLowerCase();
        const date = String(row.event_date ?? "").slice(0, 10);
        return type.includes("exam") && date >= today;
      }).length;

      const focusClassKey = timetableSnapshot.currentClassKey ?? null;
      let focusClass: { label: string; absentCount: number } | undefined;
      if (focusClassKey) {
        const parsed = parseClassScopeKey(focusClassKey);
        focusClass = {
          label:
            (parsed ? `${parsed.grade}-${parsed.section}` : timetableSnapshot.currentClassLabel) ?? "—",
          absentCount: 0,
        };
      }

      return Response.json({
        dashboard: buildTeacherDashboard({
          classes: [],
          homework,
          announcements,
          timetableSnapshot,
          focusClass,
          upcomingExams,
        }),
        warnings: loadErrors.length ? loadErrors : undefined,
      });
    }

    if (resource === "classes") {
      const includeStudents = url.searchParams.get("includeStudents") !== "0";
      const { resolveBranchUuid } = await import("@/lib/resolveBranchUuid");

      const teacherName = await resolveTeacherTimetableName(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        academicYear
      );

      const [classes, timetablePeriods, timetableClassSubjects] = await Promise.all([
        loadTeacherClasses(
          ctx.supabaseAdmin,
          schoolSlug,
          user.authId,
          user.email,
          user.role,
          academicYear,
          { includeStudents }
        ),
        loadBranchTimetable(ctx.supabaseAdmin, schoolSlug, teacherName, academicYear),
        loadTeacherClassSubjects(
          ctx.supabaseAdmin,
          schoolSlug,
          teacherName ?? "",
          academicYear
        ),
      ]);

      // Resolve teaching subjects for every class list (slim + full).
      // Slim loads previously skipped this and always fell back to "Homeroom".
      let subjectByClass = new Map<string, string>();
      let fallbackSubject = "";

      const normalizeClassLabel = (value: string) =>
        String(value ?? "")
          .replace(/^CLASS\s+/i, "")
          .trim()
          .toUpperCase();

      const isPlaceholderSubject = (value: string) =>
        !value.trim() || /^(homeroom|class teacher|general|academic|—|-)$/i.test(value.trim());

      const rememberSubject = (classLabel: string, subject: string) => {
        const key = normalizeClassLabel(classLabel);
        const label = String(subject ?? "").trim();
        if (!key || isPlaceholderSubject(label)) return;
        const existing = subjectByClass.get(key);
        if (!existing) {
          subjectByClass.set(key, label);
          return;
        }
        if (existing.toLowerCase() === label.toLowerCase()) return;
        const parts = new Set(
          existing
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        );
        parts.add(label);
        subjectByClass.set(key, Array.from(parts).join(", "));
      };

      for (const row of timetableClassSubjects) {
        for (const subject of row.subjects) {
          rememberSubject(`${row.grade}-${row.section}`, subject);
        }
      }

      {
        const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
        const { resolveStaffSessionContext } = await import("@/lib/auth/resolve-staff-session");
        const { loadStaffProfileData, teachingLoadsFromYearProfile } = await import("@/lib/loadBranchStaff");
        const { resolveStaffYearProfile } = await import("@/lib/staffProfileStore");
        const [teacherProfile, staffSession, branchId] = await Promise.all([
          loadTeacherProfileForPortal(
            ctx.supabaseAdmin,
            schoolSlug,
            user.authId,
            user.email,
            null,
            null,
            null,
            academicYear
          ),
          resolveStaffSessionContext({
            admin: ctx.supabaseAdmin,
            authId: user.authId,
            email: user.email,
            schoolSlug,
          }),
          resolveBranchUuid(ctx.supabaseAdmin, schoolSlug),
        ]);

        let teachingLoads = teacherProfile.teachingLoads;
        if (branchId && staffSession?.recordId && academicYear) {
          const staffProfile = await loadStaffProfileData(
            ctx.supabaseAdmin,
            branchId,
            staffSession.recordId
          );
          const yearProfile = resolveStaffYearProfile(staffProfile, academicYear) ?? {};
          const fromYear = teachingLoadsFromYearProfile(yearProfile);
          if (fromYear.length) {
            teachingLoads = fromYear.map((row) => ({
              classSection: row.classSection,
              subject: row.subject,
              isHomeroom: row.isHomeroom ?? false,
            }));
          }
        }

        for (const load of teachingLoads) {
          rememberSubject(String(load.classSection ?? ""), String(load.subject ?? ""));
        }

        for (const period of timetablePeriods) {
          if (period.isBreak) continue;
          const subjectName = String(period.subject_name ?? "").trim();
          if (!subjectName) continue;
          const parsed = parseClassFromSubject(subjectName);
          if (!parsed) continue;
          const subjectBase = subjectFromTeacherTimetableLabel(subjectName);
          if (!subjectBase) continue;
          rememberSubject(`${parsed.grade}-${parsed.section}`, subjectBase);
        }

        fallbackSubject =
          teachingLoads.find((row) => !isPlaceholderSubject(String(row.subject ?? "")))?.subject ||
          teacherProfile.teachingLoads.find((row) => !isPlaceholderSubject(String(row.subject ?? "")))
            ?.subject ||
          "";
      }

      const todayName = getWeekdayName();
      const periodByClass = new Map<string, string>();
      for (const period of timetablePeriods) {
        if (period.isBreak || period.day_of_week !== todayName) continue;
        const parsed = parseClassFromSubject(period.subject_name);
        if (!parsed) continue;
        const key = classScopeKey(parsed.grade, parsed.section);
        const label = [period.start_time, period.end_time].filter(Boolean).join(" - ");
        if (!periodByClass.has(key)) {
          periodByClass.set(key, label);
        }
      }

      // Pending only for classes whose timetable slot is due today (started / about to start).
      const dueTodayKeys = classKeysDueForAttendance(timetablePeriods);

      const fromTimetable: Array<{
        id: string;
        name: string;
        grade: string;
        section: string;
        studentCount: number;
        attendanceStatus: "pending" | "completed";
        students: Array<Record<string, unknown>>;
      }> = [];
      const seenTimetable = new Set<string>();
      for (const period of timetablePeriods) {
        if (period.isBreak) continue;
        const parsed = parseClassFromSubject(period.subject_name);
        if (!parsed) continue;
        const id = classScopeKey(parsed.grade, parsed.section);
        if (seenTimetable.has(id)) continue;
        seenTimetable.add(id);
        fromTimetable.push({
          id,
          name: `${parsed.grade}-${parsed.section}`,
          grade: parsed.grade,
          section: parsed.section,
          studentCount: 0,
          attendanceStatus: dueTodayKeys.has(id) ? "pending" : "completed",
          students: [],
        });
      }

      type ClassRow = {
        id: string;
        name: string;
        grade: string;
        section: string;
        studentCount: number;
        attendanceStatus: "pending" | "completed";
        students: Array<Record<string, unknown>>;
      };

      const classRows: ClassRow[] =
        classes.length > 0
          ? classes.map((row) => ({
              id: row.id,
              name: row.name,
              grade: row.grade,
              section: row.section,
              studentCount: row.studentCount,
              attendanceStatus:
                dueTodayKeys.has(row.id) && row.attendanceStatus !== "completed"
                  ? "pending"
                  : dueTodayKeys.has(row.id)
                    ? row.attendanceStatus
                    : "completed",
              students: (row.students ?? []) as Array<Record<string, unknown>>,
            }))
          : fromTimetable;

      if (classes.length > 0 && fromTimetable.length > 0) {
        const existing = new Set(classRows.map((row) => row.id));
        for (const row of fromTimetable) {
          if (!existing.has(row.id)) {
            classRows.push(row);
          }
        }
      }

      return Response.json({
        classes: classRows.map((row) => {
          const due = dueTodayKeys.has(row.id);
          const attendanceStatus: "pending" | "completed" =
            due && row.attendanceStatus !== "completed" ? "pending" : "completed";
          const rawSubject =
            subjectByClass.get(normalizeClassLabel(row.name)) ||
            subjectByClass.get(normalizeClassLabel(`${row.grade}-${row.section}`)) ||
            fallbackSubject ||
            "";
          const resolvedSubject = String(rawSubject)
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              if (part === part.toUpperCase() && /[A-Z]/.test(part)) {
                return part
                  .toLowerCase()
                  .replace(/\b([a-z])/g, (match) => match.toUpperCase());
              }
              return part;
            })
            .join(", ");
          return {
            id: row.id,
            name: `CLASS ${row.name}`,
            subject: resolvedSubject,
            studentCount: row.studentCount,
            attendanceStatus,
            period: periodByClass.get(row.id) ?? "—",
            grade: row.grade,
            section: row.section,
            students: includeStudents ? row.students ?? [] : [],
          };
        }),
      });
    }

    if (resource === "students") {
      const classKey = url.searchParams.get("classKey") ?? url.searchParams.get("classId");
      const page = url.searchParams.get("page");
      const limit = url.searchParams.get("limit");
      const q = url.searchParams.get("q") ?? url.searchParams.get("search");
      const studentId = url.searchParams.get("studentId") ?? url.searchParams.get("id");

      if (studentId) {
        const detail = await loadTeacherStudentDetail(ctx.supabaseAdmin, {
          schoolSlug,
          authId: user.authId,
          email: user.email,
          role: user.role,
          studentId,
          academicYear,
        });
        if (!detail) {
          return Response.json({ error: "Student not found" }, { status: 404 });
        }
        return Response.json({ student: detail });
      }

      const result = await loadTeacherStudentsPage(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        role: user.role,
        academicYear,
        classKey,
        q,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
      });

      return Response.json(result);
    }

    if (resource === "profile") {
      const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
      const { data: userRow } = await ctx.supabaseAdmin
        .from("users")
        .select("full_name, phone, avatar_url")
        .eq("id", user.authId)
        .maybeSingle();

      const profile = await loadTeacherProfileForPortal(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        String(userRow?.full_name ?? ""),
        userRow?.phone ?? null,
        userRow?.avatar_url ?? null,
        academicYear
      );
      return Response.json({ profile });
    }

    if (resource === "attendance") {
      const classKey = url.searchParams.get("classKey");
      const date = url.searchParams.get("date");
      if (url.searchParams.get("view") === "history") {
        const history = await loadTeacherAttendanceHistory(ctx.supabaseAdmin, {
          schoolSlug,
          authId: user.authId,
          email: user.email,
          role: user.role,
          classKey,
          academicYear,
        });
        return Response.json({ history });
      }
      const roster = await loadTeacherAttendanceRoster(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        role: user.role,
        classKey,
        date,
        academicYear,
      });
      return Response.json({ roster });
    }

    if (resource === "assignments") {
      const classKey = url.searchParams.get("classKey");
      const parsedClass = classKey ? parseClassScopeKey(classKey) : null;
      const homework = await loadHomeworkForSchool(
        ctx.supabaseAdmin,
        schoolSlug,
        {
          ...(parsedClass ?? {}),
          includeDrafts: true,
        }
      );
      return Response.json({
        assignments: homework.map((row) => ({
          id: String(row.id),
          title: String(row.title ?? "Homework"),
          subject: String(row.subject ?? row.subject_name ?? "General"),
          className:
            row.grade && row.section ? `${row.grade}-${row.section}` : String(row.grade ?? ""),
          dueDate: String(row.due_date ?? row.assigned_date ?? ""),
          assignedDate: String(row.assigned_date ?? ""),
          status: String(row.status ?? "published"),
          submissionsCount: 0,
          totalStudents: 0,
        })),
      });
    }

    if (resource === "marks") {
      const classKey = url.searchParams.get("classKey");
      const allowedStudents = await loadTeacherScopedStudents(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        user.role,
        academicYear
      );
      const scopedStudents = classKey
        ? allowedStudents.filter(
            (student) => classScopeKey(student.className, student.section) === classKey
          )
        : allowedStudents;
      const allowedIds = new Set(scopedStudents.map((student) => String(student.id)));
      const studentIndex = new Map(
        scopedStudents.map((student) => [
          String(student.id),
          {
            name: String(student.name ?? "Unnamed"),
            rollNo: String(student.roll ?? student.admissionNo ?? "—"),
          },
        ])
      );
      const { loadBranchMarks } = await import("@/lib/loadBranchMarks");
      const documents = (await loadBranchMarks(ctx.supabaseAdmin, schoolSlug, academicYear))
        .filter((doc) => !classKey || classScopeKey(doc.grade, doc.section) === classKey)
        .map((doc) => ({
          id: doc.id,
          exam: doc.exam,
          subject: doc.subject,
          grade: doc.grade,
          section: doc.section,
          maxMarks: doc.maxMarks ?? 100,
          updatedAt: doc.updatedAt ?? "",
          rows: doc.rows
            .filter((row) => allowedIds.has(String(row.studentId)))
            .map((row) => ({
              studentId: String(row.studentId),
              studentName:
                String(row.studentName ?? "").trim() ||
                studentIndex.get(String(row.studentId))?.name ||
                "Unnamed",
              rollNo:
                String(row.roll ?? row.admissionNo ?? "").trim() ||
                studentIndex.get(String(row.studentId))?.rollNo ||
                "—",
              marks: row.marks,
              maxMarks: row.maxMarks ?? doc.maxMarks ?? 100,
              gradeLabel: row.gradeLabel,
              absent: Boolean(row.absent),
            })),
        }))
        .filter((doc) => doc.rows.length > 0)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return Response.json({ documents });
    }

    if (resource === "announcements") {
      const rows = await loadBranchAnnouncements(ctx.supabaseAdmin, schoolSlug);
      const classKey = url.searchParams.get("classKey");
      const visibleRows = classKey
        ? rows.filter(
            (row) =>
              !row.classKey ||
              row.classKey === classKey ||
              String(row.target ?? "") === `class:${classKey}`
          )
        : rows;
      return Response.json({
        announcements: visibleRows.map((row) => ({
          id: String(row.id),
          title: String(row.title ?? "Announcement"),
          body: String(row.content ?? ""),
          category: String(row.category ?? "general").toLowerCase(),
          timestamp: String(row.postedAt ?? row.posted_on ?? ""),
          borderColor: "primary" as const,
          classKey: row.classKey,
          className: row.className,
          subject: row.subject,
          teacherName: row.teacherName,
          linkUrl: row.linkUrl,
          mediaUrl: row.mediaUrl,
          mediaName: row.mediaName,
          mediaType: row.mediaType,
        })),
      });
    }

    if (resource === "leaves") {
      const leaves = await loadTeacherLeaves(ctx.supabaseAdmin, schoolSlug, user.authId);
      return Response.json({
        leaves: leaves.map((row) => ({
          id: String(row.id),
          type: String(row.leave_type ?? row.type ?? "casual"),
          fromDate: String(row.from_date ?? row.start_date ?? ""),
          toDate: String(row.to_date ?? row.end_date ?? ""),
          reason: String(row.reason ?? ""),
          submittedTo: String(row.submitted_to ?? ""),
          status: String(row.status ?? "pending"),
          appliedOn: String(row.created_at ?? ""),
        })),
      });
    }

    if (resource === "leave-balance") {
      const balance = await loadTeacherLeaveBalance(ctx.supabaseAdmin, schoolSlug, user.authId);
      return Response.json({ balance });
    }

    if (resource === "my-attendance") {
      const attendance = await loadStaffOwnAttendance(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email
      );
      return Response.json({ attendance });
    }

    if (resource === "payroll") {
      const payroll = await loadStaffOwnPayroll(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email
      );
      return Response.json({ payroll });
    }

    if (resource === "notifications") {
      const notifications = await loadTeacherNotifications(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        role: user.role,
        academicYear,
      });
      return Response.json({ notifications });
    }

    if (resource === "timetable") {
      const teacherName = await resolveTeacherTimetableName(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        academicYear
      );

      const day = url.searchParams.get("day");
      const classKey = url.searchParams.get("classKey") ?? url.searchParams.get("classId");
      const rows = await loadBranchTimetable(
        ctx.supabaseAdmin,
        schoolSlug,
        teacherName,
        academicYear,
        day
      );
      const timetable = (() => {
        const teachingRows = rows.filter((row) => !row.isBreak);
        if (!classKey) return teachingRows;
        return teachingRows.filter((row) => {
          if (row.class_key) return row.class_key === classKey;
          const parsed = parseClassFromSubject(String(row.subject_name ?? ""));
          return parsed ? classScopeKey(parsed.grade, parsed.section) === classKey : false;
        });
      })();
      return Response.json({ timetable });
    }

    if (resource === "exams") {
      const events = await loadBranchEvents(ctx.supabaseAdmin, schoolSlug);
      const today = new Date().toISOString().slice(0, 10);
      return Response.json({
        exams: events
          .filter((row) => String(row.event_type ?? "").toLowerCase().includes("exam"))
          .map((row) => {
            const date = String(row.event_date ?? "").slice(0, 10);
            return {
              id: String(row.id),
              subject: String(row.title ?? ""),
              date,
              time: "",
              room: "",
              status: date && date < today ? "past" : "upcoming",
            };
          }),
      });
    }

    return Response.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    console.error("portal/teacher/data", err);
    return Response.json(
      {
        error: "Failed to load teacher data",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
});

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let mediaFile: File | null = null;
    let body: Record<string, unknown>;
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      body = Object.fromEntries(
        Array.from(form.entries())
          .filter(([key, value]) => key !== "media" && typeof value === "string")
          .map(([key, value]) => [key, value])
      );
      const media = form.get("media");
      mediaFile = media instanceof File && media.size > 0 ? media : null;
    } else {
      body = await req.json().catch(() => ({}));
    }

    if (resource === "attendance") {
      const date = String(body.date ?? new Date().toISOString().slice(0, 10));
      const records = Array.isArray(body.records) ? body.records : [];
      const result = await saveTeacherAttendance(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        role: user.role,
        date,
        records: records.map((row: Record<string, unknown>) => ({
          studentId: String(row.studentId ?? ""),
          status: (String(row.status ?? "present") as "present" | "absent" | "late"),
        })),
      });
      return Response.json(result);
    }

    if (resource === "assignments") {
      const code = (await import("@/lib/supabase/client")).getSchoolCodeFromSlug(schoolSlug);
      if (!code) return Response.json({ error: "School not found" }, { status: 404 });
      const { data: school } = await ctx.supabaseAdmin.from("schools").select("id").eq("code", code).maybeSingle();
      if (!school?.id) return Response.json({ error: "School not found" }, { status: 404 });

      const title = String(body.title ?? "").trim();
      const grade = String(body.grade ?? "").trim();
      const section = String(body.section ?? "").trim();
      if (!title) return Response.json({ error: "Homework is required" }, { status: 400 });
      if (!grade || !section) return Response.json({ error: "Class and section are required" }, { status: 400 });

      const academicYear = await currentAcademicYearName(ctx.supabaseAdmin, schoolSlug);
      const classKey = classScopeKey(grade, section);
      const allowedStudents = await loadTeacherScopedStudents(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        user.role,
        academicYear
      );
      const canPostToClass = allowedStudents.some(
        (student) => classScopeKey(student.className, student.section) === classKey
      );
      if (!canPostToClass) {
        return Response.json({ error: "You are not assigned to this class" }, { status: 403 });
      }

      const [teacherName, profile] = await Promise.all([
        resolveTeacherTimetableName(
          ctx.supabaseAdmin,
          schoolSlug,
          user.authId,
          user.email,
          academicYear
        ),
        (async () => {
          const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
          return loadTeacherProfileForPortal(
            ctx.supabaseAdmin,
            schoolSlug,
            user.authId,
            user.email,
            null,
            null,
            null,
            academicYear
          );
        })(),
      ]);
      const [timetable, timetableClassSubjects] = await Promise.all([
        loadBranchTimetable(
          ctx.supabaseAdmin,
          schoolSlug,
          teacherName,
          academicYear
        ),
        loadTeacherClassSubjects(
          ctx.supabaseAdmin,
          schoolSlug,
          teacherName ?? "",
          academicYear
        ),
      ]);
      const directTimetableSubjects =
        timetableClassSubjects.find((row) => row.classKey === classKey)?.subjects ?? [];
      const timetableSubjects = timetable.flatMap((period) => {
        if (period.isBreak) return [];
        const parsed = parseClassFromSubject(String(period.subject_name ?? ""));
        if (!parsed || classScopeKey(parsed.grade, parsed.section) !== classKey) return [];
        const subject = subjectFromTeacherTimetableLabel(String(period.subject_name ?? ""));
        return subject ? [subject] : [];
      });
      const profileSubjects = (profile.teachingLoads ?? []).flatMap((load) => {
        const parsed = parseClassFromSubject(String(load.classSection ?? ""));
        if (!parsed || classScopeKey(parsed.grade, parsed.section) !== classKey) return [];
        const subject = String(load.subject ?? "").trim();
        return subject && !/^(homeroom|class teacher|general|academic|—|-)$/i.test(subject)
          ? [subject]
          : [];
      });
      const requestedSubject = String(body.subject ?? "").trim();
      const subject =
        directTimetableSubjects[0] ||
        timetableSubjects[0] ||
        profileSubjects[0] ||
        (!/^(homeroom|class teacher|general|academic|—|-)$/i.test(requestedSubject)
          ? requestedSubject
          : "");
      if (!subject) {
        return Response.json(
          { error: "No subject is assigned to you for this class in the timetable" },
          { status: 400 }
        );
      }

      const assignedDate = String(body.assignedDate ?? body.assigned_date ?? "").trim()
        || new Date().toISOString().slice(0, 10);
      const dueDate = String(body.dueDate ?? body.due_date ?? "").trim() || assignedDate;
      const status = String(body.status ?? "published").toLowerCase() === "draft"
        ? "draft"
        : "published";
      const payload = {
        school_id: school.id,
        title,
        subject,
        grade,
        section,
        due_date: dueDate,
        description: String(body.description ?? ""),
        status,
        assigned_date: assignedDate,
        teacher_id: user.authId,
      };
      const { data, error } = await ctx.supabaseAdmin.from("homework").insert(payload).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });

      if (status === "draft") {
        return Response.json({
          assignment: {
            id: String(data.id),
            title: payload.title,
            subject: payload.subject,
            className:
              payload.grade && payload.section
                ? `${payload.grade}-${payload.section}`
                : payload.grade,
            dueDate: payload.due_date,
            assignedDate: payload.assigned_date,
            status: "draft",
            submissionsCount: 0,
            totalStudents: 0,
          },
        });
      }

      const branchId = await (await import("@/lib/resolveBranchUuid")).resolveBranchUuid(
        ctx.supabaseAdmin,
        schoolSlug
      );
      if (!branchId) {
        await ctx.supabaseAdmin.from("homework").delete().eq("id", data.id);
        return Response.json({ error: "Branch not found" }, { status: 404 });
      }

      const now = new Date().toISOString();
      const className = `${grade}-${section}`;
      const noticeContent = {
        body: title,
        priority: "normal",
        category: "academic",
        audience: "class",
        contentType: "homework",
        homeworkId: String(data.id),
        classKey,
        className,
        grade,
        section,
        subject,
        teacherName: String(profile.name ?? teacherName ?? "Teacher").trim() || "Teacher",
        teacherId: user.authId,
        postedAt: now,
        assignedDate,
      };
      const { error: noticeError } = await ctx.supabaseAdmin.from("notices").insert({
        branch_id: branchId,
        title: `Homework · ${subject}`,
        content: JSON.stringify(noticeContent),
        target: `class:${classKey}`,
        posted_on: now.slice(0, 10),
      });
      if (noticeError) {
        await ctx.supabaseAdmin.from("homework").delete().eq("id", data.id);
        return Response.json(
          { error: `Could not publish homework to the student notice board: ${noticeError.message}` },
          { status: 500 }
        );
      }

      return Response.json({
        assignment: {
          id: String(data.id),
          title: payload.title,
          subject: payload.subject,
          className: payload.grade && payload.section ? `${payload.grade}-${payload.section}` : payload.grade,
          dueDate: payload.due_date,
          assignedDate: payload.assigned_date,
          status: "published",
          submissionsCount: 0,
          totalStudents: 0,
        },
      });
    }

    if (resource === "announcements") {
      const branchId = await (await import("@/lib/resolveBranchUuid")).resolveBranchUuid(
        ctx.supabaseAdmin,
        schoolSlug
      );
      if (!branchId) return Response.json({ error: "Branch not found" }, { status: 404 });
      const classKey = String(body.classKey ?? "").trim();
      const parsedClass = parseClassScopeKey(classKey);
      if (!parsedClass) {
        return Response.json({ error: "Valid class is required" }, { status: 400 });
      }
      const allowedStudents = await loadTeacherScopedStudents(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        user.role,
        await currentAcademicYearName(ctx.supabaseAdmin, schoolSlug)
      );
      const canPostToClass = allowedStudents.some(
        (student) => classScopeKey(student.className, student.section) === classKey
      );
      if (!canPostToClass) {
        return Response.json({ error: "You are not assigned to this class" }, { status: 403 });
      }

      const title = String(body.title ?? "").trim();
      if (!title) return Response.json({ error: "Title required" }, { status: 400 });
      const messageBody = String(body.content ?? body.description ?? "").trim();
      if (!messageBody) return Response.json({ error: "Message required" }, { status: 400 });

      const { loadTeacherProfileForPortal } = await import("@/lib/loadTeacherProfile");
      const profile = await loadTeacherProfileForPortal(
        ctx.supabaseAdmin,
        schoolSlug,
        user.authId,
        user.email,
        null,
        null,
        null,
        null
      );
      const subjects = Array.from(
        new Set(
          (profile.teachingLoads ?? [])
            .filter((load) => {
              const label = String(load.classSection ?? "").replace(/^CLASS\s+/i, "").trim();
              const parsed = parseClassFromSubject(label);
              return parsed
                ? classScopeKey(parsed.grade, parsed.section) === classKey
                : false;
            })
            .map((load) => String(load.subject ?? "").trim())
            .filter((subject) => subject && !/^homeroom$/i.test(subject))
        )
      );
      const subject = subjects.join(", ") || "Class Teacher";
      const teacherName =
        String(profile.name ?? "").trim() || String(user.email ?? "Teacher").split("@")[0];

      const rawLink = String(body.linkUrl ?? "").trim();
      let linkUrl = "";
      if (rawLink) {
        try {
          const parsedUrl = new URL(rawLink);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
          linkUrl = parsedUrl.toString();
        } catch {
          return Response.json({ error: "Link must be a valid http(s) URL" }, { status: 400 });
        }
      }

      let mediaUrl = "";
      let mediaName = "";
      let mediaType = "";
      if (mediaFile) {
        if (!mediaFile.type.startsWith("image/")) {
          return Response.json({ error: "Only image media is supported" }, { status: 400 });
        }
        if (mediaFile.size > 8 * 1024 * 1024) {
          return Response.json({ error: "Media must be 8 MB or smaller" }, { status: 400 });
        }
        const safeName = mediaFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `announcements/${branchId}/${Date.now()}-${safeName}`;
        const bytes = new Uint8Array(await mediaFile.arrayBuffer());
        const { error: uploadError } = await ctx.supabaseAdmin.storage
          .from("uploads")
          .upload(path, bytes, {
            contentType: mediaFile.type || "application/octet-stream",
            upsert: false,
          });
        if (uploadError) {
          return Response.json({ error: `Media upload failed: ${uploadError.message}` }, { status: 500 });
        }
        mediaUrl = ctx.supabaseAdmin.storage.from("uploads").getPublicUrl(path).data.publicUrl;
        mediaName = mediaFile.name;
        mediaType = mediaFile.type;
      }

      const now = new Date().toISOString();
      const className = `${parsedClass.grade}-${parsedClass.section}`;
      const noticeContent = {
        body: messageBody,
        priority: "normal",
        category: "academic",
        audience: "class",
        classKey,
        className,
        grade: parsedClass.grade,
        section: parsedClass.section,
        subject,
        teacherName,
        teacherId: user.authId,
        linkUrl: linkUrl || undefined,
        mediaUrl: mediaUrl || undefined,
        mediaName: mediaName || undefined,
        mediaType: mediaType || undefined,
        postedAt: now,
      };
      const { data, error } = await ctx.supabaseAdmin
        .from("notices")
        .insert({
          branch_id: branchId,
          title,
          content: JSON.stringify(noticeContent),
          target: `class:${classKey}`,
          posted_on: now.slice(0, 10),
        })
        .select()
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({
        announcement: {
          id: String(data.id),
          title,
          body: messageBody,
          category: "academic",
          timestamp: now,
          borderColor: "primary",
          classKey,
          className,
          subject,
          teacherName,
          linkUrl: linkUrl || undefined,
          mediaUrl: mediaUrl || undefined,
          mediaName: mediaName || undefined,
          mediaType: mediaType || undefined,
        },
      });
    }

    if (resource === "leaves") {
      const schoolId = await (await import("@/lib/supabase/client")).getSchoolUuidFromSlug(schoolSlug);
      const staff = await (await import("@/lib/auth/resolve-staff-session")).resolveStaffSessionContext({
        admin: ctx.supabaseAdmin,
        authId: user.authId,
        email: user.email,
        schoolSlug,
      });
      if (!schoolId || !staff) return Response.json({ error: "Staff record not found" }, { status: 404 });

      const fromDate = String(body.fromDate ?? "").trim();
      const toDate = String(body.toDate ?? "").trim();
      const reason = String(body.reason ?? body.description ?? "").trim();
      const submittedToRaw = String(body.submittedTo ?? body.submitted_to ?? "principal")
        .trim()
        .toLowerCase();
      const allowedRecipients = ["principal", "vice_principal", "academic_manager", "hr"] as const;
      type LeaveRecipient = (typeof allowedRecipients)[number];
      const submittedTo: LeaveRecipient = allowedRecipients.includes(submittedToRaw as LeaveRecipient)
        ? (submittedToRaw as LeaveRecipient)
        : "principal";

      let days: number | null = null;
      if (fromDate && toDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        const to = new Date(`${toDate}T00:00:00`);
        if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to >= from) {
          days = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
        }
      }

      const insertPayload: Record<string, unknown> = {
        school_id: schoolId,
        employee_id_ref: staff.employeeId,
        employee_name: staff.displayName,
        leave_type: String(body.type ?? "casual"),
        from_date: fromDate,
        to_date: toDate,
        status: "pending",
        reason,
        submitted_to: submittedTo,
      };
      if (days != null) insertPayload.days = days;

      const { data, error } = await ctx.supabaseAdmin
        .from("leave_requests")
        .insert(insertPayload)
        .select()
        .single();

      // Fallback if newer columns are not yet migrated in this environment.
      if (error && /reason|submitted_to/i.test(error.message)) {
        const { data: fallbackData, error: fallbackError } = await ctx.supabaseAdmin
          .from("leave_requests")
          .insert({
            school_id: schoolId,
            employee_id_ref: staff.employeeId,
            employee_name: staff.displayName,
            leave_type: String(body.type ?? "casual"),
            from_date: fromDate,
            to_date: toDate,
            status: "pending",
            ...(days != null ? { days } : {}),
          })
          .select()
          .single();
        if (fallbackError) return Response.json({ error: fallbackError.message }, { status: 500 });
        return Response.json({
          leave: {
            id: String(fallbackData.id),
            type: String(fallbackData.leave_type ?? body.type ?? "casual"),
            fromDate: String(fallbackData.from_date ?? ""),
            toDate: String(fallbackData.to_date ?? ""),
            reason,
            submittedTo,
            status: "pending",
            appliedOn: "Just now",
          },
        });
      }

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({
        leave: {
          id: String(data.id),
          type: String(data.leave_type ?? body.type ?? "casual"),
          fromDate: String(data.from_date ?? ""),
          toDate: String(data.to_date ?? ""),
          reason: String(data.reason ?? reason),
          submittedTo: String(data.submitted_to ?? submittedTo),
          status: "pending",
          appliedOn: "Just now",
        },
      });
    }

    return Response.json({ error: "Unknown resource" }, { status: 400 });
  } catch (err) {
    console.error("portal/teacher/data POST", err);
    return Response.json({ error: "Failed to save teacher data" }, { status: 500 });
  }
});
