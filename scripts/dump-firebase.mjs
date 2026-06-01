import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import * as dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });
const sa = JSON.parse(readFileSync(resolve(__dirname, "../serviceAccount.json"), "utf8"));
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

const subs = ["students","teachers","classes","activity","transactions","departments","leaves","fees","invoices","payments","teaching_staff","non_teaching_staff"];

const schools = await db.collection("schools").get();
for (const s of schools.docs) {
  console.log("\n=== SCHOOL:", s.id, "===");
  console.log(JSON.stringify(s.data(), null, 2));
  for (const sub of subs) {
    const snap = await db.collection("schools").doc(s.id).collection(sub).get();
    if (!snap.empty) {
      console.log("  subcollection:", sub, "-", snap.size, "docs");
      snap.docs.slice(0,2).forEach(d => console.log("    sample:", JSON.stringify(d.data()).slice(0,120)));
    }
  }
}
process.exit(0);
