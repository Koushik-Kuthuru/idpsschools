import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { requirePortalUser, requireSchoolSlug } from "@/lib/portalRouteAuth";
import { resolveStudentSessionContext } from "@/lib/auth/resolve-student-session";
import { resolveStaffSessionForPortal } from "@/lib/auth/resolve-staff-session";
import {
  currentAcademicYearName,
  loadStudentDetailForAuth,
  loadTeacherScopedStudents,
} from "@/lib/portalMobileData";
import { loadBranchStaffRecords } from "@/lib/loadBranchStaff";
import { loadClassTeacherNames } from "@/lib/loadBranchTimetables";
import { teacherNamesMatch } from "@/lib/teacherTimetableUtils";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

type ActorKind = "teacher" | "student";

type DirectMessageMeta = {
  staffId: string;
  studentId: string;
  staffName: string;
  studentName: string;
  senderKind: ActorKind;
  senderId: string;
  senderName: string;
};

type Contact = {
  conversationId: string;
  participantId: string;
  name: string;
  role: string;
  avatarUrl: string;
  staffId: string;
  studentId: string;
  staffName: string;
  studentName: string;
};

function directChannel(staffId: string, studentId: string) {
  return `direct:${staffId}:${studentId}`;
}

async function resolveSchoolId(admin: any, schoolSlug: string): Promise<string | null> {
  // Live schema stores messaging against branches.id (column name school_id).
  return resolveBranchUuid(admin, schoolSlug);
}

function parseDirectMeta(value: unknown): DirectMessageMeta | null {
  try {
    const row = JSON.parse(String(value ?? "")) as Partial<DirectMessageMeta>;
    if (!row.staffId || !row.studentId || !row.senderKind || !row.senderId) return null;
    return {
      staffId: String(row.staffId),
      studentId: String(row.studentId),
      staffName: String(row.staffName ?? "Teacher"),
      studentName: String(row.studentName ?? "Student"),
      senderKind: row.senderKind === "student" ? "student" : "teacher",
      senderId: String(row.senderId),
      senderName: String(row.senderName ?? ""),
    };
  } catch {
    return null;
  }
}

