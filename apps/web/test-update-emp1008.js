const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.resolve("/Users/koushik/idps-schools", "serviceAccount.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const branches = ["idpskalaburagi", "idpscherukupalli"];
  let updated = 0;
  
  for (const branch of branches) {
    const teachersRef = db.collection("schools").doc(branch).collection("teachers");
    
    // Check uppercase EMP1008
    let snap = await teachersRef.where("employeeId", "==", "EMP1008").get();
    if (snap.empty) {
      // Check lowercase emp1008
      snap = await teachersRef.where("employeeId", "==", "emp1008").get();
    }
    
    if (!snap.empty) {
      for (const doc of snap.docs) {
        await doc.ref.update({
          username: "emp1008",
          portalPassword: "emp1008"
        });
        console.log(`Updated teacher ${doc.id} in ${branch} branch!`);
        updated++;
      }
    } else {
      console.log(`No teacher found with EMP1008 in ${branch} branch.`);
    }
  }
  
  if (updated === 0) {
    console.log("Teacher emp1008 not found in the database!");
  }
  process.exit(0);
}

run();
