import StaffPortalLayout from "@/components/staff-portal/StaffPortalLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StaffPortalLayout schoolId="idpscherukupalli">{children}</StaffPortalLayout>;
}