async function resolveMessagingContext(
  admin: any,
  schoolSlug: string,
  authId: string,
  email: string | null
): Promise<{ kind: ActorKind; actorId: string; actorName: string; contacts: Contact[] } | null> {
  const academicYear = await currentAcademicYearName(admin, schoolSlug);
  const studentSession = await resolveStudentSessionContext({
    admin,
    authId,
    email,
    schoolSlug,
  });

  if (studentSession) {
    const detail = await loadStudentDetailForAuth(admin, {
      schoolSlug,
      authId,
      email,
      academicYear,
    });
    if (!detail) return null;
    const grade = String(detail.grade ?? detail.classId ?? "").trim();
    const section = String(detail.section ?? "").trim();
    const [timetableTeachers, staffRows] = await Promise.all([
      loadClassTeacherNames(admin, schoolSlug, grade, section, academicYear),
      loadBranchStaffRecords(admin, schoolSlug, "teaching", academicYear),
    ]);

    const contacts: Contact[] = [];
    for (const timetableTeacher of timetableTeachers) {
      const staff = staffRows.find((row) =>
        teacherNamesMatch(String(row.name ?? ""), timetableTeacher.name)
      );
      if (!staff?.id) continue;
      const staffId = String(staff.id);
      const staffName = String(staff.name ?? timetableTeacher.name);
      if (contacts.some((contact) => contact.staffId === staffId)) continue;
      contacts.push({
        conversationId: directChannel(staffId, studentSession.recordId),
        participantId: staffId,
        name: staffName,
        role: timetableTeacher.subjects.join(", ") || "Teacher",
        avatarUrl: String(staff.photoUrl ?? ""),
        staffId,
        studentId: studentSession.recordId,
        staffName,
        studentName: studentSession.displayName,
      });
    }

    // Compatibility fallback for branches whose class timetable is not yet imported.
    if (contacts.length === 0) {
      const classLabel = `${grade}-${section}`.toUpperCase();
      for (const staff of staffRows) {
        const assigned = [staff.classes, staff.classTeacher]
          .flatMap((value) => String(value ?? "").split(/[\n,;]+/))
          .map((value) => value.trim().toUpperCase())
          .includes(classLabel);
        if (!assigned || !staff.id) continue;
        const staffId = String(staff.id);
        const staffName = String(staff.name ?? "Teacher");
        contacts.push({
          conversationId: directChannel(staffId, studentSession.recordId),
          participantId: staffId,
          name: staffName,
          role: String(staff.subject ?? staff.designation ?? "Teacher"),
          avatarUrl: String(staff.photoUrl ?? ""),
          staffId,
          studentId: studentSession.recordId,
          staffName,
          studentName: studentSession.displayName,
        });
      }
    }

    return {
      kind: "student",
      actorId: studentSession.recordId,
      actorName: studentSession.displayName,
      contacts,
    };
  }

  const staffSession = await resolveStaffSessionForPortal({
    admin,
    authId,
    email,
    schoolSlug,
  });
  if (!staffSession) return null;

  // Prefer the real staff row when auth metadata fallback was used.
  let staffRecordId = staffSession.recordId;
  let staffEmployeeId = staffSession.employeeId;
  if (staffRecordId.startsWith("auth-")) {
    const branchId = await resolveBranchUuid(admin, schoolSlug);
    if (branchId && staffEmployeeId) {
      for (const table of ["teachers", "non_teaching_staff"] as const) {
        const { data } = await admin
          .from(table)
          .select("id, employee_id")
          .eq("branch_id", branchId)
          .or(`employee_id.eq.${staffEmployeeId},user_id.eq.${staffEmployeeId}`)
          .limit(1)
          .maybeSingle();
        if (data?.id) {
          staffRecordId = String(data.id);
          staffEmployeeId = String(data.employee_id ?? staffEmployeeId);
          break;
        }
      }
    }
  }

  // Non-teaching roles without branch elevation get an empty inbox (not a 404).
  const elevatedRoles = new Set([
    "admin",
    "super_admin",
    "principal",
    "vice_principal",
    "academic_director",
    "academic_manager",
    "administrator",
    "coordinator",
  ]);
  const role = String(staffSession.role ?? "").trim().toLowerCase();
  if (staffSession.staffKind !== "teaching" && !elevatedRoles.has(role)) {
    return {
      kind: "teacher",
      actorId: staffRecordId,
      actorName: staffSession.displayName,
      contacts: [],
    };
  }

  const students = await loadTeacherScopedStudents(
    admin,
    schoolSlug,
    authId,
    email,
    staffSession.role,
    academicYear
  );
  const contacts = students.map((student) => {
    const studentId = String(student.id);
    const studentName = String(student.name ?? "Student");
    return {
      conversationId: directChannel(staffRecordId, studentId),
      participantId: studentId,
      name: studentName,
      role: `${student.className}-${student.section}`,
      avatarUrl: "",
      staffId: staffRecordId,
      studentId,
      staffName: staffSession.displayName,
      studentName,
    };
  });
  return {
    kind: "teacher",
    actorId: staffRecordId,
    actorName: staffSession.displayName,
    contacts,
  };
}

async function loadDirectRows(admin: any, schoolId: string) {
  const { data, error } = await admin
    .from("messages")
    .select("id, title, channel, recipients_group, status, sent_at, created_at")
    .eq("school_id", schoolId)
    .like("channel", "direct:%")
    .order("sent_at", { ascending: true })
    .limit(2000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });

  const [schoolId, context] = await Promise.all([
    resolveSchoolId(ctx.supabaseAdmin, schoolSlug),
    resolveMessagingContext(ctx.supabaseAdmin, schoolSlug, user.authId, user.email),
  ]);
  if (!schoolId) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }
  // Authenticated but no messaging identity → empty inbox (avoids mobile uncaught 404s).
  if (!context) {
    const conversationId = new URL(req.url).searchParams.get("conversationId");
    if (conversationId) {
      return Response.json({ error: "Messaging identity not found" }, { status: 404 });
    }
    return Response.json({ threads: [] });
  }

  const rows = await loadDirectRows(ctx.supabaseAdmin, schoolId);
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");
  if (conversationId) {
    const contact = context.contacts.find((item) => item.conversationId === conversationId);
    if (!contact) return Response.json({ error: "Conversation not allowed" }, { status: 403 });
    const messages = rows
      .filter((row: any) => String(row.channel ?? "") === conversationId)
      .map((row: any) => {
        const meta = parseDirectMeta(row.recipients_group);
        return {
          id: String(row.id),
          text: String(row.title ?? ""),
          sent: meta?.senderKind === context.kind && meta.senderId === context.actorId,
          senderName: meta?.senderName ?? "",
          time: String(row.sent_at ?? row.created_at ?? ""),
        };
      });
    return Response.json({
      thread: {
        id: contact.conversationId,
        name: contact.name,
        role: contact.role,
        avatarUrl: contact.avatarUrl,
      },
      messages,
    });
  }

  const threads = context.contacts.map((contact) => {
    const conversationRows = rows.filter(
      (row: any) => String(row.channel ?? "") === contact.conversationId
    );
    const last = conversationRows.at(-1);
    const unread = conversationRows.filter((row: any) => {
      const meta = parseDirectMeta(row.recipients_group);
      return (
        row.status !== "read" &&
        meta &&
        !(meta.senderKind === context.kind && meta.senderId === context.actorId)
      );
    }).length;
    return {
      id: contact.conversationId,
      name: contact.name,
      role: contact.role,
      avatarUrl: contact.avatarUrl,
      lastMessage: last ? String(last.title ?? "") : "Start a conversation",
      timestamp: last ? String(last.sent_at ?? last.created_at ?? "") : "",
      unread,
    };
  });
  threads.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return Response.json({ threads });
});

