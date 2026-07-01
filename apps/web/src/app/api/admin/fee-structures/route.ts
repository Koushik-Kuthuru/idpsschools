import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  loadBranchClassFeeRecords,
  upsertBranchClassFeeRecord,
} from "@/lib/loadBranchClassFeeStructures";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const structures = await loadBranchClassFeeRecords(
      supabaseAdmin,
      schoolSlug,
      academicYear
    );
    return Response.json({ structures });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load fee structures";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const entry = body.entry;

    if (!schoolSlug || !entry?.grade || !entry?.academicYear) {
      return Response.json({ error: "schoolId, entry.grade, and entry.academicYear required" }, { status: 400 });
    }

    await upsertBranchClassFeeRecord(supabaseAdmin, schoolSlug, {
      id: String(entry.id ?? entry.grade),
      grade: String(entry.grade),
      academicYear: String(entry.academicYear),
      status: entry.status ?? "Active",
      feeGrid: Array.isArray(entry.feeGrid) ? entry.feeGrid : [],
      remarks: entry.remarks ?? null,
    });

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save fee structure";
    return Response.json({ error: message }, { status: 500 });
  }
}
