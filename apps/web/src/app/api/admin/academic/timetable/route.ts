import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

type TimetableSlot = {
  subject: string;
  room: string;
  accent: "emerald" | "blue" | "orange" | "purple";
};
type Timetable = Record<string, Record<string, TimetableSlot>>;

type SeedShape = {
  seedTimetable?: Timetable;
  timetableSchedules?: {
    term?: Record<string, Timetable>;
    month?: Record<string, Timetable>;
    date?: Record<string, Timetable>;
  };
};

async function readSeed() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as SeedShape };
}

async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "term").toLowerCase() as "term" | "month" | "date";
    const key = (url.searchParams.get("key") || "").trim();
    const { data } = await readSeed();
    const base = data.seedTimetable || {};
    const schedules = data.timetableSchedules || { term: {}, month: {}, date: {} };
    if (!key) {
      return NextResponse.json({ timetable: base, source: "base" });
    }
    const scoped = (schedules[scope] || {}) as Record<string, Timetable>;
    const found = scoped[key];
    return NextResponse.json({ timetable: found || base, source: found ? "custom" : "base" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "term").toLowerCase() as "term" | "month" | "date";
    const key = (url.searchParams.get("key") || "").trim();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }
    const payload = (await req.json()) as { timetable: Timetable };
    const { filePath, data } = await readSeed();
    const schedules = data.timetableSchedules || { term: {}, month: {}, date: {} };
    const scoped = (schedules[scope] || {}) as Record<string, Timetable>;
    scoped[key] = payload.timetable;
    const nextSeed = {
      ...data,
      timetableSchedules: {
        ...schedules,
        [scope]: scoped,
      },
    };
    await writeSeed(filePath, nextSeed);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
