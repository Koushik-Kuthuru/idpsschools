#!/usr/bin/env node
/**
 * Maps idpscherukupalli / idpskalaburagi → branch UUIDs.
 * Writes to branches.slug (if column exists) and a system notices map (always).
 *
 * Usage: npm run setup:branch-slugs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { BRANCH_SLUGS } from "./lib/resolve-branch.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, "apps/web/.env.local") });
config({ path: path.join(root, ".env.local") });

const SLUG_MAP_NOTICE = "__branch_slug_map__";

function projectRefFromSupabaseUrl(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const password =
    process.env.SUPABASE_DB_PASSWORD ||
    process.env.SUPABASE_DATABASE_PASSWORD ||
    process.env.POSTGRES_PASSWORD;

  if (!password) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const projectRef = process.env.SUPABASE_PROJECT_REF || projectRefFromSupabaseUrl(supabaseUrl);
  if (!projectRef) return null;

  const host = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
  const port = process.env.SUPABASE_DB_PORT || "5432";
  const user = process.env.SUPABASE_DB_USER || "postgres";
  const database = process.env.SUPABASE_DB_NAME || "postgres";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function applySlugColumnMigration() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) return false;

  const migrationPath = path.join(root, "supabase/migrations/20260627150000_branch_slugs.sql");
  const ddl = fs.readFileSync(migrationPath, "utf8");

  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(databaseUrl, { max: 1, ssl: "require" });
    try {
      await sql.unsafe(ddl);
    } finally {
      await sql.end();
    }
  } catch (err) {
    const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", migrationPath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(result.stderr?.trim() || err.message);
    }
  }

  console.log("Applied branches.slug migration");
  return true;
}

async function saveSlugMapNotice(admin, map) {
  const content = JSON.stringify(map);
  const hostBranchId = map[BRANCH_SLUGS.idpscherukupalli] ?? Object.values(map)[0];
  if (!hostBranchId) throw new Error("No branch IDs to attach slug map notice");

  const { data: existing, error: loadError } = await admin
    .from("notices")
    .select("id")
    .eq("title", SLUG_MAP_NOTICE)
    .eq("branch_id", hostBranchId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  if (existing?.id) {
    const { error } = await admin.from("notices").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await admin.from("notices").insert({
    branch_id: hostBranchId,
    title: SLUG_MAP_NOTICE,
    content,
    target: "system",
    posted_on: new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
}

async function resolveByName(admin, pattern, includeSlug = true) {
  const columns = includeSlug ? "id, name, slug" : "id, name";
  const { data, error } = await admin
    .from("branches")
    .select(columns)
    .ilike("name", pattern)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");

  const admin = createClient(supabaseUrl, serviceKey);

  const { error: slugProbe } = await admin.from("branches").select("slug").limit(1);
  const hasSlugColumn = slugProbe?.code !== "42703";

  if (slugProbe?.code === "42703") {
    const applied = await applySlugColumnMigration();
    if (!applied) {
      console.log("branches.slug column not present — using notices slug map only.");
      console.log("(Optional: run supabase/migrations/20260627150000_branch_slugs.sql in SQL Editor)\n");
    }
  }

  const mappings = [
    { slug: BRANCH_SLUGS.idpscherukupalli, pattern: "%cherukupalli%" },
    { slug: BRANCH_SLUGS.idpskalaburagi, pattern: "%kalaburagi%" },
  ];

  const slugMap = {};

  for (const { slug, pattern } of mappings) {
    const branch = await resolveByName(admin, pattern, hasSlugColumn);
    if (!branch?.id) {
      console.warn(`No branch for ${slug}`);
      continue;
    }

    slugMap[slug] = branch.id;

    if (hasSlugColumn) {
      const { error: updateError } = await admin.from("branches").update({ slug }).eq("id", branch.id);
      if (updateError) throw new Error(updateError.message);
    }

    console.log(`${slug} → ${branch.id}  (${branch.name})`);
  }

  await saveSlugMapNotice(admin, slugMap);
  console.log("\nSaved slug map to notices (__branch_slug_map__)");
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
