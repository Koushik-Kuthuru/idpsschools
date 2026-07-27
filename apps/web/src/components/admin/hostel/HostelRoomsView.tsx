"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, Trash2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";
import type { HostelRoomDoc } from "@/lib/hostelStore";

type RoomRow = HostelRoomDoc & { id: string };

const fieldCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

const emptyForm = {
  id: "",
  block: "Main",
  roomNo: "",
  floor: "",
  capacity: "4",
  roomType: "Standard",
  status: "active" as "active" | "maintenance",
  notes: "",
};

export default function HostelRoomsView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentParams = new URLSearchParams({ schoolId });
      if (academicYear) studentParams.set("academicYear", academicYear);
      const [roomsRes, studentsRes] = await Promise.all([
        adminFetch(`/api/admin/hostel/rooms?schoolId=${encodeURIComponent(schoolId)}`),
        adminFetch(`/api/admin/hostel/students?${studentParams.toString()}`),
      ]);
      const roomsData = await roomsRes.json().catch(() => ({}));
      const studentsData = await studentsRes.json().catch(() => ({}));
      if (!roomsRes.ok) throw new Error(roomsData.error || "Failed to load rooms");
      if (!studentsRes.ok) throw new Error(studentsData.error || "Failed to load residents");
      setRooms((roomsData.rooms ?? []) as RoomRow[]);
      setStudents((studentsData.students ?? []) as BranchHostelStudentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const occupancyByRoom = useMemo(() => {
    const map = new Map<string, BranchHostelStudentRow[]>();
    for (const student of students) {
      if (!student.roomNo || student.roomNo === "—") continue;
      const key = `${student.block && student.block !== "—" ? student.block : "Main"}||${student.roomNo}`;
      const list = map.get(key) ?? [];
      list.push(student);
      map.set(key, list);
    }
    return map;
  }, [students]);

  const blocks = useMemo(() => {
    const set = new Set(rooms.map((room) => room.block).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [rooms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (blockFilter !== "All" && room.block !== blockFilter) return false;
      if (!q) return true;
      return [room.block, room.roomNo, room.floor, room.roomType, room.notes]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rooms, search, blockFilter]);

  const totals = useMemo(() => {
    const beds = rooms.reduce((sum, room) => sum + (Number(room.capacity) || 0), 0);
    const occupied = students.filter((s) => s.roomNo && s.roomNo !== "—").length;
    return {
      rooms: rooms.length,
      beds,
      occupied,
      vacant: Math.max(beds - occupied, 0),
      blocks: blocks.length,
    };
  }, [rooms, students, blocks.length]);

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (room: RoomRow) => {
    setForm({
      id: room.id,
      block: room.block,
      roomNo: room.roomNo,
      floor: room.floor,
      capacity: String(room.capacity || 0),
      roomType: room.roomType,
      status: room.status,
      notes: room.notes,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.roomNo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/hostel/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          id: form.id || undefined,
          block: form.block.trim() || "Main",
          roomNo: form.roomNo.trim(),
          floor: form.floor.trim(),
          capacity: Number(form.capacity) || 0,
          roomType: form.roomType.trim() || "Standard",
          status: form.status,
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save room");
      setShowForm(false);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Delete this room?")) return;
    const params = new URLSearchParams({ schoolId, id: roomId });
    const res = await adminFetch(`/api/admin/hostel/rooms?${params.toString()}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to delete");
      return;
    }
    await refresh();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Rooms & Blocks"
        description="Hostel blocks, room capacity, and bed allocation."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90"
          >
            <Plus size={14} />
            Add Room
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Blocks", value: totals.blocks },
          { label: "Rooms", value: totals.rooms },
          { label: "Total beds", value: totals.beds },
          { label: "Occupied", value: totals.occupied },
          { label: "Vacant", value: totals.vacant },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">{card.label}</p>
            <p className="text-sm font-extrabold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">
            {form.id ? "Edit room" : "New room"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Block</label>
              <input
                value={form.block}
                onChange={(e) => setForm((prev) => ({ ...prev, block: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Main / A / Boys"
                list="hostel-block-options"
              />
              <datalist id="hostel-block-options">
                {blocks.map((block) => (
                  <option key={block} value={block} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Room no</label>
              <input
                value={form.roomNo}
                onChange={(e) => setForm((prev) => ({ ...prev, roomNo: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="101"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Floor</label>
              <input
                value={form.floor}
                onChange={(e) => setForm((prev) => ({ ...prev, floor: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Capacity (beds)</label>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                className={`${fieldCls} mt-1`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Room type</label>
              <select
                value={form.roomType}
                onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))}
                className={`${fieldCls} mt-1`}
              >
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Dormitory</option>
                <option>Single</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as "active" | "maintenance",
                  }))
                }
                className={`${fieldCls} mt-1`}
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.roomNo.trim()}
              className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save room"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search block or room…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <select
          value={blockFilter}
          onChange={(e) => setBlockFilter(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold"
        >
          <option value="All">All blocks</option>
          {blocks.map((block) => (
            <option key={block} value={block}>
              {block}
            </option>
          ))}
        </select>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <Building2 size={12} /> {rooms.length} rooms
        </span>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={8} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            No rooms yet. Add a block and room to start allocating beds.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Block</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Room</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Floor</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Occupancy</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Residents</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((room) => {
                  const key = `${room.block}||${room.roomNo}`;
                  const residents = occupancyByRoom.get(key) ?? [];
                  const occupied = residents.length;
                  const capacity = Number(room.capacity) || 0;
                  const full = capacity > 0 && occupied >= capacity;
                  return (
                    <tr key={room.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs font-bold text-gray-800">{room.block}</td>
                      <td className="px-4 py-3 text-xs font-extrabold text-gray-900">{room.roomNo}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{room.floor || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{room.roomType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                            full
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {occupied}/{capacity || "—"} beds
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-600 max-w-[220px]">
                        {residents.length
                          ? residents.map((r) => r.name).join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                            room.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {room.status === "active" ? "Active" : "Maintenance"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(room)}
                            className="h-8 px-2 rounded-md border border-gray-200 text-[11px] font-bold text-gray-600 hover:text-[#144835]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(room.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
