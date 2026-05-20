import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type PurchaseOrderStatus = "Delivered" | "Pending" | "Cancelled";

type InventoryPurchaseOrder = {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  status: PurchaseOrderStatus;
};

type SeedShape = { inventoryPurchaseOrders?: InventoryPurchaseOrder[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as PurchaseOrderStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let orders = Array.isArray(data.inventoryPurchaseOrders) ? data.inventoryPurchaseOrders : [];

    if (status) orders = orders.filter((o) => String(o.status) === String(status));
    if (q) orders = orders.filter((o) => String(o.id).toLowerCase().includes(q) || String(o.vendor).toLowerCase().includes(q));

    if (id) {
      const order = orders.find((o) => String(o.id) === String(id)) || null;
      return NextResponse.json({ order });
    }

    return NextResponse.json({ orders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<InventoryPurchaseOrder>;
    const id = String(body.id || "").trim();
    const vendor = String(body.vendor || "").trim();
    const amount = Number(body.amount || 0);
    const date = String(body.date || "").trim();
    const status = (body.status || "Pending") as PurchaseOrderStatus;

    if (!id || !vendor) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const orders = Array.isArray(data.inventoryPurchaseOrders) ? data.inventoryPurchaseOrders : [];
    if (orders.some((o) => String(o.id) === id)) return NextResponse.json({ error: "Purchase order already exists" }, { status: 409 });

    const next: InventoryPurchaseOrder = { id, vendor, amount, date, status };
    await writeSeed(filePath, { ...data, inventoryPurchaseOrders: [...orders, next] });
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

    const body = (await req.json()) as Partial<InventoryPurchaseOrder>;
    const { filePath, data } = await readSeed<SeedShape>();
    const orders = Array.isArray(data.inventoryPurchaseOrders) ? data.inventoryPurchaseOrders : [];
    const idx = orders.findIndex((o) => String(o.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

    const cur = orders[idx];
    const next: InventoryPurchaseOrder = {
      ...cur,
      vendor: body.vendor !== undefined ? String(body.vendor) : cur.vendor,
      amount: body.amount !== undefined ? Number(body.amount) : cur.amount,
      date: body.date !== undefined ? String(body.date) : cur.date,
      status: body.status !== undefined ? (body.status as PurchaseOrderStatus) : cur.status,
    };

    const updated = [...orders];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, inventoryPurchaseOrders: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

