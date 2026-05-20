import { initializeApp } from "firebase/app";
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
const db = getFirestore(app);

const SCHOOL_ID = "idpskalaburagi";

// Data Generators
const firstNamesM = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Rohan", "Kabir", "Atharv", "Rishi", "Dhruv"];
const firstNamesF = ["Aadhya", "Diya", "Ananya", "Saanvi", "Myra", "Kiara", "Ira", "Fatima", "Priya", "Neha", "Kavya", "Riya", "Sneha", "Aditi", "Zara"];
const lastNames = ["Patil", "Desai", "Joshi", "Kulkarni", "Reddy", "Sharma", "Verma", "Rao", "Nair", "Iyer", "Hegde", "Pillai", "Menon", "Bhat", "Shetty"];
const cities = ["Kalaburagi", "Bengaluru", "Hubballi", "Mysuru", "Mangaluru"];
const streets = ["MG Road", "Ring Road", "Station Road", "Temple Street", "Main Market Road", "Gandhi Nagar", "Vidya Nagar"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone() {
  return "+91 9" + randomNumber(100000000, 999999999);
}

function generateStudents(count) {
  const students = [];
  const classes = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const sections = ["A", "B", "C"];
  const subjectsList = ["Mathematics", "Science", "English", "Social Studies", "Hindi", "Kannada"];

  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? randomItem(firstNamesM) : randomItem(firstNamesF);
    const lastName = randomItem(lastNames);
    const gender = isMale ? "Male" : "Female";
    const classId = randomItem(classes);
    const section = randomItem(sections);
    
    // Generate realistic results
    const results = subjectsList.map(sub => {
      const score = randomNumber(65, 98);
      let grade = "C";
      if (score >= 90) grade = "A+";
      else if (score >= 80) grade = "A";
      else if (score >= 70) grade = "B";
      return { subject: sub, score, grade };
    });

    const gpaCalc = (results.reduce((acc, curr) => acc + curr.score, 0) / results.length) / 10;
    
    students.push({
      id: `STU-2026-${i.toString().padStart(3, '0')}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      gender,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.idps.edu`,
      phone: generatePhone(),
      enrollmentId: `ENR26${randomNumber(1000, 9999)}`,
      classId,
      section,
      rollNumber: i,
      status: Math.random() > 0.1 ? "Active" : "Inactive",
      gpa: gpaCalc.toFixed(1),
      attendance: randomNumber(75, 99),
      results,
      fatherName: `${randomItem(firstNamesM)} ${lastName}`,
      fatherPhone: generatePhone(),
      fatherEmail: `father.${lastName.toLowerCase()}@example.com`,
      motherName: `${randomItem(firstNamesF)} ${lastName}`,
      motherPhone: generatePhone(),
      motherEmail: `mother.${lastName.toLowerCase()}@example.com`,
      address: `${randomNumber(1, 999)}, ${randomItem(streets)}, ${randomItem(cities)}`,
      dob: `201${randomNumber(0, 5)}-0${randomNumber(1, 9)}-${randomNumber(10, 28)}`,
      bloodGroup: randomItem(["A+", "B+", "O+", "AB+", "A-", "O-"]),
      updatedAt: new Date().toISOString()
    });
  }
  return students;
}

function generateTeachers(count) {
  const teachers = [];
  const departments = ["Mathematics", "Science", "English", "Social Studies", "Languages", "Physical Education", "Computer Science"];
  const roles = ["Senior Teacher", "Teacher", "HOD", "Assistant Teacher"];

  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale ? randomItem(firstNamesM) : randomItem(firstNamesF);
    const lastName = randomItem(lastNames);
    const gender = isMale ? "Male" : "Female";
    const dept = randomItem(departments);

    teachers.push({
      id: `EMP-T-${randomNumber(100, 999)}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      gender,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@idps.edu`,
      phone: generatePhone(),
      department: dept,
      roleTitle: dept === "Physical Education" ? "Sports Instructor" : randomItem(roles),
      employmentType: "Full Time",
      status: Math.random() > 0.05 ? "Active" : "On Leave",
      qualifications: ["B.Ed", randomItem(["M.Sc", "M.A", "B.Sc", "B.A"])],
      joinDate: `201${randomNumber(5, 9)}-0${randomNumber(1, 9)}-15`,
      experience: `${randomNumber(2, 15)} years`,
      classLoads: [
        { grade: randomItem(["8", "9", "10"]), section: "A", subject: dept, weeklyHours: randomNumber(4, 8) },
        { grade: randomItem(["5", "6", "7"]), section: "B", subject: dept, weeklyHours: randomNumber(4, 8) }
      ],
      updatedAt: new Date().toISOString()
    });
  }
  return teachers;
}

async function main() {
  const students = generateStudents(40);
  const teachers = generateTeachers(15);

  const now = new Date().toISOString();

  for (const stu of students) {
    const ref = doc(db, "schools", SCHOOL_ID, "students", stu.id);
    await setDoc(ref, stu, { merge: true });
  }
  console.log(`✅ Seeded ${students.length} detailed students.`);

  for (const t of teachers) {
    const ref = doc(db, "schools", SCHOOL_ID, "teachers", t.id);
    await setDoc(ref, t, { merge: true });
    
    // Also save in 'employees' collection to keep consistency
    const empRef = doc(db, "schools", SCHOOL_ID, "employees", t.id);
    await setDoc(empRef, t, { merge: true });
  }
  console.log(`✅ Seeded ${teachers.length} detailed teachers/employees.`);

  console.log("�� Successfully seeded detailed realistic data for IDPS Kalaburagi!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
