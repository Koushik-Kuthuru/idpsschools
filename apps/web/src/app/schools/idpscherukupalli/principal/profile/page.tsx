"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function PrincipalProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Principal account details</p>
      </div>
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Name</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{user?.displayName || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{user?.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Designation</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{user?.designation || "Principal"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Department</p>
          <p className="mt-1 text-sm font-bold text-gray-900">{user?.department || "—"}</p>
        </div>
      </div>
    </div>
  );
}
