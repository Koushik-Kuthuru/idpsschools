import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3dmQ7ua_0fev-fVDgRGvn5AjqWlHASQU",
  authDomain: "idps-erp.firebaseapp.com",
  projectId: "idps-erp",
  storageBucket: "idps-erp.firebasestorage.app",
  messagingSenderId: "195177547584",
  appId: "1:195177547584:web:22554dd6b21fca2c8ddca5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  for (const sch of ["idpscherukupalli", "idpskalaburagi"]) {
    console.log(`Checking school: ${sch}`);
    const snap = await getDocs(collection(db, "schools", sch, "students"));
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`Student ID: ${doc.id}, Name: ${data.studentName}, Username: ${data.username}, Password: ${data.portalPassword}`);
    });
  }
}

check().catch(console.error);
