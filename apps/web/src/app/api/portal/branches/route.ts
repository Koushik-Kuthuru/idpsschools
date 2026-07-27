import { NextRequest, NextResponse } from "next/server";
import { BRANCH_SEARCH_RADIUS_KM, listBranchesNear } from "@/lib/schools";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const radiusRaw = searchParams.get("radiusKm");

  const latitude = latRaw != null ? Number(latRaw) : null;
  const longitude = lngRaw != null ? Number(lngRaw) : null;
  const radiusKm = radiusRaw != null ? Number(radiusRaw) : BRANCH_SEARCH_RADIUS_KM;

  const branches = listBranchesNear(
    Number.isFinite(latitude) ? latitude : null,
    Number.isFinite(longitude) ? longitude : null,
    Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : BRANCH_SEARCH_RADIUS_KM,
  );

  const locationProvided = Number.isFinite(latitude) && Number.isFinite(longitude);

  return NextResponse.json(
    {
      branches,
      radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : BRANCH_SEARCH_RADIUS_KM,
      locationProvided,
    },
    {
      headers: {
        // Public catalog — short CDN cache; location queries stay private-ish via vary.
        "Cache-Control": locationProvided
          ? "private, max-age=60"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
