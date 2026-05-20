import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
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
const auth = getAuth(app);
const db = getFirestore(app);

const testUsers = [
  { email: "super@idps.com", password: "password123", role: "super_admin", schoolId: "all" },
  { email: "admin@idpskalaburagi.com", password: "password123", role: "admin", schoolId: "idpskalaburagi" },
  { email: "teacher@idpskalaburagi.com", password: "password123", role: "teacher", schoolId: "idpskalaburagi" },
  { email: "student@idpskalaburagi.com", password: "password123", role: "student", schoolId: "idpskalaburagi" },
  { email: "admin@idpscherukupalli.com", password: "password123", role: "admin", schoolId: "idpscherukupalli" },
];

async function setupUsers() {
  console.log("Setting up test users in Firebase Auth & Firestore...");
  
  for (const u of testUsers) {
    try {
      // Create user in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
      const uid = userCredential.user.uid;
      
      console.log(`✅ Created Auth User: ${u.email} (UID: ${uid})`);
      
      // Set Role in Firestore
      if (u.role === "super_admin") {
        await setDoc(doc(db, "super_admin_users", uid), {
          id: uid,
          name: "Super Admin",
          email: u.email,
          role: u.role,
          status: "active"
        });
      } else {
        await setDoc(doc(db, "user_roles", uid), {
          id: uid,
          email: u.email,
          role: u.role,
          schoolId: u.schoolId
        });
      }
      console.log(`   -> Set Firestore role: ${u.role} for ${u.schoolId}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${u.email} already exists in Auth. (Run manually to update role if needed)`);
      } else {
        console.error(`❌ Error creating ${u.email}:`, error.message);
      }
    }
  }
  
  console.log("Done!");
  process.exit(0);
}

setupUsers();