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
    { id: "stu_c2", data: { firstName: "Arjun", lastName: "Rao", grade: "10", section: "C", rollNumber: "1003", gender: "Male", status: "Active", parentName: "Ramesh Rao", parentPhone: "9876543221" } }
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
    { id: "exam_c1", data: { name: "Quarterly Exams", startDate: "2026-08-01", endDate: "2026-08-10" } },
    { id: "exam_c2", data: { name: "Final Exams", startDate: "2027-03-01", endDate: "2027-03-15" } }
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
