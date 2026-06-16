import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const cacheDir = path.join(os.homedir(), ".expo", "native-modules-cache");

try {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log("Cleared Expo native-modules cache");
} catch (error) {
  console.warn("Could not clear Expo cache:", error.message);
}
