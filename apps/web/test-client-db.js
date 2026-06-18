const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyA3dmQ7ua_0fev-fVDgRGvn5AjqWlHASQU",
  authDomain: "idps-erp.firebaseapp.com",
  projectId: "idps-erp",
  storageBucket: "idps-erp.firebasestorage.app",
  messagingSenderId: "195177547584",
  appId: "1:195177547584:web:22554dd6b21fca2c8ddca5",
  measurementId: "G-59FJXP2FBH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const sch = "idpskalaburagi";
  const studentsSnap = await getDocs(query(collection(db, "schools", sch, "students"), limit(1)));
  const teachersSnap = await getDocs(query(collection(db, "schools", sch, "teachers"), limit(1)));

  console.log("=== First Student ===");
  if (!studentsSnap.empty) console.log(studentsSnap.docs[0].data());
  
  console.log("\n=== First Teacher ===");
  if (!teachersSnap.empty) console.log(teachersSnap.docs[0].data());
  
  process.exit(0);
}

run();
