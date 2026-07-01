#!/usr/bin/env node
/**
 * Upsert IDPS departments and designations into Supabase (DB is source of truth).
 *
 * Usage:
 *   npm run seed:idps-departments-catalog
 *   npm run seed:idps-departments-catalog -- --branch idpskalaburagi
 *   npm run seed:idps-departments-catalog -- --all-branches
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, "apps/web/.env.local") });
config({ path: path.join(root, ".env.local") });

const args = process.argv.slice(2);
const allBranches = args.includes("--all-branches");
const branchArg = args.includes("--branch") ? args[args.indexOf("--branch") + 1] : "idpscherukupalli";

const BRANCH_SLUGS = {
  idpscherukupalli: "%cherukupalli%",
  idpskalaburagi: "%kalaburagi%",
};

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedBranch(admin, branch, seed) {
  console.log(`Branch: ${branch.name} (${branch.id})`);

  let deptCount = 0;
  let desigCount = 0;
  let desigSkipped = 0;

  for (const dept of seed) {
    const deptName = String(dept.name).trim().toUpperCase();
    const slug = slugify(deptName);
    const category = dept.category === "teaching" ? "teaching" : "non_teaching";
    const designations = [
      ...new Set(dept.designations.map((d) => String(d).trim().toUpperCase()).filter(Boolean)),
    ];

    const { data: inserted, error: deptError } = await admin
      .from("departments")
      .upsert(
        { branch_id: branch.id, slug, name: deptName, category, status: "Active" },
        { onConflict: "branch_id,slug" }
      )
      .select("id")
      .single();

    if (deptError) throw new Error(deptError.message);
    deptCount += 1;

    for (const desigName of designations) {
      const desigSlug = slugify(desigName);
      const { data: existing } = await admin
        .from("designations")
        .select("id")
        .eq("department_id", inserted.id)
        .eq("slug", desigSlug)
        .maybeSingle();

      if (existing?.id) {
        await admin
          .from("designations")
          .update({ name: desigName, status: "Active" })
          .eq("id", existing.id);
        desigSkipped += 1;
        continue;
      }

      const { error: desigError } = await admin.from("designations").insert({
        branch_id: branch.id,
        department_id: inserted.id,
        slug: desigSlug,
        name: desigName,
        status: "Active",
      });

      if (desigError) {
        if (desigError.code === "23505") {
          desigSkipped += 1;
          continue;
        }
        throw new Error(desigError.message);
      }
      desigCount += 1;
    }
  }

  const { count: totalDepts } = await admin
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branch.id);

  const { count: totalDesigs } = await admin
    .from("designations")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branch.id);

  console.log(
    `  Upserted ${deptCount} departments, added ${desigCount} designations (${desigSkipped} already existed).`
  );
  console.log(`  DB totals: ${totalDepts ?? 0} departments, ${totalDesigs ?? 0} designations.`);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  const seedPath = path.join(__dirname, "lib/idps-departments-catalog.json");
  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const admin = createClient(supabaseUrl, serviceKey);

  const slugs = allBranches ? Object.keys(BRANCH_SLUGS) : [branchArg];

  for (const slug of slugs) {
    const pattern = BRANCH_SLUGS[slug];
    if (!pattern) throw new Error(`Unknown branch slug: ${slug}`);

    const { data: branch, error: branchError } = await admin
      .from("branches")
      .select("id, name")
      .ilike("name", pattern)
      .maybeSingle();

    if (branchError) throw new Error(branchError.message);
    if (!branch?.id) throw new Error(`Branch not found for ${slug}`);

    await seedBranch(admin, branch, seed);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
