export const branchesData = [
  { id: "idpskalaburagi", name: "IDPS Kalaburagi", location: "Kalaburagi, Karnataka", status: "Active" },
  { id: "idpscherukupalli", name: "IDPS Cherukupalli", location: "Cherukupalli, Andhra Pradesh", status: "Active" },
];

export const notificationsData = [
  {
    id: "ann_1",
    title: "Welcome",
    message: "Local mock database is enabled.",
    type: "INFO",
    time: "Just now",
    isRead: true,
  },
];

export const initialMockData: Record<string, any[]> = {
  "schools": [
    {
      id: "idpskalaburagi",
      data: {
        name: "IDPS Kalaburagi",
        city: "Kalaburagi",
        state: "Karnataka",
        status: "Active",
        students: 520,
        staff: 48,
      },
    },
    {
      id: "idpscherukupalli",
      data: {
        name: "IDPS Cherukupalli",
        city: "Cherukupalli",
        state: "Andhra Pradesh",
        status: "Active",
        students: 410,
        staff: 39,
      },
    },
  ],
  "global_announcements": [
    {
      id: "ga_1",
      data: {
        title: "Welcome",
        content: "Mock database is running from /src/data.",
        priority: "low",
        date: new Date().toISOString(),
      },
    },
    {
      id: "ga_2",
      data: {
        title: "Maintenance",
        content: "This is sample data. You can add/edit/delete like Firestore.",
        priority: "high",
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    },
  ],
  // --- KALABURAGI BRANCH DATA ---
  "schools/idpskalaburagi/students": [
    { id: "stu_k1", data: { firstName: "Rahul", lastName: "Sharma", grade: "10", section: "A", rollNumber: "1001", gender: "Male", status: "Active", parentName: "Rajesh Sharma", parentPhone: "9876543210" } },
    { id: "stu_k2", data: { firstName: "Priya", lastName: "Patel", grade: "9", section: "B", rollNumber: "9001", gender: "Female", status: "Active", parentName: "Suresh Patel", parentPhone: "9876543211" } }
  ],
  "schools/idpskalaburagi/teaching_staff": [
    { id: "tch_k1", data: { firstName: "Amit", lastName: "Kumar", employeeId: "EMP-K01", department: "Mathematics", subject: "Math", email: "amit.k@idps.edu", status: "Active", phone: "9876543212" } },
    { id: "tch_k2", data: { firstName: "Neha", lastName: "Singh", employeeId: "EMP-K02", department: "Science", subject: "Physics", email: "neha.s@idps.edu", status: "Active", phone: "9876543213" } }
  ],
  "schools/idpskalaburagi/classes": [
    { id: "cls_k1", data: { grade: "10", section: "A", room: "101", capacity: 40 } },
    { id: "cls_k2", data: { grade: "9", section: "B", room: "102", capacity: 40 } },
    { id: "cls_k3", data: { grade: "8", section: "A", room: "103", capacity: 35 } }
  ],
  "schools/idpskalaburagi/exam_types": [
    { id: "exam_k1", data: { name: "Mid Term", startDate: "2026-09-10", endDate: "2026-09-20" } },
    { id: "exam_k2", data: { name: "Final Exams", startDate: "2027-03-01", endDate: "2027-03-15" } }
  ],
  "schools/idpskalaburagi/holidays": [
    { id: "hol_k1", data: { name: "Summer Vacation", date: "2026-05-15", type: "vacation" } },
    { id: "hol_k2", data: { name: "Diwali Break", date: "2026-11-01", type: "vacation" } }
  ],
  "schools/idpskalaburagi/events": [
    { id: "evt_k1", data: { title: "Science Fair", date: "2026-06-10", type: "event", location: "Main Hall" } },
    { id: "hol_k1", data: { title: "Summer Vacation", date: "2026-05-15", type: "holiday", location: "School", holidayId: "hol_k1" } },
    { id: "hol_k2", data: { title: "Diwali Break", date: "2026-11-01", type: "holiday", location: "School", holidayId: "hol_k2" } }
  ],
  
  // --- CHERUKUPALLI BRANCH DATA ---
  "schools/idpscherukupalli/students": [
    { id: "stu_c1", data: { firstName: "Kavya", lastName: "Reddy", grade: "8", section: "A", rollNumber: "8001", gender: "Female", status: "Active", parentName: "Venkat Reddy", parentPhone: "9876543220" } },
    { id: "stu_c3", data: { firstName: "Ravi", lastName: "Kumar", grade: "8", section: "A", rollNumber: "8002", gender: "Male", status: "Active", parentName: "Srinivas Kumar", parentPhone: "9876543224" } },
    { id: "stu_c4", data: { firstName: "Meera", lastName: "Naidu", grade: "8", section: "A", rollNumber: "8003", gender: "Female", status: "Active", parentName: "Anil Naidu", parentPhone: "9876543225" } },
    { id: "stu_c5", data: { firstName: "Vikram", lastName: "Sharma", grade: "8", section: "A", rollNumber: "8004", gender: "Male", status: "Active", parentName: "Rajesh Sharma", parentPhone: "9876543226" } },
    { id: "stu_c2", data: { firstName: "Arjun", lastName: "Rao", grade: "10", section: "C", rollNumber: "1003", gender: "Male", status: "Active", parentName: "Ramesh Rao", parentPhone: "9876543221" } },
    { id: "stu_c6", data: { firstName: "Priya", lastName: "Devi", grade: "10", section: "C", rollNumber: "1004", gender: "Female", status: "Active", parentName: "Krishna Devi", parentPhone: "9876543227" } }
  ],
  "schools/idpscherukupalli/teaching_staff": [
    { id: "tch_c1", data: { firstName: "Suresh", lastName: "Babu", employeeId: "EMP-C01", department: "Science", subject: "Physics", email: "suresh.b@idps.edu", status: "Active", phone: "9876543222" } },
    { id: "tch_c2", data: { firstName: "Lakshmi", lastName: "Narayana", employeeId: "EMP-C02", department: "Languages", subject: "English", email: "lakshmi.n@idps.edu", status: "Active", phone: "9876543223" } }
  ],
  "schools/idpscherukupalli/classes": [
    { id: "cls_c1", data: { grade: "8", section: "A", room: "201", capacity: 35 } },
    { id: "cls_c2", data: { grade: "10", section: "C", room: "202", capacity: 40 } }
  ],
  "schools/idpscherukupalli/exam_types": [
    { id: "class_test_8_A_ut1", data: { name: "UT1", category: "class_test", classId: "8", section: "A", startDate: "2026-05-20", endDate: "2026-05-20" } },
    { id: "class_test_8_A_weekly_test", data: { name: "Weekly Test", category: "class_test", classId: "8", section: "A", startDate: "2026-06-03", endDate: "2026-06-03" } },
    { id: "class_test_8_A_ut2", data: { name: "UT2", category: "class_test", classId: "8", section: "A", startDate: "2026-09-10", endDate: "2026-09-10" } },
    { id: "class_test_10_C_ut1", data: { name: "UT1", category: "class_test", classId: "10", section: "C", startDate: "2026-06-01", endDate: "2026-06-05" } },
    { id: "examination_10_C_quarterly_exam", data: { name: "Quarterly Exam", category: "examination", classId: "10", section: "C", startDate: "2026-08-01", endDate: "2026-08-10" } },
    { id: "examination_10_C_annual_exam", data: { name: "Annual Exam", category: "examination", classId: "10", section: "C", startDate: "2027-03-01", endDate: "2027-03-15" } }
  ],
  "schools/idpscherukupalli/subjects": [
    { id: "sub_8_A_math", data: { name: "Mathematics", classId: "8", section: "A" } },
    { id: "sub_8_A_sci", data: { name: "Science", classId: "8", section: "A" } },
    { id: "sub_8_A_eng", data: { name: "English", classId: "8", section: "A" } },
    { id: "sub_8_A_soc", data: { name: "Social Studies", classId: "8", section: "A" } },
    { id: "sub_10_C_math", data: { name: "Mathematics", classId: "10", section: "C" } },
    { id: "sub_10_C_sci", data: { name: "Science", classId: "10", section: "C" } },
    { id: "sub_10_C_eng", data: { name: "English", classId: "10", section: "C" } }
  ],
  "schools/idpscherukupalli/settings": [
    {
      id: "timetable_template",
      data: {
        periods: [
          { id: "P1", label: "P1", startTime: "08:00", endTime: "08:45" },
          { id: "P2", label: "P2", startTime: "08:45", endTime: "09:30" },
          { id: "P3", label: "P3", startTime: "09:30", endTime: "10:15" },
          { id: "P4", label: "P4", startTime: "10:30", endTime: "11:15" },
          { id: "P5", label: "P5", startTime: "11:15", endTime: "12:00" },
          { id: "P6", label: "P6", startTime: "12:00", endTime: "12:45" },
          { id: "P7", label: "P7", startTime: "13:30", endTime: "14:15" }
        ],
        breaks: [
          { id: "break_morning", label: "Break", startTime: "10:15", endTime: "10:30", afterPeriodId: "P3" }
        ],
        updatedAt: new Date().toISOString()
      }
    }
  ],
  "schools/idpscherukupalli/timetables": [
    {
      id: "term__2025-26__8__A",
      data: {
        scope: "term",
        key: "2025-26",
        grade: "8",
        section: "A",
        periodGrid: {
          Monday: {
            P1: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P2: [{ subject: "Science", teacher: "Suresh Babu" }],
            P3: [{ subject: "English", teacher: "Lakshmi Narayana" }],
            P4: [{ subject: "Social Studies", teacher: "Lakshmi Narayana" }],
            P5: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P6: [{ subject: "", teacher: "" }],
            P7: [{ subject: "", teacher: "" }]
          },
          Tuesday: {
            P1: [{ subject: "English", teacher: "Lakshmi Narayana" }],
            P2: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P3: [{ subject: "Science", teacher: "Suresh Babu" }],
            P4: [{ subject: "", teacher: "" }],
            P5: [{ subject: "", teacher: "" }],
            P6: [{ subject: "", teacher: "" }],
            P7: [{ subject: "", teacher: "" }]
          }
        },
        updatedAt: new Date().toISOString()
      }
    }
  ],
  "schools/idpscherukupalli/exam_timetables": [
    {
      id: "exam__term_1__8__A",
      data: {
        examTerm: "term_1",
        examTermLabel: "Term 1",
        grade: "8",
        section: "A",
        periodGrid: {
          Monday: {
            P1: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P2: [{ subject: "Science", teacher: "Suresh Babu" }]
          },
          Wednesday: {
            P1: [{ subject: "English", teacher: "Lakshmi Narayana" }]
          }
        },
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: "exam__term_2__10__C",
      data: {
        examTerm: "term_2",
        examTermLabel: "Term 2",
        grade: "10",
        section: "C",
        periodGrid: {
          Monday: {
            P1: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P3: [{ subject: "Science", teacher: "Suresh Babu" }]
          }
        },
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: "exam__final_exam__10__C",
      data: {
        examTerm: "final_exam",
        examTermLabel: "Final Exam",
        grade: "10",
        section: "C",
        periodGrid: {
          Monday: {
            P1: [{ subject: "Mathematics", teacher: "Suresh Babu" }],
            P2: [{ subject: "English", teacher: "Lakshmi Narayana" }]
          },
          Tuesday: {
            P1: [{ subject: "Science", teacher: "Suresh Babu" }]
          }
        },
        updatedAt: new Date().toISOString()
      }
    }
  ],
  "schools/idpscherukupalli/marks": [
    {
      id: "UT1__8__A__Mathematics",
      data: {
        exam: "UT1",
        grade: "8",
        section: "A",
        subject: "Mathematics",
        rows: [
          { studentId: "stu_c1", marks: 78 },
          { studentId: "stu_c3", marks: 42 },
          { studentId: "stu_c4", marks: 88 },
          { studentId: "stu_c5", marks: 28 }
        ]
      }
    },
    {
      id: "UT1__8__A__Science",
      data: {
        exam: "UT1",
        grade: "8",
        section: "A",
        subject: "Science",
        rows: [
          { studentId: "stu_c1", marks: 72 },
          { studentId: "stu_c3", marks: 55 },
          { studentId: "stu_c4", marks: 81 },
          { studentId: "stu_c5", marks: 31 }
        ]
      }
    },
    {
      id: "UT1__10__C__Mathematics",
      data: {
        exam: "UT1",
        grade: "10",
        section: "C",
        subject: "Mathematics",
        rows: [
          { studentId: "stu_c2", marks: 65 },
          { studentId: "stu_c6", marks: 74 }
        ]
      }
    }
  ],
  "schools/idpscherukupalli/holidays": [
    { id: "hol_c1", data: { name: "Winter Break", date: "2026-12-25", type: "vacation" } },
    { id: "hol_c2", data: { name: "Pongal", date: "2027-01-14", type: "vacation" } }
  ],
  "schools/idpscherukupalli/events": [
    { id: "evt_c1", data: { title: "Annual Day", date: "2026-12-20", type: "event", location: "Auditorium" } },
    { id: "hol_c1", data: { title: "Winter Break", date: "2026-12-25", type: "holiday", location: "School", holidayId: "hol_c1" } },
    { id: "hol_c2", data: { title: "Pongal", date: "2027-01-14", type: "holiday", location: "School", holidayId: "hol_c2" } }
  ]
};
