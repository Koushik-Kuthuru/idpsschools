import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  loadBranchClassFeeRecords,
  upsertBranchClassFeeRecord,
} from "@/lib/loadBranchClassFeeStructures";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const structures = await loadBranchClassFeeRecords(
      supabaseAdmin,
      schoolSlug,
      academicYear
    );
    return noStoreJson({ structures });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load fee structures";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const entry = body.entry;

    if (!schoolSlug || !entry?.grade || !entry?.academicYear) {
      return noStoreJson({ error: "schoolId, entry.grade, and entry.academicYear required" }, { status: 400 });
    }

    await upsertBranchClassFeeRecord(supabaseAdmin, schoolSlug, {
      id: String(entry.id ?? entry.grade),
      grade: String(entry.grade),
      academicYear: String(entry.academicYear),
      status: entry.status ?? "Active",
      feeGrid: Array.isArray(entry.feeGrid) ? entry.feeGrid : [],
      remarks: entry.remarks ?? null,
    });

    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save fee structure";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
