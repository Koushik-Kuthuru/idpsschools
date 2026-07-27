"use client";

import { adminFetch } from "@/lib/adminApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Plus, Search, Trash2, UserCheck } from "lucide-react";
import AdminPageHeader from "@/components/admin/PageHeader";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYearOptional } from "@/contexts/AcademicYearContext";
import type { BranchHostelStudentRow } from "@/lib/loadBranchHostel";
import type { HostelVisitorDoc } from "@/lib/hostelStore";

type VisitorRow = HostelVisitorDoc & { id: string };

const fieldCls =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835]";

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const emptyForm = {
  visitorName: "",
  relation: "Parent",
  visitorPhone: "",
  studentId: "",
  purpose: "",
  checkIn: nowLocal(),
};

export default function HostelVisitorsView() {
  const schoolId = useSchoolId();
  const academicYear = useAcademicYearOptional()?.currentYear?.name;
  const [students, setStudents] = useState<BranchHostelStudentRow[]>([]);
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [search, setSearch] = useState("");
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
      const [studentsRes, visitorsRes] = await Promise.all([
        adminFetch(`/api/admin/hostel/students?${studentParams.toString()}`),
        adminFetch(`/api/admin/hostel/visitors?schoolId=${encodeURIComponent(schoolId)}`),
      ]);
      const studentsData = await studentsRes.json().catch(() => ({}));
      const visitorsData = await visitorsRes.json().catch(() => ({}));
      if (!studentsRes.ok) throw new Error(studentsData.error || "Failed to load students");
      if (!visitorsRes.ok) throw new Error(visitorsData.error || "Failed to load visitors");
      setStudents((studentsData.students ?? []) as BranchHostelStudentRow[]);
      setVisitors((visitorsData.visitors ?? []) as VisitorRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [schoolId, academicYear]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === form.studentId) ?? null,
    [students, form.studentId]
  );

  useEffect(() => {
    if (!selectedStudent) return;
    setForm((prev) => ({
      ...prev,
      visitorPhone: prev.visitorPhone || selectedStudent.parentPhone.replace("—", ""),
      visitorName:
        prev.relation === "Parent" && !prev.visitorName
          ? selectedStudent.fatherName.replace("—", "")
          : prev.visitorName,
    }));
  }, [selectedStudent, form.relation]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((visitor) =>
      [
        visitor.visitorName,
        visitor.studentName,
        visitor.parentName,
        visitor.parentPhone,
        visitor.visitorPhone,
        visitor.purpose,
        visitor.relation,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [visitors, search]);

  const handleSave = async () => {
    if (!selectedStudent || !form.visitorName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: HostelVisitorDoc = {
        visitorName: form.visitorName.trim(),
        relation: form.relation,
        visitorPhone: form.visitorPhone.trim() || selectedStudent.parentPhone,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        className: selectedStudent.className,
        section: selectedStudent.section,
        parentName: selectedStudent.fatherName,
        parentPhone: selectedStudent.parentPhone,
        purpose: form.purpose.trim(),
        checkIn: form.checkIn,
        checkOut: "",
        status: "inside",
      };
      const res = await adminFetch("/api/admin/hostel/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save visitor");
      setShowForm(false);
      setForm({ ...emptyForm, checkIn: nowLocal() });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const markLeft = async (visitor: VisitorRow) => {
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/hostel/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          ...visitor,
          id: visitor.id,
          checkOut: nowLocal(),
          status: "left",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (visitorId: string) => {
    if (!confirm("Delete this visitor entry?")) return;
    const params = new URLSearchParams({ schoolId, id: visitorId });
    const res = await adminFetch(`/api/admin/hostel/visitors?${params.toString()}`, {
      method: "DELETE",
    });
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
        title="Hostel Visitors"
        description="Visitor register with student and parent details."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-lg bg-[#144835] text-xs font-bold text-white hover:bg-[#144835]/90"
          >
            <Plus size={14} />
            Add Visitor
          </button>
        }
      />

      {showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">New visitor entry</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Student</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
                className={`${fieldCls} mt-1`}
              >
                <option value="">Select boarding student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.className}-{student.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Visitor name</label>
              <input
                value={form.visitorName}
                onChange={(e) => setForm((prev) => ({ ...prev, visitorName: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Parent / guardian name"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Relation</label>
              <select
                value={form.relation}
                onChange={(e) => setForm((prev) => ({ ...prev, relation: e.target.value }))}
                className={`${fieldCls} mt-1`}
              >
                <option>Parent</option>
                <option>Guardian</option>
                <option>Relative</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Visitor phone</label>
              <input
                value={form.visitorPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, visitorPhone: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Auto from parent if empty"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Purpose</label>
              <input
                value={form.purpose}
                onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                className={`${fieldCls} mt-1`}
                placeholder="Meeting / pickup / delivery"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Check-in</label>
              <input
                type="datetime-local"
                value={form.checkIn}
                onChange={(e) => setForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                className={`${fieldCls} mt-1`}
              />
            </div>
          </div>

          {selectedStudent ? (
            <div className="rounded-lg border border-[#144835]/15 bg-[#144835]/5 px-4 py-3 text-xs text-gray-700">
              <p className="font-bold text-[#144835]">Student & parent details</p>
              <p className="mt-1">
                Student: {selectedStudent.name} · {selectedStudent.className}-
                {selectedStudent.section} · Adm {selectedStudent.admissionNo}
              </p>
              <p>
                Father: {selectedStudent.fatherName} · Mother: {selectedStudent.motherName} · Phone:{" "}
                {selectedStudent.parentPhone}
              </p>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.studentId || !form.visitorName.trim()}
              className="h-9 px-4 rounded-lg bg-[#144835] text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save visitor"}
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
            placeholder="Search visitor, student, parent…"
            className="w-full h-9 rounded-lg border border-gray-200 pl-9 pr-3 text-xs font-semibold"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
          <UserCheck size={12} /> {visitors.length} entries
        </span>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} columns={6} showHeader={false} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-500">No visitors recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Visitor</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Parent details</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Purpose</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Check-in / out</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-extrabold text-gray-900">{visitor.visitorName}</p>
                      <p className="text-[11px] text-gray-500">
                        {visitor.relation} · {visitor.visitorPhone || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-800">{visitor.studentName}</p>
                      <p className="text-[11px] text-gray-500">
                        {visitor.className}-{visitor.section}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700">{visitor.parentName}</p>
                      <p className="text-[11px] text-gray-500">{visitor.parentPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{visitor.purpose || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-600">
                      <p>In: {formatDateTime(visitor.checkIn)}</p>
                      <p>Out: {visitor.checkOut ? formatDateTime(visitor.checkOut) : "—"}</p>
                      <span
                        className={`inline-flex mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          visitor.status === "inside"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {visitor.status === "inside" ? "Inside" : "Left"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {visitor.status === "inside" ? (
                          <button
                            type="button"
                            onClick={() => markLeft(visitor)}
                            className="h-8 px-2 inline-flex items-center gap-1 rounded-md border border-gray-200 text-[11px] font-bold text-gray-600 hover:text-[#144835]"
                          >
                            <LogOut size={12} />
                            Check out
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(visitor.id)}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
