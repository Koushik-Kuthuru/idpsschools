import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("Initializing Firebase with project:", firebaseConfig.projectId);

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Mock Data to seed
const schoolsData = [
  {
    id: "SCH001",
    name: "IDPS Main Campus",
    code: "IDPS-MAIN",
    city: "Hyderabad",
    state: "Telangana",
    contact: "+91 9876543210",
    email: "admin.main@idps.com",
    status: "Active",
    students: 1250,
    teachers: 85,
    established: "2010",
    principal: "Dr. Sarah Johnson",
    board: "CBSE",
    license_expiry: "2026-03-31",
    last_audit: "2024-01-15",
    address: "123 Education Boulevard, Jubilee Hills, Hyderabad 500033",
    metrics: {
      attendance: 94.5,
      revenue: "₹1.2Cr",
      expenses: "₹85L"
    }
  },
  {
    id: "SCH002",
    name: "IDPS North Branch",
    code: "IDPS-NRTH",
    city: "Bangalore",
    state: "Karnataka",
    contact: "+91 8765432109",
    email: "admin.north@idps.com",
    status: "Active",
    students: 850,
    teachers: 60,
    established: "2015",
    principal: "Mr. Robert Chen",
    board: "ICSE",
    license_expiry: "2025-12-31",
    last_audit: "2023-11-20",
    address: "456 Learning Lane, Whitefield, Bangalore 560066",
    metrics: {
      attendance: 92.8,
      revenue: "₹85L",
      expenses: "₹60L"
    }
  },
  {
    id: "SCH003",
    name: "IDPS East Wing",
    code: "IDPS-EAST",
    city: "Chennai",
    state: "Karnataka",
    contact: "+91 7654321098",
    email: "admin.east@idps.com",
    status: "Inactive",
    students: 620,
    teachers: 45,
    established: "2018",
    principal: "Mrs. Anjali Desai",
    board: "State Board",
    license_expiry: "2024-06-30",
    last_audit: "2023-09-10",
    address: "789 Scholar Street, Adyar, Chennai 600020",
    metrics: {
      attendance: 88.5,
      revenue: "₹45L",
      expenses: "₹35L"
    }
  }
];

const superAdminUsers = [
  {
    id: "SA001",
    name: "System Admin",
    email: "admin@idps.com",
    role: "super_admin",
    status: "active",
    last_login: new Date().toISOString()
  }
];

const globalAnnouncements = [
  {
    id: "ANN001",
    title: "System Maintenance Scheduled",
    content: "The ERP system will be down for maintenance on Saturday from 2 AM to 4 AM.",
    target_schools: ["all"],
    date: new Date().toISOString(),
    priority: "high"
  }
];

async function seedDatabase() {
  try {
    console.log("Starting database seed...");
    
    // 1. Seed Schools
    console.log("Seeding schools...");
    for (const school of schoolsData) {
      // Set the main school document
      await setDoc(doc(db, "schools", school.id), school);
      console.log(`✅ Created school: ${school.name}`);
      
      // Create empty sub-collections by adding a dummy document, then deleting it
      // (Firestore doesn't actually create "empty" collections, they only exist if they have documents)
      // But we can add a configuration document for each sub-collection to initialize them
      
      const studentsRef = doc(collection(db, `schools/${school.id}/students`), "_config");
      await setDoc(studentsRef, { initialized: true, count: school.students });
      
      const teachersRef = doc(collection(db, `schools/${school.id}/teachers`), "_config");
      await setDoc(teachersRef, { initialized: true, count: school.teachers });
      
      const classesRef = doc(collection(db, `schools/${school.id}/classes`), "_config");
      await setDoc(classesRef, { initialized: true });
    }

    // 2. Seed Super Admin Users
    console.log("Seeding super admin users...");
    for (const user of superAdminUsers) {
      await setDoc(doc(db, "super_admin_users", user.id), user);
      console.log(`✅ Created super admin: ${user.email}`);
    }

    // 3. Seed Global Announcements
    console.log("Seeding global announcements...");
    for (const announcement of globalAnnouncements) {
      await setDoc(doc(db, "global_announcements", announcement.id), announcement);
      console.log(`✅ Created announcement: ${announcement.title}`);
    }

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();