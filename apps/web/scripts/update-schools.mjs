import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newSchools = [
  {
    id: "idpskalaburagi",
    name: "IDPS Kalaburagi",
    city: "Kalaburagi",
    state: "Karnataka",
    address: "IDPS Campus, Sedam Road, Kalaburagi, Karnataka 585105",
    phone: "+91 80000 12345",
    altPhone: "+91 80000 54321",
    email: "admin@idpskalaburagi.com",
    principal: "Dr. Sarah Jenkins",
    students: 1250,
    teachers: 85,
    staff: 30,
    status: "Active",
    board: "CBSE",
    established: 2015,
    revenue: "₹2.1 Cr",
    outstanding: "₹4.5 L",
    expenses: "₹85 L",
    attendance: {
      student: "94.2",
      staff: "96.5"
    },
    performance: {
      averageGrade: "A",
      passPercentage: "98.5%"
    }
  },
  {
    id: "idpscherukupalli",
    name: "IDPS Cherukupalli",
    city: "Cherukupalli",
    state: "Andhra Pradesh",
    address: "IDPS Campus, Main Road, Cherukupalli, Bapatla Dist, AP 522309",
    phone: "+91 90000 54321",
    altPhone: "+91 90000 12345",
    email: "admin@idpscherukupalli.com",
    principal: "Prof. Robert Langdon",
    students: 850,
    teachers: 60,
    staff: 20,
    status: "Active",
    board: "CBSE",
    established: 2018,
    revenue: "₹1.4 Cr",
    outstanding: "₹2.1 L",
    expenses: "₹65 L",
    attendance: {
      student: "92.8",
      staff: "95.1"
    },
    performance: {
      averageGrade: "B+",
      passPercentage: "96.2%"
    }
  }
];

async function updateSchools() {
  console.log("Updating schools in Firestore with detailed info...");
  
  try {
    const snapshot = await getDocs(collection(db, "schools"));
    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, "schools", document.id));
    }

    for (const school of newSchools) {
      const { id, ...data } = school;
      await setDoc(doc(db, "schools", id), data);
      console.log(`✅ Created Detailed School: ${school.name} (ID: ${id})`);
    }
    
    console.log("Schools update complete!");
  } catch (error) {
    console.error("Error updating schools:", error);
  }
  
  process.exit(0);
}

updateSchools();
