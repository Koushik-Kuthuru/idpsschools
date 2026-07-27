"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChefHat,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import type { MessDishDoc, MessMealType } from "@/lib/messStore";

type DishRow = MessDishDoc & { id: string };

const fieldCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

const CATEGORIES: Array<{ id: MessMealType | "general"; label: string }> = [
  { id: "general", label: "General" },
  { id: "breakfast", label: "Morning Breakfast" },
  { id: "lunch", label: "Afternoon Lunch" },
  { id: "snacks", label: "Evening Snacks" },
  { id: "dinner", label: "Night Dinner" },
];

function categoryLabel(category: string) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

const emptyForm = {
  id: "",
  name: "",
  category: "general" as MessMealType | "general",
  cuisine: "",
  ingredients: "",
  recipe: "",
  prepTime: "",
  servings: "",
  notes: "",
  isActive: true,
};

export default function MessDishesView() {
  const schoolId = useSchoolId();
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mode, setMode] = useState<"list" | "edit" | "view">("list");
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/mess/dishes?schoolId=${encodeURIComponent(schoolId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load dishes");
      setDishes((data.dishes ?? []) as DishRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setDishes([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (categoryFilter !== "all" && dish.category !== categoryFilter) return false;
      if (!q) return true;
      return [dish.name, dish.cuisine, dish.ingredients, dish.recipe, dish.notes]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [dishes, search, categoryFilter]);

  const selected = useMemo(
    () => dishes.find((dish) => dish.id === selectedId) ?? null,
    [dishes, selectedId]
  );

  const startCreate = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setMode("edit");
  };

  const openView = (dish: DishRow) => {
    setSelectedId(dish.id);
    setMode("view");
  };

  const openEdit = (dish?: DishRow) => {
    const target = dish ?? selected;
    if (!target) return;
    setForm({
      id: target.id,
      name: target.name,
      category: target.category,
      cuisine: target.cuisine,
      ingredients: target.ingredients,
      recipe: target.recipe,
      prepTime: target.prepTime,
      servings: target.servings,
      notes: target.notes,
      isActive: target.isActive,
    });
    setSelectedId(target.id);
    setMode("edit");
  };

  const backToList = () => {
    setMode("list");
    setSelectedId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/mess/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          id: form.id || undefined,
          name: form.name.trim(),
          category: form.category,
          cuisine: form.cuisine.trim(),
          ingredients: form.ingredients.trim(),
          recipe: form.recipe.trim(),
          prepTime: form.prepTime.trim(),
          servings: form.servings.trim(),
          notes: form.notes.trim(),
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save dish");
      const saved = data.dish as DishRow;
      await refresh();
      setSelectedId(saved.id);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dishId: string) => {
    if (!confirm("Delete this dish?")) return;
    const params = new URLSearchParams({ schoolId, id: dishId });
    const res = await adminFetch(`/api/admin/mess/dishes?${params.toString()}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    backToList();
    await refresh();
  };

  if (mode === "edit") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title={form.id ? "Edit Dish" : "New Dish"}
          description="Add food items and recipes used in the mess menu."
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={backToList}
                className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Dish"}
              </button>
            </div>
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Dish name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Idli Sambar"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Meal category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as MessMealType | "general",
                  }))
                }
                className={`${fieldCls} mt-1`}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Cuisine</label>
              <input
                value={form.cuisine}
                onChange={(e) => setForm((prev) => ({ ...prev, cuisine: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="South Indian / North Indian"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Prep time</label>
              <input
                value={form.prepTime}
                onChange={(e) => setForm((prev) => ({ ...prev, prepTime: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="30 mins"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Servings</label>
              <input
                value={form.servings}
                onChange={(e) => setForm((prev) => ({ ...prev, servings: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="50 students"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active in menu list
              </label>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Ingredients</label>
              <textarea
                value={form.ingredients}
                onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
                placeholder="Rice, dal, spices…"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Recipe / method</label>
              <textarea
                value={form.recipe}
                onChange={(e) => setForm((prev) => ({ ...prev, recipe: e.target.value }))}
                rows={5}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium"
                placeholder="Step-by-step cooking method (optional)"
              />
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Allergen notes, special diet, etc."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "view" && selected) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title={selected.name}
          description={`${categoryLabel(selected.category)}${selected.cuisine ? ` · ${selected.cuisine}` : ""}`}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={backToList}
                className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => openEdit(selected)}
                className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white"
              >
                Edit
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase text-gray-400">Details</p>
            <p className="text-sm font-extrabold text-gray-900">{selected.name}</p>
            <p className="text-xs text-gray-600">{categoryLabel(selected.category)}</p>
            <p className="text-xs text-gray-600">Cuisine: {selected.cuisine || "—"}</p>
            <p className="text-xs text-gray-600">Prep time: {selected.prepTime || "—"}</p>
            <p className="text-xs text-gray-600">Servings: {selected.servings || "—"}</p>
            <p className="text-xs text-gray-600">Status: {selected.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ChefHat size={14} className="text-[#144835]" />
                <p className="text-xs font-extrabold uppercase text-gray-700">Ingredients</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {selected.ingredients || "No ingredients added."}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-[#144835]" />
                <p className="text-xs font-extrabold uppercase text-gray-700">Recipe</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {selected.recipe || "No recipe added."}
              </p>
            </div>
            {selected.notes ? (
              <div>
                <p className="text-xs font-extrabold uppercase text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{selected.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Dishes & Recipes"
        description="All food items and dishes prepared in the mess, with optional recipes."
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
          >
            <Plus size={14} />
            Add Dish
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <UtensilsCrossed size={12} /> {dishes.length} dishes
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
          {dishes.filter((dish) => dish.isActive).length} active
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#144835]/5 text-xs font-bold text-[#144835]">
          {dishes.filter((dish) => dish.recipe.trim()).length} with recipes
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish, ingredient, recipe…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
        >
          <option value="all">All meals</option>
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            No dishes yet. Add food items and recipes used in the mess.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filtered.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => openView(dish)}
                className="text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#144835]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                    <ChefHat size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-gray-900 truncate">{dish.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {categoryLabel(dish.category)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] text-gray-600 line-clamp-2">
                    {dish.ingredients || "No ingredients listed"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dish.cuisine ? (
                      <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600">
                        {dish.cuisine}
                      </span>
                    ) : null}
                    {dish.recipe.trim() ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#144835]/5 border border-[#144835]/10 text-[10px] font-bold text-[#144835]">
                        Recipe
                      </span>
                    ) : null}
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                        dish.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {dish.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(dish);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        openEdit(dish);
                      }
                    }}
                    className="h-8 px-2 inline-flex items-center rounded-md border border-gray-200 text-[11px] font-bold text-gray-600"
                  >
                    Edit
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dish.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        handleDelete(dish.id);
                      }
                    }}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
