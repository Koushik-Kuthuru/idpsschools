import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  addBranchTransportBus,
  deleteBranchTransportBus,
  loadBranchTransportBuses,
  updateBranchTransportBus,
} from "@/lib/branchTransportStore";

function parseBusStatus(value: unknown): "Active" | "Inactive" | undefined {
  if (value === undefined) return undefined;
  return String(value) === "Inactive" ? "Inactive" : "Active";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const buses = await loadBranchTransportBuses(supabaseAdmin, schoolSlug);
    return Response.json({ buses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load buses";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "");
    const action = String(body.action ?? "add");

    if (!schoolSlug) {
      return Response.json({ error: "schoolId required" }, { status: 400 });
    }

    if (action === "add") {
      const buses = await addBranchTransportBus(supabaseAdmin, schoolSlug, {
        busNo: String(body.busNo ?? ""),
        route: String(body.route ?? ""),
        routePrice: Number(body.routePrice) || 0,
        status: parseBusStatus(body.status) ?? "Active",
      });
      return Response.json({ buses });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save bus";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "");
    const id = String(body.id ?? "");

    if (!schoolSlug || !id) {
      return Response.json({ error: "schoolId and id required" }, { status: 400 });
    }

    const buses = await updateBranchTransportBus(supabaseAdmin, schoolSlug, id, {
      busNo: body.busNo !== undefined ? String(body.busNo) : undefined,
      route: body.route !== undefined ? String(body.route) : undefined,
      routePrice: body.routePrice !== undefined ? Number(body.routePrice) : undefined,
      status: parseBusStatus(body.status),
    });

    return Response.json({ buses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update bus";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const id = url.searchParams.get("id");

  if (!schoolSlug || !id) {
    return Response.json({ error: "schoolId and id required" }, { status: 400 });
  }

  try {
    const buses = await deleteBranchTransportBus(supabaseAdmin, schoolSlug, id);
    return Response.json({ buses });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete bus";
    return Response.json({ error: message }, { status: 500 });
  }
}
