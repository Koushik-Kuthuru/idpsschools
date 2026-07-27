export type SchoolBranch = {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  latitude: number;
  longitude: number;
};

/** Default radius (km) when filtering branches by user location. */
export const BRANCH_SEARCH_RADIUS_KM = 50;

export const SCHOOL_BRANCHES: SchoolBranch[] = [
  {
    id: "idpscherukupalli",
    name: "IDPS Cherukupalli",
    city: "Cherukupalli",
    state: "Andhra Pradesh",
    slug: "idpscherukupalli",
    latitude: 16.0612,
    longitude: 80.9186,
  },
  {
    id: "idpskalaburagi",
    name: "IDPS Kalaburagi",
    city: "Kalaburagi",
    state: "Karnataka",
    slug: "idpskalaburagi",
    latitude: 17.3297,
    longitude: 76.8343,
  },
];

export type BranchWithDistance = SchoolBranch & {
  distanceKm: number | null;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Great-circle distance between two coordinates in kilometres. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function listBranchesNear(
  latitude?: number | null,
  longitude?: number | null,
  radiusKm: number = BRANCH_SEARCH_RADIUS_KM,
): BranchWithDistance[] {
  const hasCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const withDistance: BranchWithDistance[] = SCHOOL_BRANCHES.map((branch) => ({
    ...branch,
    distanceKm: hasCoords
      ? distanceKm(latitude, longitude, branch.latitude, branch.longitude)
      : null,
  }));

  if (!hasCoords) {
    return withDistance;
  }

  const nearby = withDistance.filter(
    (branch) => branch.distanceKm != null && branch.distanceKm <= radiusKm,
  );
  const list = (nearby.length > 0 ? nearby : withDistance).slice();
  list.sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
  return list;
}

export const VALID_SCHOOL_IDS = new Set(SCHOOL_BRANCHES.map((b) => b.id));

export function isValidSchoolId(schoolId: string | null | undefined): boolean {
  return Boolean(schoolId && VALID_SCHOOL_IDS.has(schoolId));
}

export function getSchoolBranch(schoolId: string): SchoolBranch | undefined {
  return SCHOOL_BRANCHES.find((b) => b.id === schoolId);
}

/** Build a path under /schools/{schoolId}/… */
export function schoolPath(schoolId: string, ...segments: string[]): string {
  const tail = segments.filter(Boolean).join("/");
  return tail ? `/schools/${schoolId}/${tail}` : `/schools/${schoolId}`;
}
