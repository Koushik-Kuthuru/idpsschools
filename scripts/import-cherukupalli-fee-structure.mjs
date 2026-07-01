#!/usr/bin/env node
/**
 * Import class-wise fee grids from IDPS Excel into branch_class_fee_structures.
 *
 * Usage:
 *   node scripts/import-cherukupalli-fee-structure.mjs
 *   node scripts/import-cherukupalli-fee-structure.mjs --dry-run
 *   node scripts/import-cherukupalli-fee-structure.mjs --file "data/IDPS_Fee_Structure_2026_2027_Final.xlsx" --year 2026-27
 *
 * Requires branch_class_fee_structures table — run once:
 *   npm run setup:class-fee-structures-db
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseIdpsFeeStructureExcel } from "./lib/parse-idps-fee-structure-excel.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

config({ path: path.join(ROOT, "apps/web/.env.local") });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

function readArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const FILE = readArg("--file", "data/IDPS_Fee_Structure_2026_2027_Final.xlsx");
const YEAR = readArg("--year", "2026-27");
const BRANCH_SLUG = readArg("--branch", "idpscherukupalli");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in apps/web/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const filePath = path.isAbsolute(FILE) ? FILE : path.join(ROOT, FILE);
  const { resolveBranchId } = await import("./lib/resolve-branch.mjs");
  const branchId = await resolveBranchId(supabase, BRANCH_SLUG);

  const entries = parseIdpsFeeStructureExcel(filePath, YEAR);
  console.log(`Parsed ${entries.length} class fee structures from ${filePath}`);
  console.log(`Branch: ${BRANCH_SLUG} (${branchId}), year: ${YEAR}\n`);

  for (const entry of entries) {
    const tuitionTotal = entry.feeGrid
      .find((r) => r.name === "TUITION FEE")
      ?.values.reduce((s, v) => s + (parseInt(v, 10) || 0), 0);
    console.log(
      `  ${entry.excelClass.padEnd(18)} → ${entry.grade.padEnd(14)} tuition Σ ₹${tuitionTotal?.toLocaleString("en-IN") ?? 0}`
    );
  }

  if (DRY_RUN) {
    console.log("\nDry run — no database writes.");
    return;
  }

  const { error: probeError } = await supabase.from("branch_class_fee_structures").select("id").limit(1);
  if (probeError) {
    console.error(
      "\nTable branch_class_fee_structures is missing. Run:\n  npm run setup:class-fee-structures-db\n"
    );
    process.exit(1);
  }

  const now = new Date().toISOString();
  let ok = 0;
  let failed = 0;

  for (const entry of entries) {
    const row = {
      id: entry.id,
      branch_id: branchId,
      grade: entry.grade,
      academic_year: entry.academicYear,
      status: entry.status,
      fee_grid: entry.feeGrid,
      remarks: entry.remarks ?? null,
      updated_at: now,
    };

    const { error } = await supabase.from("branch_class_fee_structures").upsert(row, {
      onConflict: "branch_id,grade,academic_year",
    });

    if (error) {
      failed += 1;
      console.error(`  ✗ ${entry.grade}: ${error.message}`);
    } else {
      ok += 1;
    }
  }

  console.log(`\nDone. ${ok} saved, ${failed} failed.`);
  if (ok > 0) {
    console.log("Open Settings → Class Fee Structure and refresh to view imported grids.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
