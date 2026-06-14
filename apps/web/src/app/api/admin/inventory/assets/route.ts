import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type AssetStatus = "In Use" | "In Repair" | "Retired";

type InventoryAsset = {
  id: string;
  name: string;
  category: string;
  location: string;
  status: AssetStatus;
  purchaseDate: string;
  value: number;
};

type SeedShape = { inventoryAssets?: InventoryAsset[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status") as AssetStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let assets = Array.isArray(data.inventoryAssets) ? data.inventoryAssets : [];

    if (category) assets = assets.filter((a) => String(a.category) === String(category));
    if (status) assets = assets.filter((a) => String(a.status) === String(status));
    if (q) assets = assets.filter((a) => String(a.id).toLowerCase().includes(q) || String(a.name).toLowerCase().includes(q) || String(a.location).toLowerCase().includes(q));

    if (id) {
      const asset = assets.find((a) => String(a.id) === String(id)) || null;
      return NextResponse.json({ asset });
    }

    return NextResponse.json({ assets });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<InventoryAsset>;
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const category = String(body.category || "").trim();
    const location = String(body.location || "").trim();
    const status = (body.status || "In Use") as AssetStatus;
    const purchaseDate = String(body.purchaseDate || "").trim();
    const value = Number(body.value || 0);

    if (!id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const assets = Array.isArray(data.inventoryAssets) ? data.inventoryAssets : [];
    if (assets.some((a) => String(a.id) === id)) return NextResponse.json({ error: "Asset already exists" }, { status: 409 });

    const next: InventoryAsset = { id, name, category, location, status, purchaseDate, value };
    await writeSeed(filePath, { ...data, inventoryAssets: [...assets, next] });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = (await req.json()) as Partial<InventoryAsset>;
    const { filePath, data } = await readSeed<SeedShape>();
    const assets = Array.isArray(data.inventoryAssets) ? data.inventoryAssets : [];
    const idx = assets.findIndex((a) => String(a.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const cur = assets[idx];
    const next: InventoryAsset = {
      ...cur,
      name: body.name !== undefined ? String(body.name) : cur.name,
      category: body.category !== undefined ? String(body.category) : cur.category,
      location: body.location !== undefined ? String(body.location) : cur.location,
      status: body.status !== undefined ? (body.status as AssetStatus) : cur.status,
      purchaseDate: body.purchaseDate !== undefined ? String(body.purchaseDate) : cur.purchaseDate,
      value: body.value !== undefined ? Number(body.value) : cur.value,
    };

    const updated = [...assets];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, inventoryAssets: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

