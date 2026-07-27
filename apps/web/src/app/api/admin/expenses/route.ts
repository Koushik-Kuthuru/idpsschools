import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { loadBranchExpenses, saveBranchExpense } from "@/lib/loadBranchExpenses";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const expenses = await loadBranchExpenses(supabaseAdmin, schoolSlug);
    return noStoreJson({ expenses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load expenses";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const expense = await saveBranchExpense(supabaseAdmin, schoolSlug, payload);
    return noStoreJson({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save expense";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
