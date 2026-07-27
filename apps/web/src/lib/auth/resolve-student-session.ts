import type { SupabaseClient } from "@supabase/supabase-js";
import { displayAdmissionNo } from "@/lib/admissionNo";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export type ResolvedStudentSession = {
  recordId: string;
  displayName: string;
  admissionNo: string;
  username: string;
};

type RpcStudentRow = {
  record_id?: string | null;
  admission_no?: string | null;
  full_name?: string | null;
  username?: string | null;
};

/**
 * Resolve the authenticated portal student without loading every branch profile.
 * Prefer indexed `students.auth_uid`, then SQL RPC (notice JSON fallback).
 */
export async function resolveStudentSessionContext(params: {
  admin: SupabaseClient<any>;
  authId: string;
  email: string | null;
  schoolSlug: string;
}): Promise<ResolvedStudentSession | null> {
  const branchId = await resolveBranchUuid(params.admin, params.schoolSlug);
  if (!branchId) return null;

  const authId = String(params.authId ?? "").trim();
  if (!authId) return null;

  // Fast path: indexed column (populated by provision + migration backfill).
  const { data: byAuthUid, error: authUidError } = await params.admin
    .from("students")
    .select("id, admission_no, full_name")
    .eq("branch_id", branchId)
    .eq("auth_uid", authId)
    .maybeSingle();

  if (!authUidError && byAuthUid?.id) {
    const admissionNo = displayAdmissionNo(String(byAuthUid.admission_no ?? ""));
    return {
      recordId: String(byAuthUid.id),
      displayName: String(byAuthUid.full_name ?? admissionNo),
      admissionNo,
      username: admissionNo,
    };
  }

  // Indexed / targeted SQL resolve (auth_uid column or notice JSON) — no full-table scan.
  const { data: rpcRows, error: rpcError } = await params.admin.rpc("resolve_student_session", {
    p_branch_id: branchId,
    p_auth_uid: authId,
    p_email: params.email ?? null,
  });

  if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
    const row = rpcRows[0] as RpcStudentRow;
    const recordId = String(row.record_id ?? "").trim();
    if (!recordId) return null;
    const admissionNo = displayAdmissionNo(String(row.admission_no ?? ""));
    const username = String(row.username ?? admissionNo).trim() || admissionNo;
    return {
      recordId,
      displayName: String(row.full_name || admissionNo || username || "Student"),
      admissionNo,
      username,
    };
  }

  // Compatibility: single-notice lookup by loginEmail when RPC is not deployed yet.
  const email = String(params.email ?? "").trim().toLowerCase();
  if (email) {
    const { data: noticeRows } = await params.admin
      .from("notices")
      .select("title, content")
      .eq("branch_id", branchId)
      .like("title", "__student_profile__:%")
      .ilike("content", `%"loginEmail":"${email}"%`)
      .limit(1);

    const notice = noticeRows?.[0];
    if (notice?.title) {
      const recordId = String(notice.title).slice("__student_profile__:".length).trim();
      if (recordId) {
        const { data: student } = await params.admin
          .from("students")
          .select("id, admission_no, full_name")
          .eq("branch_id", branchId)
          .eq("id", recordId)
          .maybeSingle();
        if (student?.id) {
          const admissionNo = displayAdmissionNo(String(student.admission_no ?? ""));
          return {
            recordId: String(student.id),
            displayName: String(student.full_name ?? admissionNo),
            admissionNo,
            username: admissionNo,
          };
        }
      }
    }
  }

  return null;
}
