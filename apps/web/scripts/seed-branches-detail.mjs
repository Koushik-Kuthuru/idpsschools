/**
 * seed-branches-detail.mjs
 * Seeds rich branch detail data + subcollections for both schools.
 * Run: node scripts/seed-branches-detail.mjs
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const sa = JSON.parse(readFileSync(resolve(__dirname, "../serviceAccount.json"), "utf8"));
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

// ── helpers ──────────────────────────────────────────────────────────────────
const batch = () => db.batch();

function schoolRef(id) { return db.collection("schools").doc(id); }
function sub(schoolId, col) { return db.collection("schools").doc(schoolId).collection(col); }

// ── branch root documents ─────────────────────────────────────────────────────
const branches = {
  idpskalaburagi: {
    name: "IDPS Kalaburagi",
    code: "IDPS-KLB",
    city: "Kalaburagi",
    state: "Karnataka",
    region: "South",
    status: "Active",
    address: "Survey No. 45, Sedam Road, Kalaburagi, Karnataka 585105",
    phone: "+91 98765 43210",
    altPhone: "+91 98765 43211",
    email: "kalaburagi@idps.edu",
    principal: "Dr. Ramesh Kumar",
    established: "2015",
    students: 520,
    teachers: 48,
    admins: 3,
    progress: 78,
    growth: "+8.2%",
    visible: true,
    notificationsEnabled: true,
    attendance: { student: 91, staff: 96 },
    revenue: "₹48,20,000",
    outstanding: "₹3,15,000",
    expenses: "₹12,40,000",
    metrics: { revenue: 4820000, pendingFees: 315000 },
    finance: { feeCollectedMonth: 820000, feeTargetMonth: 1000000 },
    performanceBySubject: [
      { subject: "Mathematics", average: "82%" },
      { subject: "Science", average: "78%" },
      { subject: "English", average: "85%" },
      { subject: "Social Studies", average: "80%" },
      { subject: "Hindi", average: "76%" },
    ],
    performanceTrend: [
      { label: "Jun", value: 74 }, { label: "Jul", value: 76 },
      { label: "Aug", value: 78 }, { label: "Sep", value: 75 },
      { label: "Oct", value: 80 }, { label: "Nov", value: 82 },
      { label: "Dec", value: 79 }, { label: "Jan", value: 83 },
      { label: "Feb", value: 85 }, { label: "Mar", value: 84 },
    ],
    keyAdministration: [
      { name: "Dr. Ramesh Kumar", role: "Principal" },
      { name: "Mrs. Sunita Patil", role: "Vice Principal" },
      { name: "Mr. Anil Desai", role: "Admin Officer" },
    ],
    plan: {
      name: "Enterprise",
      status: "Active",
      features: ["Unlimited Students", "Full ERP Access", "Priority Support", "Custom Reports", "API Access"],
      nextBillingAt: "2026-07-01",
    },
  },

  idpscherukupalli: {
    name: "IDPS Cherukupalli",
    code: "IDPS-CKP",
    city: "Cherukupalli",
    state: "Andhra Pradesh",
    region: "South",
    status: "Active",
    address: "Plot No. 12, NH-16, Cherukupalli, Andhra Pradesh 522259",
    phone: "+91 98765 43220",
    altPhone: "+91 98765 43221",
    email: "cherukupalli@idps.edu",
    principal: "Mrs. Lakshmi Devi",
    established: "2018",
    students: 410,
    teachers: 39,
    admins: 2,
    progress: 65,
    growth: "+5.4%",
    visible: true,
    notificationsEnabled: true,
    attendance: { student: 88, staff: 94 },
    revenue: "₹36,50,000",
    outstanding: "₹4,20,000",
    expenses: "₹9,80,000",
    metrics: { revenue: 3650000, pendingFees: 420000 },
    finance: { feeCollectedMonth: 620000, feeTargetMonth: 900000 },
    performanceBySubject: [
      { subject: "Mathematics", average: "79%" },
      { subject: "Science", average: "81%" },
      { subject: "English", average: "83%" },
      { subject: "Social Studies", average: "77%" },
      { subject: "Telugu", average: "88%" },
    ],
    performanceTrend: [
      { label: "Jun", value: 70 }, { label: "Jul", value: 72 },
      { label: "Aug", value: 74 }, { label: "Sep", value: 71 },
      { label: "Oct", value: 76 }, { label: "Nov", value: 78 },
      { label: "Dec", value: 75 }, { label: "Jan", value: 80 },
      { label: "Feb", value: 82 }, { label: "Mar", value: 81 },
    ],
    keyAdministration: [
      { name: "Mrs. Lakshmi Devi", role: "Principal" },
      { name: "Mr. Venkat Rao", role: "Vice Principal" },
      { name: "Ms. Priya Sharma", role: "Admin Officer" },
    ],
    plan: {
      name: "Professional",
      status: "Active",
      features: ["Up to 600 Students", "Core ERP Modules", "Email Support", "Standard Reports"],
      nextBillingAt: "2026-07-01",
    },
  },
};

// ── subcollection data ────────────────────────────────────────────────────────
const subcollections = {
  idpskalaburagi: {
    students: [
      { firstName: "Rahul", lastName: "Sharma", grade: "10", section: "A", rollNumber: "1001", gender: "Male", status: "Active", dob: "2010-04-12", parentName: "Rajesh Sharma", parentPhone: "9876543210", email: "rahul.s@student.idps.edu", address: "12, MG Road, Kalaburagi", admissionDate: "2020-06-01", attendance: { percent: 92 } },
      { firstName: "Priya", lastName: "Patel", grade: "9", section: "B", rollNumber: "9001", gender: "Female", status: "Active", dob: "2011-08-22", parentName: "Suresh Patel", parentPhone: "9876543211", email: "priya.p@student.idps.edu", address: "45, Station Road, Kalaburagi", admissionDate: "2021-06-01", attendance: { percent: 95 } },
      { firstName: "Arjun", lastName: "Nair", grade: "8", section: "A", rollNumber: "8001", gender: "Male", status: "Active", dob: "2012-01-15", parentName: "Mohan Nair", parentPhone: "9876543212", email: "arjun.n@student.idps.edu", address: "78, Civil Lines, Kalaburagi", admissionDate: "2022-06-01", attendance: { percent: 88 } },
      { firstName: "Sneha", lastName: "Kulkarni", grade: "10", section: "B", rollNumber: "1002", gender: "Female", status: "Active", dob: "2010-11-30", parentName: "Vijay Kulkarni", parentPhone: "9876543213", email: "sneha.k@student.idps.edu", address: "23, Nehru Nagar, Kalaburagi", admissionDate: "2020-06-01", attendance: { percent: 97 } },
      { firstName: "Kiran", lastName: "Reddy", grade: "7", section: "A", rollNumber: "7001", gender: "Male", status: "Active", dob: "2013-05-18", parentName: "Srinivas Reddy", parentPhone: "9876543214", email: "kiran.r@student.idps.edu", address: "56, Gandhi Nagar, Kalaburagi", admissionDate: "2023-06-01", attendance: { percent: 90 } },
    ],
    teachers: [
      { firstName: "Amit", lastName: "Kumar", employeeId: "EMP-K01", department: "Mathematics", subject: "Math", email: "amit.k@idps.edu", phone: "9876543215", status: "Active", joinDate: "2016-07-01", qualification: "M.Sc Mathematics", experience: "9 years" },
      { firstName: "Neha", lastName: "Singh", employeeId: "EMP-K02", department: "Science", subject: "Physics", email: "neha.s@idps.edu", phone: "9876543216", status: "Active", joinDate: "2017-07-01", qualification: "M.Sc Physics", experience: "8 years" },
      { firstName: "Ravi", lastName: "Verma", employeeId: "EMP-K03", department: "Languages", subject: "English", email: "ravi.v@idps.edu", phone: "9876543217", status: "Active", joinDate: "2018-07-01", qualification: "MA English", experience: "7 years" },
      { firstName: "Meena", lastName: "Joshi", employeeId: "EMP-K04", department: "Social Studies", subject: "History", email: "meena.j@idps.edu", phone: "9876543218", status: "Active", joinDate: "2019-07-01", qualification: "MA History", experience: "6 years" },
    ],
    classes: [
      { grade: "10", section: "A", room: "101", capacity: 40, classTeacher: "Amit Kumar", students: 38 },
      { grade: "10", section: "B", room: "102", capacity: 40, classTeacher: "Neha Singh", students: 36 },
      { grade: "9", section: "A", room: "103", capacity: 40, classTeacher: "Ravi Verma", students: 40 },
      { grade: "9", section: "B", room: "104", capacity: 40, classTeacher: "Meena Joshi", students: 37 },
      { grade: "8", section: "A", room: "105", capacity: 35, classTeacher: "Amit Kumar", students: 34 },
    ],
    activity: [
      { text: "Annual Sports Day conducted successfully", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { text: "Mid-term exam results published for Grade 10", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { text: "New student Rahul Sharma enrolled in Grade 10-A", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { text: "Fee collection drive: ₹2.4L collected this week", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { text: "Parent-Teacher Meeting scheduled for June 15", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
    transactions: [
      { ref: "TXN-K001", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "Fee Collection – Grade 10", amount: "₹45,000", status: "Completed" },
      { ref: "TXN-K002", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "Salary Disbursement – May", amount: "₹3,20,000", status: "Completed" },
      { ref: "TXN-K003", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Lab Equipment Purchase", amount: "₹28,500", status: "Completed" },
      { ref: "TXN-K004", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), description: "Fee Collection – Grade 9", amount: "₹38,000", status: "Completed" },
      { ref: "TXN-K005", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: "Electricity Bill – May", amount: "₹12,400", status: "Completed" },
    ],
  },

  idpscherukupalli: {
    students: [
      { firstName: "Kavya", lastName: "Reddy", grade: "8", section: "A", rollNumber: "8001", gender: "Female", status: "Active", dob: "2012-03-10", parentName: "Venkat Reddy", parentPhone: "9876543220", email: "kavya.r@student.idps.edu", address: "34, Main Road, Cherukupalli", admissionDate: "2022-06-01", attendance: { percent: 93 } },
      { firstName: "Arjun", lastName: "Rao", grade: "10", section: "C", rollNumber: "1003", gender: "Male", status: "Active", dob: "2010-07-25", parentName: "Ramesh Rao", parentPhone: "9876543221", email: "arjun.r@student.idps.edu", address: "67, NH-16, Cherukupalli", admissionDate: "2020-06-01", attendance: { percent: 89 } },
      { firstName: "Divya", lastName: "Naidu", grade: "9", section: "A", rollNumber: "9001", gender: "Female", status: "Active", dob: "2011-12-05", parentName: "Krishna Naidu", parentPhone: "9876543222", email: "divya.n@student.idps.edu", address: "12, Temple Street, Cherukupalli", admissionDate: "2021-06-01", attendance: { percent: 96 } },
      { firstName: "Sai", lastName: "Krishna", grade: "7", section: "B", rollNumber: "7002", gender: "Male", status: "Active", dob: "2013-09-14", parentName: "Suresh Krishna", parentPhone: "9876543223", email: "sai.k@student.idps.edu", address: "89, Bus Stand Road, Cherukupalli", admissionDate: "2023-06-01", attendance: { percent: 85 } },
    ],
    teachers: [
      { firstName: "Suresh", lastName: "Babu", employeeId: "EMP-C01", department: "Science", subject: "Physics", email: "suresh.b@idps.edu", phone: "9876543224", status: "Active", joinDate: "2019-07-01", qualification: "M.Sc Physics", experience: "6 years" },
      { firstName: "Lakshmi", lastName: "Narayana", employeeId: "EMP-C02", department: "Languages", subject: "English", email: "lakshmi.n@idps.edu", phone: "9876543225", status: "Active", joinDate: "2018-07-01", qualification: "MA English", experience: "7 years" },
      { firstName: "Prasad", lastName: "Rao", employeeId: "EMP-C03", department: "Mathematics", subject: "Math", email: "prasad.r@idps.edu", phone: "9876543226", status: "Active", joinDate: "2020-07-01", qualification: "M.Sc Mathematics", experience: "5 years" },
    ],
    classes: [
      { grade: "10", section: "C", room: "201", capacity: 40, classTeacher: "Suresh Babu", students: 35 },
      { grade: "9", section: "A", room: "202", capacity: 40, classTeacher: "Lakshmi Narayana", students: 38 },
      { grade: "8", section: "A", room: "203", capacity: 35, classTeacher: "Prasad Rao", students: 32 },
      { grade: "7", section: "B", room: "204", capacity: 35, classTeacher: "Suresh Babu", students: 30 },
    ],
    activity: [
      { text: "Telugu Language Day celebrated with cultural programs", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { text: "Science exhibition winners announced – Grade 9", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { text: "New classroom block construction completed", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { text: "Fee collection: ₹1.8L collected this week", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { text: "Staff training workshop on digital teaching tools", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
    transactions: [
      { ref: "TXN-C001", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), description: "Fee Collection – Grade 10", amount: "₹38,000", status: "Completed" },
      { ref: "TXN-C002", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "Salary Disbursement – May", amount: "₹2,60,000", status: "Completed" },
      { ref: "TXN-C003", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Furniture Purchase", amount: "₹18,000", status: "Completed" },
      { ref: "TXN-C004", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), description: "Fee Collection – Grade 9", amount: "₹32,000", status: "Completed" },
      { ref: "TXN-C005", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: "Water & Electricity – May", amount: "₹9,800", status: "Completed" },
    ],
  },
};

// ── seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  for (const [schoolId, branchData] of Object.entries(branches)) {
    console.log(`\n📚 Seeding ${schoolId}...`);

    // Root document
    await schoolRef(schoolId).set(branchData, { merge: true });
    console.log(`  ✅ Root document updated`);

    // Subcollections
    const subs = subcollections[schoolId];
    for (const [colName, docs] of Object.entries(subs)) {
      const colRef = sub(schoolId, colName);
      let b = db.batch();
      let count = 0;
      for (const docData of docs) {
        b.set(colRef.doc(), docData);
        count++;
        // Firestore batch limit is 500
        if (count % 400 === 0) { await b.commit(); b = db.batch(); }
      }
      await b.commit();
      console.log(`  ✅ ${colName}: ${docs.length} docs`);
    }
  }

  console.log(`
✅ All done! Both branches seeded with:
   • Root document (attendance, revenue, performance, plan, key admin)
   • students, teachers, classes, activity, transactions subcollections
`);
  process.exit(0);
}

seed().catch(e => { console.error("❌", e.message); process.exit(1); });