export const POST = withSupabaseRoute("user", async (req, ctx) => {
  const user = await requirePortalUser(ctx);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const schoolSlug = requireSchoolSlug(req);
  if (!schoolSlug) return Response.json({ error: "schoolId required" }, { status: 400 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const [schoolId, context] = await Promise.all([
    resolveSchoolId(ctx.supabaseAdmin, schoolSlug),
    resolveMessagingContext(ctx.supabaseAdmin, schoolSlug, user.authId, user.email),
  ]);
  if (!schoolId || !context) {
    return Response.json({ error: "Messaging identity not found" }, { status: 404 });
  }

  if (body.action === "open") {
    const studentId = String(body.studentId ?? "").trim();
    const staffId = String(body.staffId ?? "").trim();
    const contact =
      context.kind === "teacher"
        ? context.contacts.find((item) => item.studentId === studentId)
        : context.contacts.find((item) => item.staffId === staffId);
    if (!contact) {
      return Response.json({ error: "Conversation not allowed" }, { status: 403 });
    }
    return Response.json({
      conversationId: contact.conversationId,
      thread: {
        id: contact.conversationId,
        name: contact.name,
        role: contact.role,
        avatarUrl: contact.avatarUrl,
      },
    });
  }

  const conversationId = String(body.conversationId ?? "").trim();
  const contact = context.contacts.find((item) => item.conversationId === conversationId);
  if (!contact) return Response.json({ error: "Conversation not allowed" }, { status: 403 });

  if (body.action === "mark-read") {
    const rows = await loadDirectRows(ctx.supabaseAdmin, schoolId);
    const ids = rows
      .filter((row: any) => {
        if (String(row.channel ?? "") !== conversationId || row.status === "read") return false;
        const meta = parseDirectMeta(row.recipients_group);
        return meta && !(meta.senderKind === context.kind && meta.senderId === context.actorId);
      })
      .map((row: any) => String(row.id));
    if (ids.length) {
      const { error } = await ctx.supabaseAdmin.from("messages").update({ status: "read" }).in("id", ids);
      if (error) return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ success: true });
  }

  const text = String(body.text ?? "").trim();
  if (!text) return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  if (text.length > 2000) return Response.json({ error: "Message is too long" }, { status: 400 });

  const meta: DirectMessageMeta = {
    staffId: contact.staffId,
    studentId: contact.studentId,
    staffName: contact.staffName,
    studentName: contact.studentName,
    senderKind: context.kind,
    senderId: context.actorId,
    senderName: context.actorName,
  };
  const now = new Date().toISOString();
  const { data, error } = await ctx.supabaseAdmin
    .from("messages")
    .insert({
      school_id: schoolId,
      title: text,
      channel: conversationId,
      recipients_group: JSON.stringify(meta),
      status: "unread",
      sent_at: now,
    })
    .select("id, title, sent_at")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    message: {
      id: String(data.id),
      text: String(data.title),
      sent: true,
      senderName: context.actorName,
      time: String(data.sent_at ?? now),
    },
  });
});
