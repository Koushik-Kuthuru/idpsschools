#!/usr/bin/env node
/**
 * One-time migration: replace hardcoded school IDs in [schoolId] routes.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../src/app/schools/[schoolId]");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) files.push(p);
  }
  return files;
}

function ensureUseClient(content) {
  if (content.includes('"use client"') || content.includes("'use client'")) return content;
  return `"use client";\n\n${content}`;
}

function ensureImport(content, importLine) {
  if (content.includes(importLine)) return content;
  const useClient = content.match(/^["']use client["'];\s*\n/m);
  if (useClient) {
    return content.replace(useClient[0], `${useClient[0]}${importLine}\n`);
  }
  return `${importLine}\n${content}`;
}

async function migrateFile(filePath) {
  let content = await fs.readFile(filePath, "utf8");
  const original = content;

  // Skip layout files already migrated
  if (filePath.endsWith("/admin/layout.tsx") ||
      filePath.endsWith("/teachers/layout.tsx") ||
      filePath.endsWith("/students/layout.tsx") ||
      filePath.endsWith("/staff/layout.tsx")) {
    return false;
  }

  // Replace hardcoded school const
  if (/const schoolId = "(idpscherukupalli|idpskalaburagi)"/.test(content)) {
    content = content.replace(
      /const schoolId = "(idpscherukupalli|idpskalaburagi)";/g,
      "const schoolId = useSchoolId();"
    );
    content = ensureImport(content, `import { useSchoolId } from "@/hooks/useSchoolId";`);
    content = ensureUseClient(content);
  }

  // Replace useSchoolId with hardcoded fallback
  content = content.replace(
    /useSchoolId\("idpscherukupalli"\)/g,
    "useSchoolId()"
  );
  content = content.replace(
    /useSchoolId\("idpskalaburagi"\)/g,
    "useSchoolId()"
  );

  // Replace school path strings — use template with schoolId variable when present
  if (content.includes("useSchoolId")) {
    content = content.replace(/\/schools\/idpscherukupalli\//g, "`/schools/${schoolId}/");
    content = content.replace(/\/schools\/idpskalaburagi\//g, "`/schools/${schoolId}/");
    // Fix broken quotes: `...` should close properly - paths were in quotes before
    content = content.replace(/`(\/schools\/\$\{schoolId\}\/[^`"']+)"/g, "`$1`");
    content = content.replace(/"(`\/schools\/\$\{schoolId\}\/[^`]+)`/g, "$1");
  }

  // Legacy /idpscherukupalli/ paths (no /schools prefix)
  content = content.replace(
    /"\/idpscherukupalli\//g,
    "`/schools/${schoolId}/admin/"
  );
  content = content.replace(
    /"\/idpskalaburagi\//g,
    "`/schools/${schoolId}/admin/"
  );
  content = content.replace(
    /redirect\("\/idpscherukupalli\//g,
    "redirect(`/schools/${schoolId}/admin/"
  );
  content = content.replace(
    /redirect\("\/idpskalaburagi\//g,
    "redirect(`/schools/${schoolId}/admin/"
  );

  // Fix redirect missing closing backtick
  content = content.replace(/redirect\(`(\/schools\/\$\{schoolId\}\/[^)]+)\)/g, (m, p1) => {
    if (p1.endsWith("`")) return m;
    return `redirect(\`${p1}\`)`;
  });

  // schoolId prop on components
  content = content.replace(
    /schoolId="idpscherukupalli"/g,
    "schoolId={schoolId}"
  );
  content = content.replace(
    /schoolId="idpskalaburagi"/g,
    "schoolId={schoolId}"
  );

  // directoryHref and similar with full paths - for server components use params
  if (content.includes('directoryHref="/schools/idpscherukupalli') ||
      content.includes('directoryHref="/schools/idpskalaburagi')) {
    // Convert to dynamic page with params
    if (!content.includes("params")) {
      content = content.replace(
        /export default function (\w+)\(\)/,
        "export default function $1({ params }: { params: { schoolId: string } })"
      );
      content = content.replace(
        /directoryHref="\/schools\/idpscherukupalli([^"]+)"/g,
        "directoryHref={`/schools/${params.schoolId}$1`}"
      );
      content = content.replace(
        /directoryHref="\/schools\/idpskalaburagi([^"]+)"/g,
        "directoryHref={`/schools/${params.schoolId}$1`}"
      );
    }
  }

  // API paths
  content = content.replace(/\/api\/idpscherukupalli\//g, "/api/admin/");
  content = content.replace(/\/api\/idpskalaburagi\//g, "/api/admin/");

  // teachers page inline schoolId from pathname
  content = content.replace(
    /return match \? match\[1\] : "idpscherukupalli";/g,
    'return match ? match[1] : "";'
  );
  content = content.replace(
    /return match \? match\[1\] : "idpskalaburagi";/g,
    'return match ? match[1] : "";'
  );

  if (content !== original) {
    await fs.writeFile(filePath, content, "utf8");
    return true;
  }
  return false;
}

const files = await walk(ROOT);
let changed = 0;
for (const f of files) {
  if (await migrateFile(f)) {
    changed++;
    console.log("updated:", path.relative(ROOT, f));
  }
}
console.log(`\nDone. ${changed} files updated.`);
