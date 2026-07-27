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
    description: "Morning breakfast, afternoon lunch, evening snacks, and night dinner plans.",
  },
  dishes: {
    title: "Dishes & Recipes",
    description: "Food items and dishes prepared in the mess, with optional recipes.",
  },
  attendance: {
    title: "Mess Attendance",
    description: "Attendance for morning breakfast, afternoon lunch, evening snacks, and night dinner.",
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
