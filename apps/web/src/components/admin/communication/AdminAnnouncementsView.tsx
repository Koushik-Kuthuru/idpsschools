"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import {
  ANNOUNCEMENT_AUDIENCES,
  type AnnouncementAudience,
  type BranchAnnouncementRecord,
} from "@/lib/loadBranchAnnouncementsAdmin";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fieldCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

const CATEGORIES = ["General", "Academic", "Hostel", "Mess", "Transport", "Events", "Urgent"];

const emptyForm = {
  id: "",
  title: "",
  content: "",
  target: "all" as AnnouncementAudience,
  priority: "normal" as "normal" | "important" | "urgent",
  category: "General",
  postedOn: new Date().toISOString().slice(0, 10),
};

function audienceLabel(target: string) {
  return ANNOUNCEMENT_AUDIENCES.find((item) => item.id === target)?.label ?? target;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminAnnouncementsView() {
  const schoolId = useSchoolId();
  const [announcements, setAnnouncements] = useState<BranchAnnouncementRecord[]>([]);
  const [search, setSearch] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [mode, setMode] = useState<"list" | "edit" | "view">("list");
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/announcements?schoolId=${encodeURIComponent(schoolId)}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load announcements");
      setAnnouncements((data.announcements ?? []) as BranchAnnouncementRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return announcements.filter((row) => {
      if (audienceFilter !== "all" && row.target !== audienceFilter) return false;
      if (!q) return true;
      return [row.title, row.content, row.category, row.target]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [announcements, search, audienceFilter]);

  const selected = useMemo(
    () => announcements.find((row) => row.id === selectedId) ?? null,
    [announcements, selectedId]
  );

  const counts = useMemo(() => {
    const byAudience = Object.fromEntries(
      ANNOUNCEMENT_AUDIENCES.map((item) => [item.id, 0])
    ) as Record<string, number>;
    for (const row of announcements) {
      byAudience[row.target] = (byAudience[row.target] ?? 0) + 1;
    }
    return byAudience;
  }, [announcements]);

  const startCreate = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setMode("edit");
    setMessage(null);
    setError(null);
  };

  const openView = (row: BranchAnnouncementRecord) => {
    setSelectedId(row.id);
    setMode("view");
    setMessage(null);
    setError(null);
  };

  const openEdit = (row?: BranchAnnouncementRecord) => {
    const target = row ?? selected;
    if (!target) return;
    setForm({
      id: target.id,
      title: target.title,
      content: target.content,
      target: target.target,
      priority: target.priority,
      category: target.category,
      postedOn: target.postedOn || new Date().toISOString().slice(0, 10),
    });
    setSelectedId(target.id);
    setMode("edit");
    setMessage(null);
    setError(null);
  };

  const backToList = () => {
    setMode("list");
    setSelectedId(null);
    setForm(emptyForm);
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        form.id
          ? `/api/admin/announcements/${encodeURIComponent(form.id)}`
          : "/api/admin/announcements",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolId,
            id: form.id || undefined,
            title: form.title.trim(),
            content: form.content.trim(),
            target: form.target,
            priority: form.priority,
            category: form.category,
            postedOn: form.postedOn,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      const saved = data.announcement as BranchAnnouncementRecord;
      setMessage("Announcement sent");
      await refresh();
      setSelectedId(saved.id);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const params = new URLSearchParams({ schoolId });
    const res = await fetch(
      `/api/admin/announcements/${encodeURIComponent(id)}?${params.toString()}`,
      { method: "DELETE" }
    );
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
          title={form.id ? "Edit Announcement" : "New Announcement"}
          description="Send a notice to students, teachers, staff, parents, or everyone."
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
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? "Sending…" : form.id ? "Update" : "Send Announcement"}
              </button>
            </div>
          }
        />

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="e.g. Holiday notice / Exam schedule / Hostel rules"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Send to</label>
              <select
                value={form.target}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    target: e.target.value as AnnouncementAudience,
                  }))
                }
                className={`${fieldCls} mt-1`}
              >
                {ANNOUNCEMENT_AUDIENCES.map((audience) => (
                  <option key={audience.id} value={audience.id}>
                    {audience.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className={`${fieldCls} mt-1`}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as "normal" | "important" | "urgent",
                  }))
                }
                className={`${fieldCls} mt-1`}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
              <input
                type="date"
                value={form.postedOn}
                onChange={(e) => setForm((prev) => ({ ...prev, postedOn: e.target.value }))}
                className={`${fieldCls} mt-1`}
              />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Message</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]"
                placeholder="Write the announcement for students, teachers, and staff…"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs text-gray-700">
            This notice will be visible to{" "}
            <span className="font-bold text-[#144835]">{audienceLabel(form.target)}</span> in
            their portal / app notifications.
          </div>
        </div>
      </div>
    );
  }

  if (mode === "view" && selected) {
    return (
      <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
        <AdminPageHeader
          title={selected.title}
          description={`Sent to ${audienceLabel(selected.target)} · ${formatDate(selected.postedOn)}`}
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
                className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>
          }
        />

        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#144835]/5 border border-[#144835]/15 text-xs font-bold text-[#144835]">
              {audienceLabel(selected.target)}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600">
              {selected.category}
            </span>
            <span
              className={cn(
                "px-2.5 py-1 rounded-lg border text-xs font-bold",
                selected.priority === "urgent"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : selected.priority === "important"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
              )}
            >
              {selected.priority}
            </span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {selected.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Announcements"
        description="Send notices to students, teachers, staff, parents, or everyone."
        actions={
          <button
            type="button"
            onClick={startCreate}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
          >
            <Plus size={14} />
            New Announcement
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ANNOUNCEMENT_AUDIENCES.map((audience) => (
          <button
            key={audience.id}
            type="button"
            onClick={() =>
              setAudienceFilter((prev) => (prev === audience.id ? "all" : audience.id))
            }
            className={cn(
              "rounded-xl border bg-white p-3 text-left transition-colors",
              audienceFilter === audience.id
                ? "border-[#144835] bg-[#144835]/5"
                : "border-gray-200 hover:border-[#144835]/30"
            )}
          >
            <p className="text-[10px] font-bold uppercase text-gray-500">{audience.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">
              {counts[audience.id] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <Megaphone size={12} /> {announcements.length} notices
        </span>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonList rows={6} avatar={false} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700">No announcements yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Send a notice to students, teachers, and staff.
            </p>
            <button
              type="button"
              onClick={startCreate}
              className="mt-4 h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white"
            >
              <Plus size={14} />
              New Announcement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="px-4 py-3 flex flex-wrap items-start gap-3 hover:bg-gray-50/50"
              >
                <button
                  type="button"
                  onClick={() => openView(row)}
                  className="flex-1 min-w-[240px] text-left"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-extrabold text-gray-900">{row.title}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#144835]/5 border border-[#144835]/10 text-[10px] font-bold text-[#144835]">
                      <Users size={10} />
                      {audienceLabel(row.target)}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md border text-[10px] font-bold",
                        row.priority === "urgent"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : row.priority === "important"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                      )}
                    >
                      {row.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{row.content}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {row.category} · {formatDate(row.postedOn)}
                  </p>
                </button>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-gray-200 text-[11px] font-bold text-gray-600"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
