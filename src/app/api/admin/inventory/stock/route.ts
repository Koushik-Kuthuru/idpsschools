import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type InventoryStockItem = {
  id: string;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
};

type SeedShape = { inventoryStock?: InventoryStockItem[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const category = url.searchParams.get("category");
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let items = Array.isArray(data.inventoryStock) ? data.inventoryStock : [];

    if (category) items = items.filter((x) => String(x.category) === String(category));
    if (q) items = items.filter((x) => String(x.id).toLowerCase().includes(q) || String(x.item).toLowerCase().includes(q));

    if (id) {
      const item = items.find((x) => String(x.id) === String(id)) || null;
      return NextResponse.json({ item });
    }

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<InventoryStockItem>;
    const id = String(body.id || "").trim();
    const item = String(body.item || "").trim();
    const category = String(body.category || "").trim();
    const quantity = Number(body.quantity || 0);
    const unit = String(body.unit || "").trim();
    const reorderLevel = Number(body.reorderLevel || 0);

    if (!id || !item) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const items = Array.isArray(data.inventoryStock) ? data.inventoryStock : [];
    if (items.some((x) => String(x.id) === id)) return NextResponse.json({ error: "Stock item already exists" }, { status: 409 });

    const next: InventoryStockItem = { id, item, category, quantity, unit, reorderLevel };
    await writeSeed(filePath, { ...data, inventoryStock: [...items, next] });
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

    const body = (await req.json()) as Partial<InventoryStockItem>;
    const { filePath, data } = await readSeed<SeedShape>();
    const items = Array.isArray(data.inventoryStock) ? data.inventoryStock : [];
    const idx = items.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Stock item not found" }, { status: 404 });

    const cur = items[idx];
    const next: InventoryStockItem = {
      ...cur,
      item: body.item !== undefined ? String(body.item) : cur.item,
      category: body.category !== undefined ? String(body.category) : cur.category,
      quantity: body.quantity !== undefined ? Number(body.quantity) : cur.quantity,
      unit: body.unit !== undefined ? String(body.unit) : cur.unit,
      reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : cur.reorderLevel,
    };

    const updated = [...items];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, inventoryStock: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

