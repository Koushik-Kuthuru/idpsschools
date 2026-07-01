#!/usr/bin/env node
/**
 * Creates branch_class_fee_structures table for Class Fee Structure settings.
 *
 * Usage:
 *   npm run setup:class-fee-structures-db
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

config({ path: path.join(root, "apps/web/.env.local") });
config({ path: path.join(root, ".env.local") });

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

const migrationPath = path.join(
  root,
  "supabase/migrations/20260630_branch_class_fee_structures.sql"
);
const sql = fs.readFileSync(migrationPath, "utf8");
const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  const projectRef =
    process.env.SUPABASE_PROJECT_REF ||
    projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const sqlUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : "https://supabase.com/dashboard";

  console.log("Could not resolve DATABASE_URL / SUPABASE_DB_PASSWORD.");
  console.log(`Run this SQL manually in Supabase SQL editor:\n  ${sqlUrl}\n`);
  console.log(sql);
  process.exit(1);
}

console.log("Applying branch_class_fee_structures migration…");
const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", migrationPath], {
  stdio: "inherit",
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error("Migration failed.");
  process.exit(result.status ?? 1);
}

console.log("branch_class_fee_structures table is ready.");
