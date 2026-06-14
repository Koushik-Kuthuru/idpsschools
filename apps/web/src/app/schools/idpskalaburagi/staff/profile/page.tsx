"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getRoleLabel } from "@/lib/auth/roles";

export default function StaffProfilePage() {
  const { user, role, schoolId } = useAuth();

  return (
    <div className="max-w-2xl space-y-6 font-jost">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account details</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Name</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{user?.displayName || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{user?.email || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Role</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{role ? getRoleLabel(role) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">School</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{schoolId || "—"}</p>
        </div>
        {user?.department ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Department</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{user.department}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
