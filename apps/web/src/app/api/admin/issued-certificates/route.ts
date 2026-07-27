import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import { loadIssuedCertificatesRegistry } from "@/lib/issuedCertificatesRegistry";

export const GET = withAdminRoute(async (req, ctx) => {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear") || "";
  const kind = String(url.searchParams.get("kind") ?? "all").trim();
  if (!schoolSlug || !academicYear) {
    return noStoreJson({ error: "schoolId and academicYear required" }, { status: 400 });
  }
  const branchId = await resolveBranchUuid(ctx.admin, schoolSlug);
  if (!branchId) return noStoreJson({ error: "Branch not found" }, { status: 404 });

  const registry = await loadIssuedCertificatesRegistry(ctx.admin, branchId, academicYear);
  let certificates = registry?.certificates ?? [];
  if (kind && kind !== "all") {
    certificates = certificates.filter((c) => c.kind.toLowerCase() === kind.toLowerCase());
  }
  return noStoreJson({
    academicYear,
    sourceDir: registry?.sourceDir ?? null,
    count: certificates.length,
    certificates,
  });
});
