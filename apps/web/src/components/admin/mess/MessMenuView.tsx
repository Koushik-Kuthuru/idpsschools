"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Pencil,
  Plus,
  RotateCw,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  emptyMessMenuDays,
  type MessMealType,
  type MessMenuDay,
  type MessMenuDoc,
} from "@/lib/messStore";

type MenuRow = MessMenuDoc & { id: string };

type DishOption = {
  id: string;
  name: string;
  category: MessMealType | "general";
};

function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  if (Number.isNaN(start.getTime())) return weekStart;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const MEAL_COLUMNS = [
  { field: "breakfast" as const, label: "Morning Breakfast", time: "Morning" },
  { field: "lunch" as const, label: "Afternoon Lunch", time: "Afternoon" },
  { field: "snacks" as const, label: "Evening Snacks", time: "Evening" },
  { field: "dinner" as const, label: "Night Dinner", time: "Night" },
];

function parseDishList(value: string) {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinDishList(items: string[]) {
  return items.join(", ");
}

function countMenuDishes(days: MessMenuDay[]) {
  let count = 0;
  for (const day of days) {
    for (const meal of MEAL_COLUMNS) {
      count += parseDishList(day[meal.field]).length;
    }
  }
  return count;
}

function MealDishDropdown({
  value,
  options,
  mealLabel,
  onChange,
}: {
  value: string;
  options: DishOption[];
  mealLabel: string;
  onChange: (next: string) => void;
}) {
  const selected = useMemo(() => parseDishList(value), [value]);
  const available = useMemo(() => {
    const selectedSet = new Set(selected.map((name) => name.toLowerCase()));
    return options.filter((dish) => !selectedSet.has(dish.name.toLowerCase()));
  }, [options, selected]);

  const addDish = (name: string) => {
    if (!name) return;
    const next = [...selected];
    if (!next.some((item) => item.toLowerCase() === name.toLowerCase())) next.push(name);
    onChange(joinDishList(next));
  };

  const removeDish = (name: string) => {
    onChange(joinDishList(selected.filter((item) => item !== name)));
  };

  return (
    <div className="min-w-[180px] space-y-1.5">
      <select
        value=""
        onChange={(e) => {
          addDish(e.target.value);
          e.target.value = "";
        }}
        className="w-full h-9 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
      >
        <option value="">
          {options.length ? `Select ${mealLabel.toLowerCase()} dish…` : "No dishes yet"}
        </option>
        {available.map((dish) => (
          <option key={dish.id} value={dish.name}>
            {dish.name}
          </option>
        ))}
      </select>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-[#144835]/20 bg-[#144835]/5 px-2 py-0.5 text-[10px] font-bold text-[#144835]"
            >
              {name}
              <button
                type="button"
                onClick={() => removeDish(name)}
                className="rounded-full hover:bg-[#144835]/10 p-0.5"
                aria-label={`Remove ${name}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400">No dish selected</p>
      )}
    </div>
  );
}

function MenuDaysTable({
  days,
  dishesByMeal,
  editable,
  onChange,
}: {
  days: MessMenuDay[];
  dishesByMeal: Record<MessMealType, DishOption[]>;
  editable: boolean;
  onChange?: (index: number, patch: Partial<MessMenuDay>) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[1100px] text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-28">Day</th>
            {MEAL_COLUMNS.map((meal) => (
              <th key={meal.field} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                <span className="block text-[10px] text-[#144835]">{meal.time}</span>
                <span>{meal.label.split(" ").slice(1).join(" ")}</span>
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {days.map((day, index) => (
            <tr key={day.day}>
              <td className="px-4 py-3 text-xs font-extrabold text-gray-800 align-top">
                <span className="inline-flex items-center gap-1.5">
                  <UtensilsCrossed size={12} className="text-[#144835]" />
                  {day.day}
                </span>
              </td>
              {MEAL_COLUMNS.map((meal) => (
                <td key={meal.field} className="px-3 py-2 align-top">
                  {editable && onChange ? (
                    <MealDishDropdown
                      value={day[meal.field]}
                      options={dishesByMeal[meal.field]}
                      mealLabel={meal.label}
                      onChange={(next) => onChange(index, { [meal.field]: next })}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1 min-w-[140px]">
                      {parseDishList(day[meal.field]).length ? (
                        parseDishList(day[meal.field]).map((name) => (
                          <span
                            key={name}
                            className="inline-flex rounded-full border border-[#144835]/20 bg-[#144835]/5 px-2 py-0.5 text-[10px] font-bold text-[#144835]"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </div>
                  )}
                </td>
              ))}
              <td className="px-3 py-2 align-top">
                {editable && onChange ? (
                  <textarea
                    value={day.notes}
                    onChange={(e) => onChange(index, { notes: e.target.value })}
                    rows={2}
                    className="w-full min-w-[140px] rounded-md border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-800"
                    placeholder="Special diet / notes"
                  />
                ) : (
                  <p className="text-[11px] text-gray-600 min-w-[120px]">{day.notes || "—"}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MessMenuView() {
  const schoolId = useSchoolId();
  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"list" | "view" | "edit">("list");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(false);
  const [days, setDays] = useState<MessMenuDay[]>(emptyMessMenuDays());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dishesByMeal = useMemo(() => {
    const map: Record<MessMealType, DishOption[]> = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    };
    for (const dish of dishes) {
      if (dish.category === "general") {
        map.breakfast.push(dish);
        map.lunch.push(dish);
        map.snacks.push(dish);
        map.dinner.push(dish);
        continue;
      }
      if (dish.category in map) map[dish.category].push(dish);
    }
    for (const key of Object.keys(map) as MessMealType[]) {
      map[key].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    return map;
  }, [dishes]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menusRes, dishesRes] = await Promise.all([
        adminFetch(`/api/admin/mess/menu?schoolId=${encodeURIComponent(schoolId)}`),
        adminFetch(`/api/admin/mess/dishes?schoolId=${encodeURIComponent(schoolId)}`),
      ]);
      const menusData = await menusRes.json().catch(() => ({}));
      const dishesData = await dishesRes.json().catch(() => ({}));
      if (!menusRes.ok) throw new Error(menusData.error || "Failed to load menus");
      setMenus((menusData.menus ?? []) as MenuRow[]);
      setDishes(
        ((dishesData.dishes ?? []) as Array<Record<string, unknown>>)
          .filter((dish) => dish.isActive !== false && dish.name)
          .map((dish) => ({
            id: String(dish.id),
            name: String(dish.name),
            category: (dish.category as MessMealType | "general") ?? "general",
          }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter((menu) =>
      [menu.title, menu.weekStart, menu.published ? "published" : "draft"]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [menus, search]);

  const selected = useMemo(
    () => menus.find((menu) => menu.id === selectedId) ?? null,
    [menus, selectedId]
  );

  const backToList = () => {
    setMode("list");
    setIsCreating(false);
    setSelectedId(null);
    setMessage(null);
    setError(null);
  };

  const startCreate = () => {
    const start = mondayOf();
    setIsCreating(true);
    setSelectedId(null);
    setWeekStart(start);
    setTitle(`Week of ${start}`);
    setPublished(false);
    setDays(emptyMessMenuDays());
    setMode("edit");
    setMessage(null);
    setError(null);
  };

  const openView = (menu: MenuRow) => {
    setIsCreating(false);
    setSelectedId(menu.id);
    setWeekStart(menu.weekStart);
    setTitle(menu.title);
    setPublished(menu.published);
    setDays(menu.days?.length ? menu.days : emptyMessMenuDays());
    setMode("view");
    setMessage(null);
    setError(null);
  };

  const openEdit = (menu?: MenuRow) => {
    const target = menu ?? selected;
    if (!target) return;
    setIsCreating(false);
    setSelectedId(target.id);
    setWeekStart(target.weekStart);
    setTitle(target.title);
    setPublished(target.published);
    setDays(target.days?.length ? target.days : emptyMessMenuDays());
    setMode("edit");
    setMessage(null);
    setError(null);
  };

  const updateDay = (index: number, patch: Partial<MessMenuDay>) => {
    setDays((prev) => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
    setMessage(null);
  };

  const handleSave = async (nextPublished = published) => {
    if (!weekStart) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminFetch("/api/admin/mess/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          weekStart,
          title: title.trim() || `Week of ${weekStart}`,
          published: nextPublished,
          days,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      const saved = data.menu as MenuRow;
      setPublished(nextPublished);
      setSelectedId(saved?.id ?? `week__${weekStart}`);
      setIsCreating(false);
      setMode("view");
      setMessage(nextPublished ? "Menu published" : "Menu saved");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menu: MenuRow) => {
    if (!confirm(`Delete menu for ${formatWeekRange(menu.weekStart)}?`)) return;
    const params = new URLSearchParams({ schoolId, weekStart: menu.weekStart });
    const res = await adminFetch(`/api/admin/mess/menu?${params.toString()}`, { method: "DELETE" });
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
          title={isCreating ? "New Menu" : "Edit Menu"}
          description="Pick dishes for morning breakfast, afternoon lunch, evening snacks, and night dinner."
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={isCreating ? backToList : () => setMode("view")}
                className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 disabled:opacity-50"
              >
                {saving ? <RotateCw size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Week starting</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(mondayOf(new Date(`${e.target.value}T00:00:00`)))}
            className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
            disabled={!isCreating}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 flex-1 min-w-[200px] rounded-lg border border-gray-200 px-3 text-xs font-semibold"
            placeholder="Menu title"
          />
          <span className="text-[11px] text-gray-500">{formatWeekRange(weekStart)}</span>
          {message ? <span className="text-xs font-bold text-emerald-600">{message}</span> : null}
          {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
        </div>

        {dishes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-[11px] text-gray-500">
            Add dishes under <span className="font-bold">Mess → Dishes & Recipes</span> to select
            them in the menu.
          </div>
        ) : null}

        <MenuDaysTable
          days={days}
          dishesByMeal={dishesByMeal}
          editable
          onChange={updateDay}
        />
      </div>
    );
  }

  if (mode === "view" && selected) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title={selected.title || `Week of ${selected.weekStart}`}
          description={formatWeekRange(selected.weekStart)}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={backToList}
                className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
              >
                Back to menus
              </button>
              <button
                type="button"
                onClick={() => openEdit(selected)}
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
              selected.published
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {selected.published ? "Published" : "Draft"}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
            {countMenuDishes(selected.days)} dishes planned
          </span>
          {message ? <span className="text-xs font-bold text-emerald-600">{message}</span> : null}
        </div>

        <MenuDaysTable days={selected.days} dishesByMeal={dishesByMeal} editable={false} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Mess Menu"
        description="All weekly menus for morning breakfast, afternoon lunch, evening snacks, and night dinner."
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
          >
            <Plus size={14} />
            Add New Menu
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <CalendarDays size={12} /> {menus.length} menus
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
          {menus.filter((menu) => menu.published).length} published
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
          {menus.filter((menu) => !menu.published).length} draft
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menus…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
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
          <div className="text-center py-16 px-4">
            <CalendarDays size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700">No menus yet</p>
            <p className="text-xs text-gray-500 mt-1">Create a weekly menu to get started.</p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-4 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
            >
              <Plus size={14} />
              Add New Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {filtered.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => openView(menu)}
                className="text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#144835]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center shrink-0">
                    <UtensilsCrossed size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-gray-900 truncate">
                      {menu.title || `Week of ${menu.weekStart}`}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {formatWeekRange(menu.weekStart)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                      menu.published
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {menu.published ? "Published" : "Draft"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600">
                    {countMenuDishes(menu.days)} dishes
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(menu);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        openEdit(menu);
                      }
                    }}
                    className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-gray-200 text-[11px] font-bold text-gray-600"
                  >
                    <Pencil size={12} />
                    Edit
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(menu);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        handleDelete(menu);
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
