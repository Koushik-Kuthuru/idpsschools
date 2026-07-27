"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Clock4,
  Eye,
  Phone,
  Printer,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { adminFetch } from "@/lib/adminApi";
import { SkeletonTableRows } from "@/components/ui/Skeleton";

export type GatePassRow = {
  id: string;
  type: string;
  date: string;
  time: string;
  takenBy: string;
  relation: string;
  mobile: string;
  message: string;
  confirmed: boolean;
  photo?: string;
  createdAt?: string;
};

type Props = {
  schoolId: string;
  studentId: string;
  academicYear?: string | null;
  studentName?: string;
  admissionNo?: string;
  grade?: string;
  section?: string;
  fatherName?: string;
  motherName?: string;
  parentPhone?: string;
};

const PASS_TYPES = ["Early Departure", "Pickup", "Medical", "Half Day", "Other"];
const RELATIONS = ["Father", "Mother", "Guardian", "Relative", "Driver", "Self", "Other"];

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function StudentGatePassesPanel({
  schoolId,
  studentId,
  academicYear,
  studentName = "",
  admissionNo = "",
  grade = "",
  section = "",
  fatherName = "",
  motherName = "",
  parentPhone = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passes, setPasses] = useState<GatePassRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "Early Departure",
    date: new Date().toISOString().slice(0, 10),
    time: nowTime(),
    takenBy: fatherName || motherName || "",
    relation: fatherName ? "Father" : motherName ? "Mother" : "Guardian",
    mobile: parentPhone || "",
    message: "",
    photo: "",
  });

  const load = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ schoolId });
      if (academicYear) params.set("academicYear", academicYear);
      const res = await adminFetch(
        `/api/admin/students/${encodeURIComponent(studentId)}/gate-passes?${params}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load gate passes");
      setPasses(Array.isArray(data.passes) ? data.passes : []);
    } catch (err) {
      setPasses([]);
      setError(err instanceof Error ? err.message : "Failed to load gate passes");
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, academicYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm({
      type: "Early Departure",
      date: new Date().toISOString().slice(0, 10),
      time: nowTime(),
      takenBy: fatherName || motherName || "",
      relation: fatherName ? "Father" : motherName ? "Mother" : "Guardian",
      mobile: parentPhone || "",
      message: "",
      photo: "",
    });
    setModalOpen(true);
  };

  const createPass = async () => {
    if (!form.takenBy.trim()) {
      setError("Taken by is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch(
        `/api/admin/students/${encodeURIComponent(studentId)}/gate-passes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolId,
            studentName,
            admissionNo,
            grade,
            section,
            academicYear: academicYear || "",
            ...form,
            confirmed: false,
            createdByName: "Admin",
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create gate pass");
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create gate pass");
    } finally {
      setSaving(false);
    }
  };

  const markConfirmed = async (passId: string) => {
    setError(null);
    try {
      const res = await adminFetch(
        `/api/admin/students/${encodeURIComponent(studentId)}/gate-passes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, id: passId, confirmed: true }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to confirm gate pass");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm gate pass");
    }
  };

  const printPass = (pass: GatePassRow) => {
    const html = `<!DOCTYPE html><html><head><title>Gate Pass</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        h1{color:#144835;font-size:18px;margin:0 0 12px}
        .row{margin:6px 0;font-size:13px}
        .label{color:#666;font-weight:700;display:inline-block;min-width:110px}
      </style></head><body>
      <h1>Gate Pass</h1>
      <div class="row"><span class="label">Student</span>${studentName || "—"}</div>
      <div class="row"><span class="label">Admission No</span>${admissionNo || "—"}</div>
      <div class="row"><span class="label">Class</span>${[grade, section].filter(Boolean).join(" · ") || "—"}</div>
      <div class="row"><span class="label">Type</span>${pass.type}</div>
      <div class="row"><span class="label">Date / Time</span>${pass.date} ${pass.time}</div>
      <div class="row"><span class="label">Taken By</span>${pass.takenBy} (${pass.relation})</div>
      <div class="row"><span class="label">Mobile</span>${pass.mobile || "—"}</div>
      <div class="row"><span class="label">Reason</span>${pass.message || "—"}</div>
      <div class="row"><span class="label">Status</span>${pass.confirmed ? "Confirmed" : "Pending"}</div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gate Pass History</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">
            Record of early departures and pickups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 inline-flex items-center justify-center"
            title="Refresh"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#144835] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0d3023] transition-all shadow-lg shadow-emerald-900/20"
          >
            <Ticket size={14} strokeWidth={2.5} />
            Generate New Pass
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
                  #
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Pass Details
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Taken By
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Reason / Message
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Gate Status
                </th>
                <th className="py-2.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                  Photo ID
                </th>
                <th className="w-12 px-2 py-2.5 text-right" aria-label="Row actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonTableRows rows={6} columns={7} />
              ) : passes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs font-bold text-gray-400 uppercase tracking-wide"
                  >
                    No Gate Passes Found
                  </td>
                </tr>
              ) : (
                passes.map((pass, idx) => (
                  <tr key={pass.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-2 px-4 text-center">
                      <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          {pass.type}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <Calendar size={10} /> {pass.date}
                          </span>
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <Clock4 size={10} /> {pass.time}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          {pass.takenBy}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase tracking-wide">
                            {pass.relation}
                          </span>
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <Phone size={10} /> {pass.mobile || "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 max-w-[200px]">
                      <p className="text-xs font-medium text-gray-600 line-clamp-2">
                        {pass.message || "—"}
                      </p>
                    </td>
                    <td className="py-2 px-4 text-center">
                      {pass.confirmed ? (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                            <ShieldCheck size={12} strokeWidth={2.5} />
                            <span className="text-xs font-bold uppercase tracking-wide">Confirmed</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400">at Gate</span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                            <ShieldAlert size={12} strokeWidth={2.5} />
                            <span className="text-xs font-bold uppercase tracking-wide">Pending</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void markConfirmed(pass.id)}
                            className="text-xs font-bold text-[#144835] hover:text-emerald-700 hover:underline uppercase tracking-wider transition-colors"
                          >
                            Mark Confirmed
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex justify-center">
                        {pass.photo ? (
                          <div className="h-10 w-14 rounded-md overflow-hidden border-2 border-gray-100 shadow-sm relative group/photo">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={pass.photo} alt="Taken By" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-[#144835]/60 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                              <Eye size={16} className="text-white" strokeWidth={2.5} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-300 uppercase">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => printPass(pass)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-[#144835] hover:text-white transition-colors shadow-sm"
                        title="Print"
                      >
                        <Printer size={14} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#144835]">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Generate Gate Pass</h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/10 text-white inline-flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Pass Type
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                >
                  {PASS_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Time
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide">
                Relation
                <select
                  value={form.relation}
                  onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                >
                  {RELATIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide sm:col-span-2">
                Taken By
                <input
                  type="text"
                  value={form.takenBy}
                  onChange={(e) => setForm((f) => ({ ...f, takenBy: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide sm:col-span-2">
                Mobile
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                  className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-gray-500 uppercase tracking-wide sm:col-span-2">
                Reason / Message
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-800"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void createPass()}
                className="px-4 py-2 rounded-xl bg-[#144835] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create Pass"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
