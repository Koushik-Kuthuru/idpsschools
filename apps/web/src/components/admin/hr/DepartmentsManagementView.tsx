"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Search, Trash2, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import AdminPageHeader from "@/components/admin/PageHeader";
import ExportButton from "@/components/ui/ExportButton";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DepartmentRecord = {
  id: string;
  name: string;
  subtitle?: string;
  category?: "teaching" | "non_teaching";
  designations?: Array<{ id: string; name: string; staffCount: number }>;
  staffCount: number;
  status?: "Active" | "Inactive";
};

type Props = {
  academicYearLabel?: string;
  departments: DepartmentRecord[];
  loading?: boolean;
  mutating?: boolean;
  loadError?: string | null;
  onAddDepartment: (name: string) => Promise<void>;
  onUpdateDepartment: (departmentId: string, name: string) => Promise<void>;
  onDeleteDepartment: (departmentId: string) => Promise<void>;
  onAddDesignation: (departmentId: string, name: string) => Promise<void>;
  onUpdateDesignation: (
    departmentId: string,
    designationId: string,
    name: string
  ) => Promise<void>;
  onDeleteDesignation: (departmentId: string, designationId: string) => Promise<void>;
};

export default function DepartmentsManagementView({
  academicYearLabel,
  departments,
  loading,
  mutating,
  loadError,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onAddDesignation,
  onUpdateDesignation,
  onDeleteDesignation,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [designationDeptId, setDesignationDeptId] = useState("");
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDesig, setEditDesig] = useState<{
    departmentId: string;
    designationId: string;
    name: string;
  } | null>(null);
  const [saving, setSaving] = useState<"department" | "designation" | null>(null);

  const busy = Boolean(mutating);
  const listBusy = Boolean(loading);

  useEffect(() => {
    if (!designationDeptId && departments.length > 0) {
      setDesignationDeptId(departments[0].id);
    }
  }, [departments, designationDeptId]);

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        (d.designations ?? []).some((item) => item.name.toLowerCase().includes(q))
    );
  }, [departments, searchQuery]);

  const designationGroups = useMemo(() => {
    return filteredDepartments.map((dept) => ({
      id: dept.id,
      departmentName: dept.name.toUpperCase(),
      designations: dept.designations ?? [],
    }));
  }, [filteredDepartments]);

  const totalDesignations = useMemo(
    () => departments.reduce((sum, d) => sum + (d.designations?.length ?? 0), 0),
    [departments]
  );

  const totalStaff = useMemo(
    () => departments.reduce((sum, d) => sum + (d.staffCount ?? 0), 0),
    [departments]
  );

  async function handleAddDepartment(e?: React.FormEvent) {
    e?.preventDefault();
    const name = newDepartment.trim();
    if (!name || busy || listBusy) return;
    setSaving("department");
    try {
      await onAddDepartment(name);
      setNewDepartment("");
    } catch {
      // error shown via loadError
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveDepartment(departmentId: string) {
    const name = editDeptName.trim();
    if (!name || busy) return;
    try {
      await onUpdateDepartment(departmentId, name);
      setEditDeptId(null);
      setEditDeptName("");
    } catch {
      // error shown via loadError
    }
  }

  async function handleDeleteDepartment(dept: DepartmentRecord) {
    if (busy) return;
    if (
      !window.confirm(
        dept.staffCount > 0
          ? `"${dept.name}" has ${dept.staffCount} staff assigned. Delete anyway?`
          : `Delete department "${dept.name}"?`
      )
    ) {
      return;
    }
    try {
      await onDeleteDepartment(dept.id);
      if (designationDeptId === dept.id) setDesignationDeptId("");
      if (editDeptId === dept.id) {
        setEditDeptId(null);
        setEditDeptName("");
      }
    } catch {
      // error shown via loadError
    }
  }

  async function handleAddDesignation(e?: React.FormEvent) {
    e?.preventDefault();
    const name = newDesignation.trim();
    if (!name || !designationDeptId || busy || listBusy) return;
    setSaving("designation");
    try {
      await onAddDesignation(designationDeptId, name);
      setNewDesignation("");
    } catch {
      // error shown via loadError
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveDesignation() {
    if (!editDesig || busy) return;
    const name = editDesig.name.trim();
    if (!name) return;
    try {
      await onUpdateDesignation(editDesig.departmentId, editDesig.designationId, name);
      setEditDesig(null);
    } catch {
      // error shown via loadError
    }
  }

  async function handleDeleteDesignation(
    departmentId: string,
    designationId: string,
    designationName: string,
    staffCount: number
  ) {
    if (busy) return;
    if (
      !window.confirm(
        staffCount > 0
          ? `"${designationName}" has ${staffCount} staff assigned. Delete anyway?`
          : `Delete designation "${designationName}"?`
      )
    ) {
      return;
    }
    try {
      await onDeleteDesignation(departmentId, designationId);
      if (
        editDesig?.departmentId === departmentId &&
        editDesig.designationId === designationId
      ) {
        setEditDesig(null);
      }
    } catch {
      // error shown via loadError
    }
  }

  let designationIndex = 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-jost pb-10 max-w-[1600px] mx-auto">
      <AdminPageHeader
        title="Departments & Designations"
        description={
          academicYearLabel
            ? `${academicYearLabel} · ${departments.length} departments · ${totalDesignations} designations · ${totalStaff} staff`
            : "Manage departments and designations for staff"
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            className="w-full h-9 bg-gray-50/50 border border-gray-200 rounded-lg pl-9 pr-4 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] focus:bg-white transition-all"
            placeholder="Search department or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ExportButton
          data={departments}
          filename="departments-designations"
          className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          iconSize={14}
        />
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {/* Left — Departments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
            <h2 className="text-sm font-bold text-gray-800">Departments</h2>
          </div>

          <form className="p-4 border-b border-gray-100 bg-white" onSubmit={(e) => void handleAddDepartment(e)}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Department Name:</label>
                <input
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. TEACHING"
                  disabled={busy || listBusy}
                  className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs font-semibold uppercase tracking-wide text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={busy || listBusy || !newDepartment.trim()}
                className="h-9 px-5 rounded-lg bg-[#144835] text-white text-xs font-bold whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0f3628] transition-colors"
              >
                {saving === "department" ? "Adding..." : "Add Record"}
              </button>
            </div>
          </form>

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="w-12 px-3 py-2.5 text-xs font-bold text-gray-600">#</th>
                  <th className="px-3 py-2.5 text-xs font-bold text-gray-600">DepartmentName</th>
                  <th className="w-28 px-3 py-2.5 text-xs font-bold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      Loading departments...
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept, index) => (
                    <tr
                      key={dept.id}
                      className={cn(
                        "hover:bg-sky-50/40 transition-colors",
                        designationDeptId === dept.id && "bg-sky-50/60"
                      )}
                      onClick={() => setDesignationDeptId(dept.id)}
                    >
                      <td className="px-3 py-2 text-xs font-bold text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2">
                        {editDeptId === dept.id ? (
                          <input
                            value={editDeptName}
                            onChange={(e) => setEditDeptName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleSaveDepartment(dept.id);
                              if (e.key === "Escape") {
                                setEditDeptId(null);
                                setEditDeptName("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            disabled={busy}
                            className="w-full h-8 border border-[#144835]/30 rounded px-2 text-xs font-bold uppercase tracking-wide text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                          />
                        ) : (
                          <>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                              {dept.name}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                              {dept.staffCount} staff · {dept.designations?.length ?? 0} designations
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editDeptId === dept.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void handleSaveDepartment(dept.id)}
                                disabled={busy || !editDeptName.trim()}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                title="Save"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditDeptId(null);
                                  setEditDeptName("");
                                }}
                                disabled={busy}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditDeptId(dept.id);
                                  setEditDeptName(dept.name);
                                }}
                                disabled={busy}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteDepartment(dept)}
                                disabled={busy}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right — Designations grouped by department */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
            <h2 className="text-sm font-bold text-gray-800">Designations</h2>
          </div>

          <form className="p-4 border-b border-gray-100 bg-white space-y-3" onSubmit={(e) => void handleAddDesignation(e)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Department Name:</label>
                <select
                  value={designationDeptId}
                  onChange={(e) => setDesignationDeptId(e.target.value)}
                  disabled={busy || listBusy}
                  className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] appearance-none bg-white disabled:opacity-60"
                >
                  <option value="">---</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Designation Name:</label>
                <input
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="e.g. PGT ENGLISH"
                  disabled={busy || listBusy}
                  className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs font-semibold uppercase tracking-wide text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#144835]/20 focus:border-[#144835] disabled:opacity-60"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy || listBusy || !designationDeptId || !newDesignation.trim()}
              className="h-9 px-5 rounded-lg bg-[#144835] text-white text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#0f3628] transition-colors"
            >
              {saving === "designation" ? "Adding..." : "Add Record"}
            </button>
          </form>

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="w-12 px-3 py-2.5 text-xs font-bold text-gray-600">#</th>
                  <th className="px-3 py-2.5 text-xs font-bold text-gray-600">Designation Name</th>
                  <th className="w-28 px-3 py-2.5 text-xs font-bold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      Loading designations...
                    </td>
                  </tr>
                ) : designationGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-xs font-bold text-gray-400">
                      No designations found
                    </td>
                  </tr>
                ) : (
                  designationGroups.map((group) => (
                    <Fragment key={group.id}>
                      <tr className="bg-sky-100/80 border-y border-sky-200/60">
                        <td colSpan={3} className="px-3 py-2">
                          <p className="text-xs font-extrabold text-sky-900 uppercase tracking-wide">
                            {group.departmentName}
                          </p>
                        </td>
                      </tr>
                      {group.designations.length === 0 ? (
                        <tr className="border-b border-gray-100">
                          <td colSpan={3} className="px-3 py-2 text-[10px] font-medium text-gray-400 italic">
                            No designations
                          </td>
                        </tr>
                      ) : (
                        group.designations.map((item) => {
                          designationIndex += 1;
                          const rowNum = designationIndex;
                          const isEditing =
                            editDesig?.departmentId === group.id &&
                            editDesig.designationId === item.id;

                          return (
                            <tr
                              key={`${group.id}-${item.id}`}
                              className={cn(
                                "border-b border-gray-100 hover:bg-gray-50/60",
                                designationDeptId === group.id && "bg-sky-50/30"
                              )}
                            >
                              <td className="px-3 py-2 text-xs font-bold text-gray-500">{rowNum}</td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <input
                                    value={editDesig.name}
                                    onChange={(e) =>
                                      setEditDesig({ ...editDesig, name: e.target.value })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") void handleSaveDesignation();
                                      if (e.key === "Escape") setEditDesig(null);
                                    }}
                                    autoFocus
                                    disabled={busy}
                                    className="w-full h-8 border border-[#144835]/30 rounded px-2 text-xs font-bold uppercase tracking-wide text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#144835]/20"
                                  />
                                ) : (
                                  <>
                                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                      {item.name}
                                    </p>
                                    {item.staffCount > 0 && (
                                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                                        {item.staffCount} staff assigned
                                      </p>
                                    )}
                                  </>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => void handleSaveDesignation()}
                                        disabled={busy || !editDesig.name.trim()}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                        title="Save"
                                      >
                                        <Check size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditDesig(null)}
                                        disabled={busy}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        title="Cancel"
                                      >
                                        <X size={13} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleDeleteDesignation(
                                            group.id,
                                            item.id,
                                            item.name,
                                            item.staffCount
                                          )
                                        }
                                        disabled={busy}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                        title="Delete"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditDesig({
                                            departmentId: group.id,
                                            designationId: item.id,
                                            name: item.name,
                                          })
                                        }
                                        disabled={busy}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                        title="Edit"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
