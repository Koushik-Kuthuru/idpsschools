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

  // Fix double backticks from bad migration
  content = content.replace(/``\/schools/g, "`/schools");
  content = content.replace(/staff``\)/g, "staff`)");
  content = content.replace(/new``\)/g, "new`)");
  content = content.replace(/leads``\)/g, "leads`)");
  content = content.replace(/enquiries``\)/g, "enquiries`)");
  content = content.replace(/messages``\)/g, "messages`)");
  content = content.replace(/stock``\)/g, "stock`)");
  content = content.replace(/assets``\)/g, "assets`)");
  content = content.replace(/purchase-orders``\)/g, "purchase-orders`)");

  if (content !== original) {
    await fs.writeFile(filePath, content, "utf8");
    console.log("fixed:", path.relative(ROOT, filePath));
  }
}
