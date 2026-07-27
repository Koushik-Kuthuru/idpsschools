import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import {
  loadBranchAnnouncements,
  loadHomeworkForSchool,
  loadStudentDetailForAuth,
} from "@/lib/portalMobileData";
import { classScopeKey } from "@/lib/teacherClassScope";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  try {
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const academicYear = url.searchParams.get("academicYear");

    if (kind === "subjects") {
      const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        academicYear,
      });
      if (!detail) return Response.json({ error: "Student record not found" }, { status: 404 });
      const { buildStudentSubjects } = await import("@/lib/portalMobileData");
      const subjects = await buildStudentSubjects(detail, schoolSlug, ctx.supabaseAdmin);
      return Response.json({
        subjects: subjects.map((row) => ({
          id: row.id,
          subject: row.name,
          name: row.name,
          teacher: row.teacher,
          description: row.description,
          weeklyPeriods: row.weeklyPeriods,
        })),
      });
    }

    if (kind === "assignments") {
      const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        academicYear,
      });
      const homework = await loadHomeworkForSchool(ctx.supabaseAdmin, schoolSlug, {
        grade: String(detail?.grade ?? detail?.classId ?? ""),
        section: String(detail?.section ?? ""),
      });
      return Response.json({
        assignments: homework.map((row) => ({
          id: String(row.id),
          title: String(row.title ?? "Homework"),
          subject: String(row.subject ?? row.subject_name ?? "General"),
          className:
            row.grade && row.section ? `${row.grade}-${row.section}` : String(row.grade ?? ""),
          dueDate: String(row.due_date ?? row.assigned_date ?? ""),
          status: String(row.status ?? "published"),
          description: String(row.description ?? row.instructions ?? ""),
        })),
      });
    }

    if (kind === "announcements") {
      const [rows, detail] = await Promise.all([
        loadBranchAnnouncements(ctx.supabaseAdmin, schoolSlug, { limit: 150 }),
        loadStudentDetailForAuth(ctx.supabaseAdmin, {
          schoolSlug,
          authId: user.authId,
          email: user.email,
          academicYear,
        }),
      ]);
      const studentGrade = String(detail?.grade ?? detail?.classId ?? "").trim();
      const studentSection = String(detail?.section ?? "").trim();
      const studentClassKey =
        studentGrade && studentSection
          ? classScopeKey(studentGrade, studentSection)
          : "";
      const visibleRows = rows.filter((row) => {
        const target = String(row.target ?? "all").trim().toLowerCase();
        const isClassScoped = Boolean(row.classKey) || target.startsWith("class:");
        if (isClassScoped) {
          return (
            Boolean(studentClassKey) &&
            (row.classKey === studentClassKey || target === `class:${studentClassKey}`)
          );
        }
        // Students must never see teacher/staff/parent-only circulars.
        return target === "all" || target === "students" || target === "";
      });

      const mapStudentCategory = (value: unknown, priority?: unknown) => {
        const raw = String(value ?? "general").toLowerCase();
        const prio = String(priority ?? "").toLowerCase();
        if (prio === "urgent" || prio === "important" || raw === "urgent" || raw === "important") {
          return "important";
        }
        if (raw === "holiday" || raw === "events" || raw === "general") return raw;
        return "general";
      };

      const noticeAnnouncements = visibleRows.map((row) => {
        const postedStamp = String(row.postedAt ?? row.posted_on ?? "");
        const postedMs = Date.parse(postedStamp);
        return {
          id: String(row.id),
          title: String(row.title ?? "Announcement"),
          description: String(row.content ?? ""),
          content: String(row.content ?? ""),
          category: mapStudentCategory(row.category, row.priority),
          postedAt: String(row.posted_on ?? ""),
          dateTime: postedStamp,
          timeAgo: postedStamp,
          isNew: Number.isFinite(postedMs) && Date.now() - postedMs < 48 * 60 * 60 * 1000,
          postedBy: row.teacherName
            ? `${row.teacherName}${row.subject ? ` | ${row.subject}` : ""}${
                row.className ? ` · ${row.className}` : ""
              }`
            : undefined,
          subject: row.subject,
          className: row.className,
          linkUrl: row.linkUrl,
          imageUrl: row.mediaType?.startsWith("image/") ? row.mediaUrl : undefined,
          attachments: row.mediaUrl ? 1 : 0,
          attachmentFiles: row.mediaName ? [row.mediaName] : [],
          attachmentUrls: row.mediaUrl ? [row.mediaUrl] : [],
          homeworkId: row.homeworkId ? String(row.homeworkId) : undefined,
          contentType: row.contentType ? String(row.contentType) : undefined,
        };
      });

      // Read-side merge: include class homework even when it was never dual-written to notices.
      const homework =
        studentGrade && studentSection
          ? await loadHomeworkForSchool(ctx.supabaseAdmin, schoolSlug, {
              grade: studentGrade,
              section: studentSection,
            })
          : [];
      const mirroredHomeworkIds = new Set(
        noticeAnnouncements
          .map((row) => String(row.homeworkId ?? "").trim())
          .filter(Boolean)
      );
      const className =
        studentGrade && studentSection ? `${studentGrade}-${studentSection}` : studentGrade;
      const homeworkAnnouncements = homework
        .filter((row) => !mirroredHomeworkIds.has(String(row.id)))
        .map((row) => {
          const subject = String(row.subject ?? row.subject_name ?? "").trim();
          const body = String(row.description ?? row.instructions ?? row.title ?? "").trim();
          const postedStamp = String(row.assigned_date ?? row.due_date ?? "");
          const postedMs = Date.parse(
            /^\d{4}-\d{2}-\d{2}$/.test(postedStamp) ? `${postedStamp}T00:00:00` : postedStamp
          );
          return {
            id: `hw-${row.id}`,
            title: subject ? `Homework · ${subject}` : String(row.title ?? "Homework"),
            description: body || String(row.title ?? "Homework assigned"),
            content: body || String(row.title ?? "Homework assigned"),
            category: "general" as const,
            postedAt: postedStamp,
            dateTime: postedStamp,
            timeAgo: postedStamp,
            isNew: Number.isFinite(postedMs) && Date.now() - postedMs < 48 * 60 * 60 * 1000,
            postedBy: subject ? `${subject}${className ? ` · ${className}` : ""}` : className || undefined,
            subject: subject || undefined,
            className: className || undefined,
            linkUrl: undefined,
            imageUrl: undefined,
            attachments: 0,
            attachmentFiles: [] as string[],
            attachmentUrls: [] as string[],
            homeworkId: String(row.id),
            contentType: "homework",
          };
        });

      const announcements = [...noticeAnnouncements, ...homeworkAnnouncements].sort((a, b) => {
        const aMs = Date.parse(
          /^\d{4}-\d{2}-\d{2}$/.test(String(a.dateTime))
            ? `${a.dateTime}T00:00:00`
            : String(a.dateTime)
        );
        const bMs = Date.parse(
          /^\d{4}-\d{2}-\d{2}$/.test(String(b.dateTime))
            ? `${b.dateTime}T00:00:00`
            : String(b.dateTime)
        );
        return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
      });

      return Response.json({ announcements });
    }

    if (kind === "calendar") {
      const { loadBranchEvents } = await import("@/lib/portalMobileData");
      const events = await loadBranchEvents(ctx.supabaseAdmin, schoolSlug);
      return Response.json({
        events: events.map((row) => ({
          id: String(row.id),
          title: String(row.title ?? ""),
          date: String(row.event_date ?? ""),
          type: String(row.event_type ?? "event"),
          description: "",
          location: "",
          time: "",
        })),
      });
    }

    if (kind === "timetable") {
      const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
        schoolSlug,
        authId: user.authId,
        email: user.email,
        academicYear,
      });
      if (!detail) return Response.json({ error: "Student record not found" }, { status: 404 });

      const { loadStudentClassTimetablePeriods } = await import("@/lib/loadBranchTimetables");
      const rows = await loadStudentClassTimetablePeriods(
        ctx.supabaseAdmin,
        schoolSlug,
        String(detail.grade ?? detail.classId ?? ""),
        String(detail.section ?? ""),
        academicYear || (detail.academicYear != null ? String(detail.academicYear) : null),
      );

      const grouped = new Map<string, Array<Record<string, unknown>>>();
      rows.forEach((row) => {
        const day = String(row.day_of_week ?? "Monday");
        const list = grouped.get(day) ?? [];
        list.push({
          id: String(row.id),
          subject: String(row.subject_name ?? ""),
          teacher: String(row.teacher_name ?? ""),
          time: [row.start_time, row.end_time].filter(Boolean).join(" - "),
          room: String(row.room ?? ""),
          accentColor: String(row.accent ?? "#144835"),
        });
        grouped.set(day, list);
      });
      return Response.json({
        timetable: Array.from(grouped.entries()).map(([day, slots]) => ({ day, slots })),
      });
    }

    if (kind === "exams") {
      const { loadBranchEvents } = await import("@/lib/portalMobileData");
      const events = await loadBranchEvents(ctx.supabaseAdmin, schoolSlug);
      return Response.json({
        exams: events
          .filter((row) => String(row.event_type ?? "").toLowerCase().includes("exam"))
          .map((row) => ({
            id: String(row.id),
            subject: String(row.title ?? ""),
            date: String(row.event_date ?? ""),
            time: "",
            room: "",
            status: "upcoming",
          })),
      });
    }

    const [announcements, homework] = await Promise.all([
      loadBranchAnnouncements(ctx.supabaseAdmin, schoolSlug),
      (async () => {
        const detail = await loadStudentDetailForAuth(ctx.supabaseAdmin, {
          schoolSlug,
          authId: user.authId,
          email: user.email,
          academicYear,
        });
        return loadHomeworkForSchool(ctx.supabaseAdmin, schoolSlug, {
          grade: String(detail?.grade ?? detail?.classId ?? ""),
          section: String(detail?.section ?? ""),
        });
      })(),
    ]);

    const notifications = [
      ...announcements.slice(0, 10).map((row) => ({
        id: `ann-${row.id}`,
        title: String(row.title ?? "Announcement"),
        body: String(row.content ?? ""),
        type: "academic" as const,
        timestamp: String(row.posted_on ?? ""),
        read: false,
      })),
      ...homework.slice(0, 10).map((row) => ({
        id: `hw-${row.id}`,
        title: String(row.title ?? "Homework assigned"),
        body: String(row.subject ?? row.description ?? ""),
        type: "academic" as const,
        timestamp: String(row.assigned_date ?? ""),
        read: false,
      })),
    ];

    return Response.json({ notifications });
  } catch (err) {
    console.error("portal/student/content", err);
    return Response.json({ error: "Failed to load content" }, { status: 500 });
  }
});
