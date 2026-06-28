#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "import-cherukupalli-staff.mjs");

const child = spawn(
  process.execPath,
  [script, "--year", "2022-23", "--file", "data/Staff Details (1).xlsx", ...process.argv.slice(2)],
  { stdio: "inherit", cwd: path.join(__dirname, "..") }
);

child.on("exit", (code) => process.exit(code ?? 0));
