export type AdminSectionPageConfig = {
  title: string;
  description: string;
};

export const HOSTEL_SECTIONS: Record<string, AdminSectionPageConfig> = {
  residents: {
    title: "Hostel Residents",
    description: "Boarding students, room assignments, and guardian contact details.",
  },
  rooms: {
    title: "Rooms & Blocks",
    description: "Hostel blocks, room capacity, and bed allocation.",
  },
  attendance: {
    title: "Hostel Attendance",
    description: "Daily roll call, night check-in, and leave-out records.",
  },
  visitors: {
    title: "Hostel Visitors",
    description: "Visitor register, approvals, and entry logs.",
  },
  fees: {
    title: "Hostel Fee Status",
    description: "Hostel, food, and laundry fee collection status.",
  },
};

export const MESS_SECTIONS: Record<string, AdminSectionPageConfig> = {
  menu: {
    title: "Mess Menu",
    description: "Weekly meal plans, special diets, and menu publishing.",
  },
  attendance: {
    title: "Mess Attendance",
    description: "Meal-wise headcount and absentee tracking.",
  },
  billing: {
    title: "Mess Billing",
    description: "Mess charges, adjustments, and payment status.",
  },
  feedback: {
    title: "Mess Feedback",
    description: "Student and staff feedback on meals and service.",
  },
};
