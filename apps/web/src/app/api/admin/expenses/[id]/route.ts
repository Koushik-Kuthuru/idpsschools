import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import {
  deleteBranchExpense,
  loadBranchExpenseById,
  saveBranchExpense,
} from "@/lib/loadBranchExpenses";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const id = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const expense = await loadBranchExpenseById(supabaseAdmin, schoolSlug, id);
    if (!expense) {
      return noStoreJson({ error: "Expense not found" }, { status: 404 });
    }
    return noStoreJson({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load expense";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const PATCH = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const id = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );

  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    if (!schoolSlug) {
      return noStoreJson({ error: "schoolId required" }, { status: 400 });
    }

    const existing = await loadBranchExpenseById(supabaseAdmin, schoolSlug, id);
    if (!existing) {
      return noStoreJson({ error: "Expense not found" }, { status: 404 });
    }

    const { schoolId: _ignored, ...payload } = body;
    const expense = await saveBranchExpense(supabaseAdmin, schoolSlug, {
      ...existing,
      ...payload,
      id,
    });
    return noStoreJson({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update expense";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  const id = decodeURIComponent(
    new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? ""
  );
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return noStoreJson({ error: "schoolId required" }, { status: 400 });
  }

  try {
    await deleteBranchExpense(supabaseAdmin, schoolSlug, id);
    return noStoreJson({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete expense";
    return noStoreJson({ error: message }, { status: 500 });
  }
});
