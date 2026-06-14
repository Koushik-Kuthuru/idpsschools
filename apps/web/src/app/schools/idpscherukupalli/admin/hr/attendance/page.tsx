import StaffAttendanceView from "@/components/admin/hr/attendance/StaffAttendanceView";

export default async function HRStaffAttendancePage() {
  const schoolId = "idpscherukupalli";
  return <StaffAttendanceView schoolId={schoolId} />;
}
