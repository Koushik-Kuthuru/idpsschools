const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const schoolId = 'idpscherukupalli';

const firstNames = ['Vikram', 'Anjali', 'Kavya', 'Rahul', 'Priya', 'Amit', 'Neha', 'Suresh', 'Divya', 'Rajesh', 'Pooja', 'Sunil', 'Swati', 'Ravi', 'Manoj', 'Deepa'];
const lastNames = ['Nair', 'Menon', 'Pillai', 'Kurian', 'Verma', 'Sharma', 'Gupta', 'Patel', 'Das', 'Sen', 'Chauhan', 'Iyer', 'Bhat', 'Reddy'];

const subjectsList = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi', 'Telugu'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedAdditional() {
  console.log('Starting additional data seeding...');

  // 1. Fetch Subjects
  const subjectsSnap = await db.collection('schools').doc(schoolId).collection('subjects').get();
  const subjectDocs = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Generate 40 More Teachers
  console.log('Seeding 40 more teachers...');
  const staffRef = db.collection('schools').doc(schoolId).collection('staff');
  
  // Also fetch existing staff to generate payslips for them too
  const existingStaffSnap = await staffRef.get();
  const allStaffIds = existingStaffSnap.docs.map(d => d.id);

  let newTeacherCount = 0;
  for (let i = 1; i <= 40; i++) {
    const fName = randomItem(firstNames);
    const lName = randomItem(lastNames);
    const teacherId = `EMP${2000 + i}`;
    
    const taughtSubjects = [];
    for(let j=0; j<3; j++) {
      if (subjectDocs.length > 0) {
        const sub = randomItem(subjectDocs);
        taughtSubjects.push({
          id: sub.id,
          name: sub.name,
          class: sub.classId,
          section: sub.section
        });
      }
    }

    const baseSalary = 30000 + Math.floor(Math.random() * 40000);

    await staffRef.doc(teacherId).set({
      employeeId: teacherId,
      firstName: fName,
      lastName: lName,
      role: 'Teacher',
      roleTitle: 'Senior Teacher',
      department: randomItem(['Mathematics', 'Science', 'Languages', 'Humanities']),
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`,
      phone: `99${Math.floor(Math.random() * 100000000)}`,
      joiningDate: '2022-06-01',
      status: 'Active',
      qualification: 'M.Ed, B.Sc',
      subjects: taughtSubjects,
      baseSalary: baseSalary,
      bankDetails: {
        accountName: `${fName} ${lName}`,
        accountNumber: `000${Math.floor(Math.random() * 1000000000)}`,
        bankName: randomItem(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank']),
        ifscCode: 'HDFC0001234'
      },
      emergencyContact: {
        name: randomItem(firstNames) + ' ' + lName,
        relation: randomItem(['Spouse', 'Parent', 'Sibling']),
        phone: `91${Math.floor(Math.random() * 100000000)}`
      },
      createdAt: new Date().toISOString()
    });
    allStaffIds.push(teacherId);
    newTeacherCount++;
  }

  // 3. Generate Payslips for all staff
  console.log('Generating Payslips for all staff...');
  const months = [
    { name: 'Jan 2026', days: 31 }, { name: 'Feb 2026', days: 28 }, { name: 'Mar 2026', days: 31 },
    { name: 'Apr 2026', days: 30 }, { name: 'May 2026', days: 31 }
  ];

  for (const empId of allStaffIds) {
    const docSnap = await staffRef.doc(empId).get();
    const data = docSnap.data();
    const baseSal = data.baseSalary || 45000;
    
    const payslips = months.map((m, idx) => {
      const basic = Math.round(baseSal * 0.5);
      const hra = Math.round(baseSal * 0.2);
      const special = Math.round(baseSal * 0.3);
      const gross = basic + hra + special;
      
      const pf = Math.round(basic * 0.12);
      const pt = 200;
      const tds = gross > 50000 ? Math.round(gross * 0.1) : 0;
      const totalDeductions = pf + pt + tds;
      
      const net = gross - totalDeductions;
      
      return {
        id: `PS-${empId}-${idx}`,
        month: m.name,
        workingDays: m.days,
        presentDays: m.days - Math.floor(Math.random() * 3),
        earnings: { basic, hra, specialAllowance: special, gross },
        deductions: { pf, pt, tds, total: totalDeductions },
        netPay: net,
        status: 'Paid',
        paidOn: new Date().toISOString(),
      };
    });

    await staffRef.doc(empId).update({ payslips });
  }

  // 4. Update Students with Fee and Transport Data
  console.log('Updating Students with Fee and Transport Data...');
  const studentsRef = db.collection('schools').doc(schoolId).collection('students');
  const studentsSnap = await studentsRef.get();
  
  let studentCount = 0;
  for (const doc of studentsSnap.docs) {
    const sData = doc.data();
    
    // Fee Structure
    const feeGrid = {
      admissionFee: 15000,
      tuitionFee: 45000,
      transportFee: Math.random() > 0.5 ? 12000 : 0,
      libraryFee: 2000,
      computerFee: 3000,
      activitiesFee: 4000
    };
    
    const totalFees = Object.values(feeGrid).reduce((a, b) => a + b, 0);
    const paidFees = Math.random() > 0.3 ? totalFees : Math.round(totalFees / 2);
    
    // Transport Structure
    const usesTransport = feeGrid.transportFee > 0;
    const transportDetails = usesTransport ? {
      facility: 'School Bus',
      busNo: `BUS-${Math.floor(Math.random() * 10) + 1}`,
      route: randomItem(['North Route', 'South Route', 'East Route', 'West Route']),
      stoppage: randomItem(['City Center', 'Lake View', 'Green Park', 'Metro Station']),
      driverName: randomItem(firstNames) + ' ' + randomItem(lastNames),
      driverMobile: `98${Math.floor(Math.random() * 100000000)}`,
      fees: feeGrid.transportFee
    } : {
      facility: 'Self',
      busNo: '', route: '', stoppage: '', driverName: '', driverMobile: '', fees: 0
    };

    await studentsRef.doc(doc.id).update({
      feeDetails: {
        feeGrid,
        totalFees,
        paidFees,
        pendingFees: totalFees - paidFees,
        lastPaymentDate: new Date().toISOString()
      },
      transportDetails,
      transportHistory: usesTransport ? [{
        id: Date.now().toString(),
        message: 'Assigned to School Bus',
        user: 'Admin',
        date: new Date().toISOString()
      }] : []
    });
    studentCount++;
  }

  console.log(`Successfully added 40 teachers, payslips for ${allStaffIds.length} staff, and fee/transport details for ${studentCount} students.`);
}

seedAdditional().catch(console.error).finally(() => process.exit(0));
