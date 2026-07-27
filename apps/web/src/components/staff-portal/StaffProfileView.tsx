"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useStaffProfile } from "@/hooks/useStaffPortalData";
import { getRoleLabel } from "@/lib/auth/roles";
import { StaffPortalError, StaffPortalLoading } from "./StaffPortalStates";

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value || "—"}</p>
    </div>
  );
}

export default function StaffProfileView() {
  const { user, role, schoolId } = useAuth();
  const { data, loading, error, refresh } = useStaffProfile(schoolId);
  const profile = data?.profile;

  return (
    <div className="max-w-2xl space-y-6 font-jost">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A]">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account details</p>
      </div>

      {loading ? <StaffPortalLoading variant="profile" label="Loading profile" /> : null}
      {error ? <StaffPortalError message={error} onRetry={refresh} /> : null}

      {!loading && !error ? (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <ProfileField label="Name" value={profile?.name || user?.displayName} />
          <ProfileField label="Employee ID" value={profile?.empId || user?.employeeId} />
          <ProfileField label="Email" value={profile?.email || user?.email} />
          <ProfileField label="Designation" value={profile?.role || user?.designation} />
          <ProfileField label="Department" value={profile?.department || user?.department} />
          <ProfileField label="Employment" value={profile?.employment} />
          <ProfileField label="Portal role" value={role ? getRoleLabel(role) : profile?.serverRole} />
          <ProfileField
            label="School"
            value={schoolId?.replace("idps", "IDPS ").toUpperCase()}
          />
        </div>
      ) : null}
    </div>
  );
}
