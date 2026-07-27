import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

type DirectMessageMeta = {
  staffId: string;
  studentId: string;
  staffName: string;
  studentName: string;
  senderKind: "teacher" | "student";
  senderId: string;
  senderName: string;
};

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

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const studentId = decodeURIComponent(
    url.pathname.split("/").filter(Boolean).at(-2) ?? ""
  );

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }
  if (!studentId || studentId === "students") {
    return noStoreJson({ error: "student id required" }, { status: 400 });
  }

  try {
    const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
    if (!branchId) {
      return noStoreJson({ error: "School not found" }, { status: 404 });
    }

    // messages.school_id stores branch UUID in this project.
    const { data: rows, error } = await ctx.admin
      .from("messages")
      .select("id, title, channel, recipients_group, status, sent_at, created_at, school_id")
      .eq("school_id", branchId)
      .like("channel", `direct:%:${studentId}`)
      .order("sent_at", { ascending: true })
      .limit(5000);

    if (error) {
      if (error.code === "PGRST205" || /Could not find the table/i.test(error.message)) {
        return noStoreJson({
          studentId,
          count: 0,
          threads: [],
          warning:
            "messages table is missing in Supabase. Apply migration 20260724130000_messages_direct_chat.sql",
        });
      }
      throw new Error(error.message);
    }

    const byChannel = new Map<
      string,
      {
        conversationId: string;
        staffId: string;
        staffName: string;
        studentId: string;
        studentName: string;
        messages: Array<{
          id: string;
          text: string;
          senderKind: "teacher" | "student";
          senderName: string;
          time: string;
          status: string;
        }>;
      }
    >();

    for (const row of rows ?? []) {
      const channel = String(row.channel ?? "");
      if (!channel.startsWith("direct:")) continue;
      const meta = parseDirectMeta(row.recipients_group);
      const parts = channel.split(":");
      const staffId = meta?.staffId || parts[1] || "";
      const sid = meta?.studentId || parts[2] || studentId;
      if (sid !== studentId) continue;

      let thread = byChannel.get(channel);
      if (!thread) {
        thread = {
          conversationId: channel,
          staffId,
          staffName: meta?.staffName || "Teacher",
          studentId: sid,
          studentName: meta?.studentName || "Student",
          messages: [],
        };
        byChannel.set(channel, thread);
      } else if (meta?.staffName && thread.staffName === "Teacher") {
        thread.staffName = meta.staffName;
      }

      thread.messages.push({
        id: String(row.id),
        text: String(row.title ?? ""),
        senderKind: meta?.senderKind ?? "teacher",
        senderName:
          meta?.senderName ||
          (meta?.senderKind === "student" ? meta.studentName : meta?.staffName) ||
          "",
        time: String(row.sent_at ?? row.created_at ?? ""),
        status: String(row.status ?? ""),
      });
    }

    const threads = Array.from(byChannel.values())
      .map((thread) => {
        const last = thread.messages.at(-1);
        return {
          id: thread.conversationId,
          staffId: thread.staffId,
          staffName: thread.staffName,
          studentId: thread.studentId,
          studentName: thread.studentName,
          messageCount: thread.messages.length,
          lastMessage: last?.text || "",
          lastTime: last?.time || "",
          messages: thread.messages,
        };
      })
      .sort((a, b) => String(b.lastTime).localeCompare(String(a.lastTime)));

    return noStoreJson({
      studentId,
      count: threads.length,
      threads,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load messages";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
