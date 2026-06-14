"use client";

export default function StaffAnnouncementsPage() {
  return (
    <div className="font-jost space-y-4">
      <h1 className="text-2xl font-extrabold text-[#1A1A1A]">Announcements</h1>
      <p className="text-sm text-gray-500">School-wide notices and updates for staff.</p>
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-medium text-gray-400">
        No announcements yet.
      </div>
    </div>
  );
}
