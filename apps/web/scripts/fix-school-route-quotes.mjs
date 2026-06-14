#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/app/schools/[schoolId]");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith(".tsx")) files.push(p);
  }
  return files;
}

for (const filePath of await walk(ROOT)) {
  let content = await fs.readFile(filePath, "utf8");
  const original = content;

  content = content.replace(/href="(\/schools\/\$\{schoolId\}[^"]+)"/g, "href={`$1`}");

  content = content.replace(
    /`\/schools\/\$\{schoolId\}([^"`]+)"/g,
    "`/schools/${schoolId}$1`"
  );

  content = content.replace(
    /redirect\(`(\/schools\/\$\{schoolId\}[^"`]+)"\)/g,
    "redirect(`$1`)"
  );

  content = content.replace(
    /directoryHref="\/schools\/idpscherukupalli([^"]+)"/g,
    "directoryHref={`/schools/${params.schoolId}$1`}"
  );

  content = content.replace(
    /directoryHref="\/schools\/idpskalaburagi([^"]+)"/g,
    "directoryHref={`/schools/${params.schoolId}$1`}"
  );

  if (content !== original) {
    await fs.writeFile(filePath, content, "utf8");
    console.log("fixed:", path.relative(ROOT, filePath));
  }
}
