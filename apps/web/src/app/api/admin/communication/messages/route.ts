import { NextResponse } from "next/server";
import { readSeed, writeSeed } from "../../_seed";

type MessageStatus = "Sent" | "Scheduled" | "Draft";

type CommunicationMessage = {
  id: string;
  title: string;
  channel: string;
  recipients: string;
  status: MessageStatus;
  sentAt: string;
};

type SeedShape = { communicationMessages?: CommunicationMessage[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const status = url.searchParams.get("status") as MessageStatus | null;
    const q = (url.searchParams.get("q") || "").toLowerCase();

    const { data } = await readSeed<SeedShape>();
    let messages = Array.isArray(data.communicationMessages) ? data.communicationMessages : [];

    if (status) messages = messages.filter((m) => String(m.status) === String(status));
    if (q) messages = messages.filter((m) => String(m.id).toLowerCase().includes(q) || String(m.title).toLowerCase().includes(q) || String(m.recipients).toLowerCase().includes(q));

    if (id) {
      const message = messages.find((m) => String(m.id) === String(id)) || null;
      return NextResponse.json({ message });
    }

    return NextResponse.json({ messages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CommunicationMessage>;
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const channel = String(body.channel || "").trim();
    const recipients = String(body.recipients || "").trim();
    const status = (body.status || "Draft") as MessageStatus;
    const sentAt = String(body.sentAt || "").trim();

    if (!id || !title) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const { filePath, data } = await readSeed<SeedShape>();
    const messages = Array.isArray(data.communicationMessages) ? data.communicationMessages : [];
    if (messages.some((m) => String(m.id) === id)) return NextResponse.json({ error: "Message already exists" }, { status: 409 });

    const next: CommunicationMessage = { id, title, channel, recipients, status, sentAt };
    await writeSeed(filePath, { ...data, communicationMessages: [...messages, next] });
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

    const body = (await req.json()) as Partial<CommunicationMessage>;
    const { filePath, data } = await readSeed<SeedShape>();
    const messages = Array.isArray(data.communicationMessages) ? data.communicationMessages : [];
    const idx = messages.findIndex((m) => String(m.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const cur = messages[idx];
    const next: CommunicationMessage = {
      ...cur,
      title: body.title !== undefined ? String(body.title) : cur.title,
      channel: body.channel !== undefined ? String(body.channel) : cur.channel,
      recipients: body.recipients !== undefined ? String(body.recipients) : cur.recipients,
      status: body.status !== undefined ? (body.status as MessageStatus) : cur.status,
      sentAt: body.sentAt !== undefined ? String(body.sentAt) : cur.sentAt,
    };

    const updated = [...messages];
    updated[idx] = next;
    await writeSeed(filePath, { ...data, communicationMessages: updated });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

