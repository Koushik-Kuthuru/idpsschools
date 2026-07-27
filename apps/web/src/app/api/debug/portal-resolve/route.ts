import { NextResponse } from "next/server";

/** Debug stub — keep path stable for local tooling. */
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
