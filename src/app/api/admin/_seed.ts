import path from "path";
import { promises as fs } from "fs";

export async function readSeed<T = any>() {
  const filePath = path.join(process.cwd(), "src", "data", "seed.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, data: JSON.parse(raw) as T };
}

export async function writeSeed(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

