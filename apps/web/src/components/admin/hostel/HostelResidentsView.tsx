"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Phone,
  Search,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";
import type { HostelRoomDoc } from "@/lib/hostelStore";

type RoomRow = HostelRoomDoc & { id: string };

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 shrink-0">
        {label}
      </span>
      <span className="text-xs font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
  );
}

export default function HostelResidentsView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studentParams = new URLSearchParams({ schoolId });
      if (academicYear) studentParams.set("academicYear", academicYear);
      const [studentsRes, roomsRes] = await Promise.all([
        adminFetch(`/api/admin/hostel/students?${studentParams.toString()}`),
        adminFetch(`/api/admin/hostel/rooms?schoolId=${encodeURIComponent(schoolId)}`),
      ]);
      const studentsData = await studentsRes.json().catch(() => ({}));
      const roomsData = await roomsRes.json().catch(() => ({}));
      if (!studentsRes.ok) throw new Error(studentsData.error || "Failed to load residents");
      if (!roomsRes.ok) throw new Error(roomsData.error || "Failed to load rooms");
      setStudents((studentsData.students ?? []) as BranchHostelStudentRow[]);
      setRooms((roomsData.rooms ?? []) as RoomRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const blocks = useMemo(() => {
    const set = new Set<string>();
    for (const room of rooms) if (room.block) set.add(room.block);
    for (const student of students) if (student.block && student.block !== "—") set.add(student.block);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [rooms, students]);

  const roomOptions = useMemo(() => {
    return rooms
      .filter((room) => room.status === "active")
      .map((room) => ({
        key: `${room.block}||${room.roomNo}`,
        block: room.block,
        roomNo: room.roomNo,
        label: `${room.block} / ${room.roomNo}`,
        capacity: room.capacity,
      }));
  }, [rooms]);

  const occupancyByRoom = useMemo(() => {
    const map = new Map<string, number>();
    for (const student of students) {
      if (!student.roomNo || student.roomNo === "—") continue;
      const key = `${student.block || "Main"}||${student.roomNo}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      if (blockFilter !== "All") {
        const block = student.block && student.block !== "—" ? student.block : "";
        if (block !== blockFilter) return false;
      }
      if (!q) return true;
      return [
        student.name,
        student.className,
        student.section,
        student.admissionNo,
        student.fatherName,
        student.motherName,
        student.parentPhone,
        student.localNumber,
        student.roomNo,
        student.block,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [students, search, blockFilter]);

  const selected = useMemo(
    () => students.find((student) => student.id === selectedId) ?? null,
    [students, selectedId]
  );

  const assignedCount = students.filter((s) => s.roomNo && s.roomNo !== "—").length;

  const assignRoom = async (studentId: string, value: string) => {
    setSavingId(studentId);
    setMessage(null);
    setError(null);
    try {
      let block = "";
      let roomNo = "";
      if (value) {
        const [b, r] = value.split("||");
        block = b ?? "";
        roomNo = r ?? "";
      }
      const res = await adminFetch("/api/admin/hostel/residents/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, studentId, block, roomNo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to assign room");
      setMessage("Room assignment saved");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign room");
    } finally {
      setSavingId(null);
    }
  };

  const roomSelect = (student: BranchHostelStudentRow) => {
    const currentKey =
      student.roomNo && student.roomNo !== "—"
        ? `${student.block && student.block !== "—" ? student.block : "Main"}||${student.roomNo}`
        : "";

    return (
      <select
        value={currentKey}
        disabled={savingId === student.id}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => assignRoom(student.id, e.target.value)}
        className="h-9 min-w-[180px] rounded-lg border border-gray-200 px-2 text-xs font-semibold disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {roomOptions.map((room) => {
          const occupied = occupancyByRoom.get(room.key) ?? 0;
          const isCurrent = room.key === currentKey;
          const full = room.capacity > 0 && occupied >= room.capacity && !isCurrent;
          return (
            <option key={room.key} value={room.key} disabled={full}>
              {room.label}
              {room.capacity
                ? ` (${occupied}/${room.capacity}${full ? " full" : ""})`
                : ` (${occupied})`}
            </option>
          );
        })}
      </select>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Hostel Residents"
        description="Boarding students, room assignments, and guardian contact details."
      />

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <Users size={12} /> {students.length} residents
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#144835]/5 text-xs font-bold text-[#144835]">
          <BedDouble size={12} /> {assignedCount} assigned
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
          {students.length - assignedCount} unassigned
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, parent, room…"
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
        {message ? <span className="text-xs font-bold text-emerald-600">{message}</span> : null}
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={5} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">
            No boarding residents found. Mark students as HOSTEL / Boarder in profiles.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Parent / Guardian</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Room assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50/50 cursor-pointer ${
                      selectedId === student.id ? "bg-[#144835]/5" : ""
                    }`}
                    onClick={() => setSelectedId(student.id)}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(student.id);
                        }}
                        className="text-left"
                      >
                        <p className="text-xs font-extrabold text-[#144835] hover:underline">
                          {student.name}
                        </p>
                        <p className="text-[11px] text-gray-500">{student.admissionNo}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {student.className}-{student.section}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-800">{student.fatherName}</p>
                      <p className="text-[11px] text-gray-500">Mother: {student.motherName}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {student.parentPhone}
                    </td>
                    <td className="px-4 py-3">
                      {roomSelect(student)}
                      {savingId === student.id ? (
                        <span className="ml-2 text-[11px] text-gray-400">Saving…</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close profile"
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedId(null)}
          />
          <aside className="relative h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Resident profile
                </p>
                <h2 className="text-lg font-extrabold text-gray-900 truncate">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.className}-{selected.section} · {selected.admissionNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-[#144835]/15 bg-[#144835]/5 p-4">
                <div className="h-12 w-12 rounded-full bg-[#144835]/10 text-[#144835] flex items-center justify-center">
                  <UserRound size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-gray-900">{selected.name}</p>
                  <p className="text-[11px] text-gray-600">
                    {selected.studentType || "HOSTEL"} · {selected.status}
                  </p>
                  <p className="text-[11px] text-gray-500">{selected.academicYear}</p>
                </div>
              </div>

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BedDouble size={14} className="text-[#144835]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">
                    Hostel details
                  </h3>
                </div>
                <InfoRow label="Block" value={selected.block} />
                <InfoRow label="Room no" value={selected.roomNo} />
                <InfoRow label="Bed no" value={selected.bedNo} />
                <InfoRow label="Local number" value={selected.localNumber} />
                <div className="pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                    Assign room
                  </p>
                  {roomSelect(selected)}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserRound size={14} className="text-[#144835]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">
                    Student details
                  </h3>
                </div>
                <InfoRow label="Admission no" value={selected.admissionNo} />
                <InfoRow label="Roll / local id" value={selected.roll} />
                <InfoRow
                  label="Class"
                  value={`${selected.className}-${selected.section}`}
                />
                <InfoRow label="Student type" value={selected.studentType || "HOSTEL"} />
                <InfoRow label="Status" value={selected.status} />
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} className="text-[#144835]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">
                    Parent details
                  </h3>
                </div>
                <InfoRow label="Father name" value={selected.fatherName} />
                <InfoRow label="Father phone" value={selected.fatherPhone} />
                <InfoRow label="Mother name" value={selected.motherName} />
                <InfoRow label="Mother phone" value={selected.motherPhone} />
                <InfoRow label="Primary contact" value={selected.parentPhone} />
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={14} className="text-[#144835]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-700">
                    Fee info
                  </h3>
                </div>
                <InfoRow label="Hostel fee" value={formatInr(selected.hostelFeeTotal)} />
                <InfoRow label="Food fee" value={formatInr(selected.foodFeeTotal)} />
                <InfoRow label="Laundry fee" value={formatInr(selected.laundryFeeTotal)} />
                <InfoRow label="Paid" value={formatInr(selected.hostelFeePaid)} />
                <InfoRow
                  label="Pending"
                  value={formatInr(
                    Math.max(
                      selected.hostelFeeTotal +
                        selected.foodFeeTotal +
                        selected.laundryFeeTotal -
                        selected.hostelFeePaid,
                      0
                    )
                  )}
                />
                <div className="pt-3">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-md border text-[11px] font-bold ${
                      selected.feeStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selected.feeStatus === "Partial"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selected.feeStatus}
                  </span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
