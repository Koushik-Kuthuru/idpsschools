#!/usr/bin/env node
/** @deprecated Use scripts/import-cherukupalli-students.mjs --year 2022-23 --file "data/student Details (36).xlsx" */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "import-cherukupalli-students.mjs");
const args = [
  script,
  "--year",
  "2022-23",
  "--file",
  "data/student Details (36).xlsx",
  ...process.argv.slice(2).filter((a) => a !== "--year" && a !== "2022-23"),
];

const result = spawnSync(process.execPath, args, { stdio: "inherit", cwd: path.join(__dirname, "..") });
process.exit(result.status ?? 1);
