#!/usr/bin/env node
/**
 * Creates departments + designations tables and migrates existing notices catalog into DB.
 *
 * Connection (pick one):
 *   DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
 *   SUPABASE_DB_PASSWORD=your-db-password   (uses NEXT_PUBLIC_SUPABASE_URL project ref)
 *
 * Usage:
 *   npm run setup:departments-db
 *   npm run setup:departments-db -- --branch idpskalaburagi
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, "apps/web/.env.local") });
config({ path: path.join(root, ".env.local") });

const BRANCH_SLUG = process.argv.includes("--branch")
  ? process.argv[process.argv.indexOf("--branch") + 1]
  : "idpscherukupalli";

const BRANCH_PATTERNS = {
  idpscherukupalli: "%cherukupalli%",
  idpskalaburagi: "%kalaburagi%",
};

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
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
}

function sqlEditorUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const projectRef = process.env.SUPABASE_PROJECT_REF || projectRefFromSupabaseUrl(supabaseUrl);
  if (!projectRef) return "https://supabase.com/dashboard";
  return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
}

function printManualSetupInstructions() {
  const migrationPath = path.join(
    root,
    "supabase/migrations/20260627140000_departments_designations.sql"
  );
  console.error(`
Tables not found yet. Create them with ONE of these options:

Option A — add DB password to apps/web/.env.local, then re-run:
  SUPABASE_DB_PASSWORD=your-database-password
  npm run setup:departments-db

  (Password: Supabase Dashboard → Project Settings → Database → Database password)

Option B — run SQL manually:
  1. Open: ${sqlEditorUrl()}
  2. Paste contents of: ${migrationPath}
  3. Click Run
  4. Re-run: npm run setup:departments-db
`);
}

async function applyMigrationWithPostgres(databaseUrl, ddl) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, { max: 1, ssl: "require" });
  try {
    await sql.unsafe(ddl);
    return true;
  } finally {
    await sql.end();
  }
}

function applyMigrationWithPsql(databaseUrl, ddlPath) {
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", ddlPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || "psql failed");
  }
  return true;
}

async function applyMigration() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) return false;

  const migrationPath = path.join(
    root,
    "supabase/migrations/20260627140000_departments_designations.sql"
  );
  const ddl = fs.readFileSync(migrationPath, "utf8");

  try {
    await applyMigrationWithPostgres(databaseUrl, ddl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/Cannot find package 'postgres'|ERR_MODULE_NOT_FOUND.*postgres/i.test(message)) {
      applyMigrationWithPsql(databaseUrl, migrationPath);
    } else if (/psql/i.test(message)) {
      throw err;
    } else {
      // Some Supabase projects reject node postgres SSL — try psql fallback.
      try {
        applyMigrationWithPsql(databaseUrl, migrationPath);
      } catch (psqlErr) {
        throw new Error(`${message}\npsql fallback: ${psqlErr instanceof Error ? psqlErr.message : psqlErr}`);
      }
    }
  }

  console.log("Applied migration:", migrationPath);
  return true;
}

async function migrateCatalog(admin, branchId) {
  const NOTICE = "__branch_departments_catalog__";
  const { data: notice, error } = await admin
    .from("notices")
    .select("content")
    .eq("branch_id", branchId)
    .eq("title", NOTICE)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!notice?.content) {
    console.log("No notices catalog to migrate.");
    return;
  }

  const catalog = JSON.parse(String(notice.content));
  const departments = Array.isArray(catalog.departments) ? catalog.departments : [];
  if (departments.length === 0) {
    console.log("Catalog empty — nothing to migrate.");
    return;
  }

  let deptCount = 0;
  let desigCount = 0;

  for (const dept of departments) {
    const name = String(dept.name ?? "").trim().toUpperCase();
    const slug = String(dept.id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    if (!name) continue;

    const { data: inserted, error: deptError } = await admin
      .from("departments")
      .upsert(
        { branch_id: branchId, slug, name, status: "Active" },
        { onConflict: "branch_id,slug" }
      )
      .select("id")
      .single();

    if (deptError) throw new Error(deptError.message);
    deptCount += 1;

    for (const item of dept.designations ?? []) {
      const desigName = String(item.name ?? "").trim().toUpperCase();
      const desigSlug = String(item.id ?? desigName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      if (!desigName) continue;

      const { error: desigError } = await admin.from("designations").upsert(
        {
          branch_id: branchId,
          department_id: inserted.id,
          slug: desigSlug,
          name: desigName,
          status: "Active",
        },
        { onConflict: "department_id,slug" }
      );
      if (desigError) throw new Error(desigError.message);
      desigCount += 1;
    }
  }

  console.log(`Migrated ${deptCount} departments and ${desigCount} designations from notices catalog.`);
}

async function ensureTables(admin) {
  const { error: probeError } = await admin.from("departments").select("id").limit(1);
  if (!probeError) return;

  if (probeError.code !== "PGRST205") {
    throw new Error(probeError.message);
  }

  const databaseUrl = resolveDatabaseUrl();
  if (databaseUrl) {
    await applyMigration();
    const { error: retryError } = await admin.from("departments").select("id").limit(1);
    if (retryError?.code === "PGRST205") {
      throw new Error("Migration ran but departments table is still not visible. Wait ~30s and retry.");
    }
    if (retryError) throw new Error(retryError.message);
    return;
  }

  printManualSetupInstructions();
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const pattern = BRANCH_PATTERNS[BRANCH_SLUG];
  if (!pattern) throw new Error(`Unknown branch slug: ${BRANCH_SLUG}`);

  const { data: branch, error: branchError } = await admin
    .from("branches")
    .select("id, name")
    .ilike("name", pattern)
    .maybeSingle();

  if (branchError) throw new Error(branchError.message);
  if (!branch?.id) throw new Error(`Branch not found for ${BRANCH_SLUG}`);

  console.log(`Branch: ${branch.name} (${branch.id})`);

  await ensureTables(admin);
  await migrateCatalog(admin, branch.id);

  const { count: deptCount } = await admin
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branch.id);

  const { count: desigCount } = await admin
    .from("designations")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branch.id);

  console.log(`Done. DB totals: ${deptCount ?? 0} departments, ${desigCount ?? 0} designations.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
