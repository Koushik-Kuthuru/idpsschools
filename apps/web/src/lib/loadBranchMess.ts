import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  deleteMessDish,
  deleteMessFeedback,
  deleteMessMenu,
  emptyMessMenuDays,
  loadAllMessMenus,
  loadMessAttendance,
  loadMessDishes,
  loadMessFeedback,
  loadMessMenu,
  messDishDocId,
  saveMessAttendance,
  saveMessDish,
  saveMessFeedback,
  saveMessMenu,
  type MessAttendanceDoc,
  type MessDishDoc,
  type MessFeedbackDoc,
  type MessMealType,
  type MessMenuDoc,
} from "@/lib/messStore";

export async function loadBranchMessMenus(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  return loadAllMessMenus(admin, branchId);
}

export async function loadBranchMessMenu(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  weekStart: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  const menu = await loadMessMenu(admin, branchId, weekStart);
  if (menu) return menu;
  return {
    id: `week__${weekStart}`,
    weekStart,
    title: `Week of ${weekStart}`,
    published: false,
    days: emptyMessMenuDays(),
  };
}

export async function saveBranchMessMenu(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: MessMenuDoc
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await saveMessMenu(admin, branchId, payload);
  return loadMessMenu(admin, branchId, payload.weekStart);
}

export async function deleteBranchMessMenu(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  weekStart: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteMessMenu(admin, branchId, weekStart);
}

export async function loadBranchMessAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  date: string,
  meal: MessMealType
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return null;
  return loadMessAttendance(admin, branchId, date, meal);
}

export async function saveBranchMessAttendance(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: MessAttendanceDoc
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await saveMessAttendance(admin, branchId, payload);
}

export async function loadBranchMessFeedback(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  return loadMessFeedback(admin, branchId);
}

export async function saveBranchMessFeedback(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: MessFeedbackDoc & { id?: string }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  const id =
    String(payload.id ?? "").trim() ||
    `fb__${Date.now()}__${Math.random().toString(36).slice(2, 8)}`;
  const { id: _ignored, ...data } = payload;
  await saveMessFeedback(admin, branchId, id, data);
  return { id, ...data };
}

export async function deleteBranchMessFeedback(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  feedbackId: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteMessFeedback(admin, branchId, feedbackId);
}

export async function loadBranchMessDishes(admin: SupabaseClient<any>, schoolSlug: string) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) return [];
  return loadMessDishes(admin, branchId);
}

export async function saveBranchMessDish(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  payload: MessDishDoc & { id?: string }
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");

  const name = String(payload.name ?? "").trim();
  if (!name) throw new Error("Dish name is required");

  const id = String(payload.id ?? "").trim() || messDishDocId(name);
  const data: MessDishDoc = {
    name,
    category: payload.category ?? "general",
    cuisine: String(payload.cuisine ?? "").trim(),
    ingredients: String(payload.ingredients ?? "").trim(),
    recipe: String(payload.recipe ?? "").trim(),
    prepTime: String(payload.prepTime ?? "").trim(),
    servings: String(payload.servings ?? "").trim(),
    notes: String(payload.notes ?? "").trim(),
    isActive: payload.isActive !== false,
  };

  await saveMessDish(admin, branchId, id, data);
  return { id, ...data };
}

export async function deleteBranchMessDish(
  admin: SupabaseClient<any>,
  schoolSlug: string,
  dishId: string
) {
  const branchId = await resolveBranchUuid(admin, schoolSlug);
  if (!branchId) throw new Error("Branch not found");
  await deleteMessDish(admin, branchId, dishId);
}
