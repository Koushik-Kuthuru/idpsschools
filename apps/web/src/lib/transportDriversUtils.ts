import type { BranchTransportStudentRow } from "@/lib/loadBranchStudents";
import type { TransportBusRecord } from "@/lib/branchTransportStore";

export type TransportDriverRow = {
  id: string;
  name: string;
  mobile: string;
  routes: string[];
  busNos: string[];
  studentCount: number;
};

export function slugTransportDriverId(name: string, mobile: string): string {
  const normalizedName = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const digits = String(mobile ?? "").replace(/\D/g, "");
  if (normalizedName && digits) return `${normalizedName}-${digits}`;
  if (normalizedName) return normalizedName;
  if (digits) return `driver-${digits}`;
  return "unknown-driver";
}

export function aggregateTransportDrivers(
  students: BranchTransportStudentRow[],
  buses: TransportBusRecord[] = []
): TransportDriverRow[] {
  const map = new Map<
    string,
    {
      name: string;
      mobile: string;
      routes: Set<string>;
      busNos: Set<string>;
      studentCount: number;
    }
  >();

  for (const student of students) {
    if (!student.usesTransport) continue;

    const name = student.driverName?.trim();
    const mobile = student.driverMobile?.trim();
    if (!name || name === "—") continue;

    const id = slugTransportDriverId(name, mobile ?? "");
    const entry = map.get(id) ?? {
      name,
      mobile: mobile && mobile !== "—" ? mobile : "",
      routes: new Set<string>(),
      busNos: new Set<string>(),
      studentCount: 0,
    };

    if (student.route && student.route !== "—") entry.routes.add(student.route);
    if (student.busNo && student.busNo !== "—") entry.busNos.add(student.busNo);
    entry.studentCount += 1;
    map.set(id, entry);
  }

  const routeToBus = new Map<string, string>();
  for (const bus of buses) {
    if (bus.status === "Inactive" || !bus.route) continue;
    if (!routeToBus.has(bus.route)) routeToBus.set(bus.route, bus.busNo);
  }

  return [...map.entries()]
    .map(([id, entry]) => {
      const routes = [...entry.routes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const busNos = [...entry.busNos];
      for (const route of routes) {
        const busNo = routeToBus.get(route);
        if (busNo && !busNos.includes(busNo)) busNos.push(busNo);
      }

      return {
        id,
        name: entry.name,
        mobile: entry.mobile,
        routes,
        busNos: busNos.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        studentCount: entry.studentCount,
      } satisfies TransportDriverRow;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
