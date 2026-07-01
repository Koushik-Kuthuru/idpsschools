#!/usr/bin/env node
/**
 * Apply quarterly transport fees (₹15,000 below 7km / ₹23,000 above 7km)
 * to transportDetails.fees and feeDetails.feeGrid TRANSPORT FEE for all bus users.
 *
 * Usage:
 *   node scripts/apply-transport-quarterly-fees.mjs --dry-run
 *   node scripts/apply-transport-quarterly-fees.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolveBranchId } from "./lib/resolve-branch.mjs";
import {
  buildQuarterlyTransportFeeValues,
  transportSlabFromStop,
  upsertTransportFeeRow,
} from "./lib/transport-fee-values.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROFILE_PREFIX = "__student_profile__:";

dotenv.config({ path: path.join(ROOT, "apps/web/.env.local") });

const APPLY = process.argv.includes("--apply");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchAllStudents(branchId) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("id, admission_no, full_name")
      .eq("branch_id", branchId)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function loadProfiles(branchId) {
  const map = new Map();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("notices")
      .select("title, content")
      .eq("branch_id", branchId)
      .like("title", `${PROFILE_PREFIX}%`)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const id = String(row.title).slice(PROFILE_PREFIX.length);
      try {
        map.set(id, JSON.parse(String(row.content ?? "{}")));
      } catch {
        map.set(id, {});
      }
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  return map;
}

async function saveProfile(branchId, studentId, profile) {
  const title = `${PROFILE_PREFIX}${studentId}`;
  const content = JSON.stringify(profile);
  const { data: existing } = await supabase
    .from("notices")
    .select("id")
    .eq("branch_id", branchId)
    .eq("title", title)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("notices").insert({
    branch_id: branchId,
    title,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
}

async function main() {
  const branchId = await resolveBranchId(supabase, "idpscherukupalli");
  const [students, profiles] = await Promise.all([fetchAllStudents(branchId), loadProfiles(branchId)]);

  const byId = new Map(students.map((row) => [row.id, row]));
  let below = 0;
  let above = 0;
  let skipped = 0;
  let updated = 0;

  for (const [studentId, profile] of profiles.entries()) {
    const student = byId.get(studentId);
    if (!student) continue;

    const transport = profile.transportDetails ?? {};
    if (String(transport.facility ?? "").toUpperCase() !== "YES") continue;

    const slab = transportSlabFromStop(transport.stoppage);
    if (!slab) {
      skipped += 1;
      continue;
    }

    const feeValues = buildQuarterlyTransportFeeValues(transport.stoppage);
    const existingFees = Array.isArray(transport.fees) ? transport.fees.map(String) : [];
    const feeGrid = profile.feeDetails?.feeGrid;
    const nextFeeGrid = upsertTransportFeeRow(feeGrid, feeValues);

    const feesUnchanged = existingFees.length === 12 && existingFees.every((v, i) => v === feeValues[i]);
    const gridRow = nextFeeGrid.find((row) => String(row.name ?? "").toUpperCase().includes("TRANSPORT"));
    const gridValues = gridRow?.values?.map(String) ?? [];
    const gridUnchanged = gridValues.length === 12 && gridValues.every((v, i) => v === feeValues[i]);

    if (slab === "below") below += 1;
    else above += 1;

    if (feesUnchanged && gridUnchanged) continue;

    if (APPLY) {
      const nextProfile = {
        ...profile,
        transportDetails: {
          ...transport,
          fees: feeValues,
        },
        feeDetails: {
          ...(profile.feeDetails ?? {}),
          feeGrid: nextFeeGrid,
        },
      };
      await saveProfile(branchId, studentId, nextProfile);
    }
    updated += 1;
  }

  console.log("\n=== QUARTERLY TRANSPORT FEES ===");
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`Below 7 km (₹5,000 in Jul/Oct/Jan = ₹15,000/yr): ${below}`);
  console.log(`Above 7 km (₹8,000 Jul/Oct + ₹7,000 Jan = ₹23,000/yr): ${above}`);
  console.log(`Skipped (no slab on record): ${skipped}`);
  console.log(`Updated: ${updated}`);

  if (!APPLY) {
    console.log("\nRun with --apply to save transport + fee grid fees.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
