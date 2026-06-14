import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type FeeStructureStatus = "Active" | "Draft";

type FinanceFeeStructure = {
  id: string;
  grade: string;
  tuition: number;
  sports: number;
  transport: number;
  others: number;
  students: number;
  status: FeeStructureStatus;
  academicYear: string;
};

type FinanceFeeCollection = {
  id: string;
  grade: string;
  expected: number;
  collected: number;
  pending: number;
  progress: number;
};

type SeedShape = {
  financeFeeStructures?: FinanceFeeStructure[];
  financeFeeCollections?: FinanceFeeCollection[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const { data } = await readSeed<SeedShape>();
    const structures = Array.isArray(data.financeFeeStructures) ? data.financeFeeStructures : [];
    const collections = Array.isArray(data.financeFeeCollections) ? data.financeFeeCollections : [];

    if (type === "structures") return NextResponse.json({ structures });
    if (type === "collections") return NextResponse.json({ collections });
    return NextResponse.json({ structures, collections });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const body = (await req.json()) as any;
    const { filePath, data } = await readSeed<SeedShape>();

    if (type === "structures") {
      const structures = Array.isArray(data.financeFeeStructures) ? data.financeFeeStructures : [];
      const next: FinanceFeeStructure = {
        id: String(body.id || "").trim(),
        grade: String(body.grade || "").trim(),
        tuition: Number(body.tuition || 0),
        sports: Number(body.sports || 0),
        transport: Number(body.transport || 0),
        others: Number(body.others || 0),
        students: Number(body.students || 0),
        status: (body.status || "Draft") as FeeStructureStatus,
        academicYear: String(body.academicYear || "").trim(),
      };
      if (!next.id || !next.grade) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      if (structures.some((s) => String(s.id) === next.id)) return NextResponse.json({ error: "Fee structure already exists" }, { status: 409 });
      await writeSeed(filePath, { ...data, financeFeeStructures: [...structures, next] });
      return NextResponse.json({ ok: true, id: next.id });
    }

    if (type === "collections") {
      const collections = Array.isArray(data.financeFeeCollections) ? data.financeFeeCollections : [];
      const next: FinanceFeeCollection = {
        id: String(body.id || "").trim(),
        grade: String(body.grade || "").trim(),
        expected: Number(body.expected || 0),
        collected: Number(body.collected || 0),
        pending: Number(body.pending || 0),
        progress: Number(body.progress || 0),
      };
      if (!next.id || !next.grade) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      if (collections.some((c) => String(c.id) === next.id)) return NextResponse.json({ error: "Collection row already exists" }, { status: 409 });
      await writeSeed(filePath, { ...data, financeFeeCollections: [...collections, next] });
      return NextResponse.json({ ok: true, id: next.id });
    }

    return NextResponse.json({ error: "Missing type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

