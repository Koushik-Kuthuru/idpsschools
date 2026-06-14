const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const schoolId = 'idpscherukupalli';

const classesList = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const sections = ['A', 'B'];

const subjectsList = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi', 'Telugu'];

const firstNames = ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Saanvi', 'Krish', 'Ishaan', 'Shaurya', 'Aadhya', 'Kiara', 'Dhruv', 'Kabir', 'Riya', 'Aarohi', 'Aditya', 'Arjun', 'Aryan', 'Neha'];
const lastNames = ['Sharma', 'Reddy', 'Patil', 'Kumar', 'Singh', 'Deshmukh', 'Rao', 'Gowda', 'Iyer', 'Nair', 'Menon', 'Jain', 'Gupta', 'Das', 'Sen'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('Starting seed process...');

  // 1. Create Classes
  console.log('Seeding Classes...');
  const classesRef = db.collection('schools').doc(schoolId).collection('classes');
  for (const grade of classesList) {
    for (const section of sections) {
      const classId = `${grade}-${section}`;
      await classesRef.doc(classId).set({
        name: `Class ${grade} ${section}`,
        grade: grade,
        section: section,
        classId: grade,
        roomNumber: `1${Math.floor(Math.random() * 90) + 10}`,
        capacity: 40,
        createdAt: new Date().toISOString()
      });
    }
  }

  // 2. Create Subjects
  console.log('Seeding Subjects...');
  const subjectsRef = db.collection('schools').doc(schoolId).collection('subjects');
  let subjectDocs = [];
  for (const grade of classesList) {
    for (const section of sections) {
      for (const sub of subjectsList) {
        if (parseInt(grade) < 6 && (sub === 'Computer Science' || sub === 'Physics')) continue; // Some logic
        const docRef = subjectsRef.doc(`${grade}-${section}-${sub.replace(/\s+/g, '')}`);
        const data = {
          name: sub,
          classId: grade,
          section: section,
          credits: Math.floor(Math.random() * 3) + 2,
          type: 'Theory',
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        await docRef.set(data);
        subjectDocs.push({ id: docRef.id, name: sub, grade, section });
      }
    }
  }

  // 3. Create 30 Teachers (Staff)
  console.log('Seeding Teachers...');
  const staffRef = db.collection('schools').doc(schoolId).collection('staff');
  const teacherIds = [];
  for (let i = 1; i <= 30; i++) {
    const fName = randomItem(firstNames);
    const lName = randomItem(lastNames);
    const teacherId = `EMP${1000 + i}`;
    const docRef = staffRef.doc(teacherId);
    
    // Assign 2-3 random subjects to this teacher
    const taughtSubjects = [];
    for(let j=0; j<3; j++) {
      const sub = randomItem(subjectDocs);
      taughtSubjects.push({
        id: sub.id,
        name: sub.name,
        class: sub.grade,
        section: sub.section
      });
    }

    await docRef.set({
      employeeId: teacherId,
      firstName: fName,
      lastName: lName,
      role: 'Teacher',
      department: randomItem(['Mathematics', 'Science', 'Languages', 'Humanities']),
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
      phone: `98${Math.floor(Math.random() * 100000000)}`,
      joiningDate: '2023-04-01',
      status: 'Active',
      qualification: 'B.Ed, M.Sc',
      subjects: taughtSubjects,
      createdAt: new Date().toISOString()
    });
    teacherIds.push(teacherId);
  }

  // 4. Create Fake Exams
  console.log('Seeding Exams...');
  const examsRef = db.collection('schools').doc(schoolId).collection('exam_types');
  const exams = ['Midterm Examination 2026', 'Final Examination 2026', 'Unit Test 1', 'Unit Test 2'];
  for (const ex of exams) {
    await examsRef.doc(ex.replace(/\s+/g, '_')).set({
      name: ex,
      academicYear: '2026-2027',
      startDate: '2026-09-15',
      endDate: '2026-09-30',
      status: 'Published'
    });
  }

  // 5. Create Students & Attendance
  console.log('Seeding Students & Attendance...');
  const studentsRef = db.collection('schools').doc(schoolId).collection('students');
  
  // Generate a bunch of dates in the past 30 days
  const today = new Date();
  const pastDates = [];
  for(let i=1; i<=30; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    if(d.getDay() !== 0) { // skip sundays
      pastDates.push(d.toISOString().split('T')[0]);
    }
  }

  let studentCount = 1;
  for (const grade of classesList) {
    for (const section of sections) {
      for (let i = 1; i <= 15; i++) { // 15 students per section
        const fName = randomItem(firstNames);
        const lName = randomItem(lastNames);
        const stId = `STU${20000 + studentCount}`;
        const docRef = studentsRef.doc(stId);
        
        // Randomly assign attendance
        const presentDates = [];
        const absentDates = [];
        for (const pd of pastDates) {
          if (Math.random() > 0.15) { // 85% attendance
            presentDates.push(pd);
          } else {
            absentDates.push(pd);
          }
        }

        await docRef.set({
          studentId: stId,
          rollNumber: i.toString(),
          firstName: fName,
          lastName: lName,
          classId: grade,
          grade: grade,
          section: section,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          dateOfBirth: `20${15 - parseInt(grade)}-05-15`,
          bloodGroup: randomItem(['A+', 'B+', 'O+', 'AB+']),
          email: `${fName.toLowerCase()}${i}@student.com`,
          status: 'Active',
          attendance: {
            presentDates: presentDates,
            absentDates: absentDates,
            sundays: [],
            totalWorkingDays: pastDates.length
          },
          transportDetails: {
            facility: Math.random() > 0.5 ? 'School Bus' : 'Self',
            busNo: Math.random() > 0.5 ? 'Bus-01' : ''
          },
          createdAt: new Date().toISOString()
        });
        studentCount++;
      }
    }
  }

  console.log(`Successfully seeded ${studentCount - 1} students, 30 teachers, ${subjectDocs.length} subjects!`);
}

seed().catch(console.error).finally(() => process.exit(0));
