import PrincipalPortalLayout from "@/components/principal-portal/PrincipalPortalLayout";

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrincipalPortalLayout schoolId="idpscherukupalli">{children}</PrincipalPortalLayout>;
}
