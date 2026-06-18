const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.resolve(__dirname, "serviceAccount.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const sch = "idpskalaburagi";
  const studentsSnap = await db.collection("schools").doc(sch).collection("students").limit(1).get();
  const teachersSnap = await db.collection("schools").doc(sch).collection("teachers").limit(1).get();

  console.log("=== First Student ===");
  if (!studentsSnap.empty) console.log(studentsSnap.docs[0].data());
  
  console.log("\n=== First Teacher ===");
  if (!teachersSnap.empty) console.log(teachersSnap.docs[0].data());
  
  process.exit(0);
}

run();
