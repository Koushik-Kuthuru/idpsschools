import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";

export const BRANCH_TRANSPORT_BUSES_NOTICE = "__branch_transport_buses__";

export type TransportBusRecord = {
  id: string;
  busNo: string;
  route: string;
  routePrice: number;
  status: "Active" | "Inactive";
  sortOrder: number;
};

export type BranchTransportFleet = {
  buses: TransportBusRecord[];
  updatedAt?: string;
};

function slugBusId(busNo: string): string {
  return String(busNo ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeFleet(raw: unknown): BranchTransportFleet {
  if (!raw || typeof raw !== "object") return { buses: [] };
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.buses)) return { buses: [] };
  const buses = obj.buses
    .map((row, index) => {
      const item = row as Record<string, unknown>;
      const busNo = String(item.busNo ?? item.bus_no ?? "").trim();
      if (!busNo) return null;
      return {
        id: String(item.id ?? slugBusId(busNo)),
        busNo,
        route: String(item.route ?? item.routeCode ?? "").trim(),
        routePrice: Number(item.routePrice ?? item.route_price ?? 0) || 0,
        status: String(item.status ?? "Active") === "Inactive" ? "Inactive" : "Active",
        sortOrder: Number(item.sortOrder ?? item.sort_order ?? index + 1) || index + 1,
      } satisfies TransportBusRecord;
    })
    .filter(Boolean) as TransportBusRecord[];

  buses.sort((a, b) => a.sortOrder - b.sortOrder || a.route.localeCompare(b.route));
  return { buses, updatedAt: String(obj.updatedAt ?? "") || undefined };
}

async function loadFleetFromNotices(
  admin: SupabaseClient<any>,
  branchId: string
): Promise<BranchTransportFleet> {
  const { data, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", BRANCH_TRANSPORT_BUSES_NOTICE)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.content) return { buses: [] };

  try {
    return normalizeFleet(JSON.parse(String(data.content)));
  } catch {
    return { buses: [] };
  }
}

async function saveFleetToNotices(
  admin: SupabaseClient<any>,
  branchId: string,
  fleet: BranchTransportFleet
): Promise<void> {
  const payload: BranchTransportFleet = {
    buses: fleet.buses,
    updatedAt: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await admin
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", BRANCH_TRANSPORT_BUSES_NOTICE)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  if (existing?.id) {
    const { error } = await admin
      .from("notices")
      .update({ content: JSON.stringify(payload) })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title: BRANCH_TRANSPORT_BUSES_NOTICE,
    content: JSON.stringify(payload),
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

export async function loadBranchTransportBuses(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<TransportBusRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  const fleet = await loadFleetFromNotices(admin, branchId);
  return fleet.buses;
}

export async function saveBranchTransportFleet(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  buses: TransportBusRecord[]
): Promise<TransportBusRecord[]> {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const normalized: TransportBusRecord[] = buses
    .map((bus, index): TransportBusRecord => ({
      id: bus.id || slugBusId(bus.busNo),
      busNo: bus.busNo.trim(),
      route: bus.route.trim(),
      routePrice: Number(bus.routePrice) || 0,
      status: bus.status === "Inactive" ? "Inactive" : "Active",
      sortOrder: bus.sortOrder || index + 1,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  await saveFleetToNotices(admin, branchId, { buses: normalized });
  return normalized;
}

export async function addBranchTransportBus(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  input: { busNo: string; route: string; routePrice?: number; status?: string }
): Promise<TransportBusRecord[]> {
  const existing = await loadBranchTransportBuses(admin, schoolSlug);
  const busNo = input.busNo.trim();
  if (!busNo) throw new Error("Bus number is required");
  if (existing.some((b) => b.busNo.toUpperCase() === busNo.toUpperCase())) {
    throw new Error("Bus number already exists");
  }

  const next: TransportBusRecord = {
    id: slugBusId(busNo),
    busNo,
    route: input.route.trim(),
    routePrice: Number(input.routePrice) || 0,
    status: input.status === "Inactive" ? "Inactive" : "Active",
    sortOrder: existing.length + 1,
  };

  return saveBranchTransportFleet(admin, schoolSlug, [...existing, next]);
}

export async function updateBranchTransportBus(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  id: string,
  patch: Partial<Pick<TransportBusRecord, "busNo" | "route" | "routePrice" | "status">>
): Promise<TransportBusRecord[]> {
  const existing = await loadBranchTransportBuses(admin, schoolSlug);
  const idx = existing.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error("Bus not found");

  const current = existing[idx];
  const busNo = (patch.busNo ?? current.busNo).trim();
  if (
    busNo.toUpperCase() !== current.busNo.toUpperCase() &&
    existing.some((b) => b.busNo.toUpperCase() === busNo.toUpperCase())
  ) {
    throw new Error("Bus number already exists");
  }

  const updated = [...existing];
  updated[idx] = {
    ...current,
    busNo,
    route: (patch.route ?? current.route).trim(),
    routePrice: patch.routePrice !== undefined ? Number(patch.routePrice) || 0 : current.routePrice,
    status: patch.status === "Inactive" ? "Inactive" : patch.status === "Active" ? "Active" : current.status,
  };

  return saveBranchTransportFleet(admin, schoolSlug, updated);
}

export async function deleteBranchTransportBus(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  id: string
): Promise<TransportBusRecord[]> {
  const existing = await loadBranchTransportBuses(admin, schoolSlug);
  const filtered = existing.filter((b) => b.id !== id).map((bus, index) => ({ ...bus, sortOrder: index + 1 }));
  return saveBranchTransportFleet(admin, schoolSlug, filtered);
}
