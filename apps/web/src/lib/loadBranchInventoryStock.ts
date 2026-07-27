import type { SupabaseClient } from "@supabase/supabase-js";
import { getSchoolCodeFromSlug } from "@/lib/supabase/client";

export type StockStatus = "Available" | "Low Stock" | "Out of Stock";

export type BranchStockItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  status: StockStatus;
};

function stockStatus(quantity: number, reorderLevel: number): StockStatus {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= reorderLevel) return "Low Stock";
  return "Available";
}

async function resolveSchoolUuid(admin: SupabaseClient<any>, schoolSlug: string): Promise<string | null> {
  const code = getSchoolCodeFromSlug(schoolSlug);
  if (!code) return null;
  const { data, error } = await admin.from("schools").select("id").eq("code", code).maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

function shapeStock(row: Record<string, unknown>): BranchStockItem {
  const quantity = Number(row.quantity) || 0;
  const reorderLevel = Number(row.reorder_level) || 0;
  return {
    id: String(row.id),
    name: String(row.item_name ?? "Item").trim() || "Item",
    category: String(row.category ?? "General").trim() || "General",
    quantity,
    unit: String(row.unit ?? "pcs").trim() || "pcs",
    reorderLevel,
    status: stockStatus(quantity, reorderLevel),
  };
}

export async function loadBranchInventoryStock(
  admin: SupabaseClient<any>,
  schoolSlug: string
): Promise<BranchStockItem[]> {
  const schoolId = await resolveSchoolUuid(admin, schoolSlug);
  if (!schoolId) return [];

  const { data, error } = await admin
    .from("inventory_stock")
    .select("id, item_name, category, quantity, unit, reorder_level, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => shapeStock(row as Record<string, unknown>));
}

export async function saveBranchInventoryStock(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: {
    id?: string;
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    reorderLevel?: number;
  }
): Promise<BranchStockItem> {
  const schoolId = await resolveSchoolUuid(admin, schoolSlug);
  if (!schoolId) throw new Error("School not found");

  const name = String(payload.name ?? "").trim();
  if (!name) throw new Error("Item name is required");

  const row = {
    school_id: schoolId,
    item_name: name,
    category: String(payload.category ?? "General").trim() || "General",
    quantity: Number(payload.quantity) || 0,
    unit: String(payload.unit ?? "pcs").trim() || "pcs",
    reorder_level: Number(payload.reorderLevel) || 10,
  };

  if (payload.id) {
    const { data, error } = await admin
      .from("inventory_stock")
      .update(row)
      .eq("id", payload.id)
      .eq("school_id", schoolId)
      .select("id, item_name, category, quantity, unit, reorder_level")
      .single();
    if (error) throw new Error(error.message);
    return shapeStock(data as Record<string, unknown>);
  }

  const { data, error } = await admin
    .from("inventory_stock")
    .insert(row)
    .select("id, item_name, category, quantity, unit, reorder_level")
    .single();
  if (error) throw new Error(error.message);
  return shapeStock(data as Record<string, unknown>);
}

export async function deleteBranchInventoryStock(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  itemId: string
): Promise<void> {
  const schoolId = await resolveSchoolUuid(admin, schoolSlug);
  if (!schoolId) throw new Error("School not found");

  const { error } = await admin
    .from("inventory_stock")
    .delete()
    .eq("id", itemId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
}
