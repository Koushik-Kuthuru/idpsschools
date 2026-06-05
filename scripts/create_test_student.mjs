import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "fs/promises";
import path from "path";

async function main() {
  const sa = JSON.parse(await readFile(path.join(process.cwd(), "serviceAccount.json"), "utf8"));
  initializeApp({
    credential: cert(sa)
  });
  const db = getFirestore();

  const schoolId = "idpscherukupalli";
  const studentRef = db.collection("schools").doc(schoolId).collection("students").doc("teststudent123");
  
  await studentRef.set({
    studentName: "Test Student",
    username: "teststudent",
    portalPassword: "testpassword",
    registrationNo: "RN123456",
    status: "Active",
    createdAt: new Date().toISOString()
  });
  
  console.log("Successfully created test student in idpscherukupalli!");
}

main().catch(console.error);
