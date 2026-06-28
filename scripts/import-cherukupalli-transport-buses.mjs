#!/usr/bin/env node
/**
 * Import Cherukupalli school transport fleet (official bus register).
 * Usage: npm run import:cherukupalli-transport-buses
 *        npm run import:cherukupalli-transport-buses -- --force  (overwrite existing)
 */

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveBranchId } from "./lib/resolve-branch.mjs";

const NOTICE = "__branch_transport_buses__";

/** Official Cherukupalli fleet register — bus number ↔ route mapping. */
const CHERUKUPALLI_FLEET = [
  { busNo: "AP39TT3162", route: "R1", routePrice: 0, status: "Active" },
  { busNo: "AP39TT3163", route: "R2", routePrice: 0, status: "Active" },
  { busNo: "AP39TT3164", route: "R3", routePrice: 0, status: "Active" },
  { busNo: "AP39TT3165", route: "R4", routePrice: 0, status: "Active" },
  { busNo: "AP39TT3166", route: "R5", routePrice: 0, status: "Active" },
  { busNo: "AP39UA7757", route: "R6", routePrice: 0, status: "Active" },
  { busNo: "AP39AU7759", route: "R7", routePrice: 0, status: "Active" },
  { busNo: "AP39UD1316", route: "R8", routePrice: 0, status: "Active" },
  { busNo: "AP39UD0926", route: "R9", routePrice: 0, status: "Active" },
  { busNo: "AP39UF3916", route: "R10", routePrice: 0, status: "Active" },
  { busNo: "AP39UF3917", route: "R11", routePrice: 0, status: "Active" },
  { busNo: "AP39UF1205", route: "R12", routePrice: 0, status: "Active" },
  { busNo: "AP39UF3914", route: "R13", routePrice: 0, status: "Active" },
  { busNo: "AP39UF3915", route: "R14", routePrice: 0, status: "Active" },
  { busNo: "AP39UF0939", route: "R15", routePrice: 0, status: "Active" },
  { busNo: "AP39UF0941", route: "R16", routePrice: 0, status: "Active" },
  { busNo: "AP39UF0940", route: "R17", routePrice: 0, status: "Active" },
  { busNo: "AP39UF2282", route: "R18", routePrice: 0, status: "Active" },
  { busNo: "AP39UF4612", route: "R19", routePrice: 0, status: "Active" },
  { busNo: "AP39UH9004", route: "R20", routePrice: 0, status: "Active" },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, "apps/web/.env.local") });
config({ path: path.join(root, ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const force = process.argv.includes("--force");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });
const schoolSlug = process.argv.includes("--kalaburagi") ? "idpskalaburagi" : "idpscherukupalli";
const fleet = schoolSlug === "idpscherukupalli" ? CHERUKUPALLI_FLEET : [];

if (!fleet.length) {
  console.error("No fleet register defined for", schoolSlug);
  process.exit(1);
}

const branchId = await resolveBranchId(admin, schoolSlug);
if (!branchId) {
  console.error("Branch not found for", schoolSlug);
  process.exit(1);
}

const { data: existingNotice } = await admin
  .from("notices")
  .select("content")
  .eq("branch_id", branchId)
  .eq("title", NOTICE)
  .maybeSingle();

let existing = [];
if (existingNotice?.content) {
  try {
    const parsed = JSON.parse(String(existingNotice.content));
    existing = Array.isArray(parsed?.buses) ? parsed.buses : [];
  } catch {
    existing = [];
  }
}

if (existing.length > 0 && !force) {
  console.log(`Fleet already has ${existing.length} buses for ${schoolSlug}. Use --force to replace.`);
  process.exit(0);
}

const buses = fleet.map((row, index) => ({
  id: row.busNo.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  ...row,
  sortOrder: index + 1,
}));

const payload = { buses, updatedAt: new Date().toISOString() };

const { data: row } = await admin
  .from("notices")
  .select("id")
  .eq("branch_id", branchId)
  .eq("title", NOTICE)
  .maybeSingle();

if (row?.id) {
  const { error } = await admin
    .from("notices")
    .update({ content: JSON.stringify(payload) })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
} else {
  const { error } = await admin.from("notices").insert({
    branch_id: branchId,
    title: NOTICE,
    content: JSON.stringify(payload),
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

console.log(`${force ? "Updated" : "Imported"} ${buses.length} buses for ${schoolSlug}.`);
buses.forEach((b, i) => {
  console.log(`${i + 1}\t${b.busNo}\t${b.route}\t${b.routePrice}\t${b.status}`);
});
