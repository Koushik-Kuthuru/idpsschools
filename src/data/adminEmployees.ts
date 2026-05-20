export type EmployeeStatus = "Active" | "On Leave" | "Inactive";

export type LeaveBalance = {
  label: string;
  total: number;
  availed: number;
};

export type EmployeeClassLoad = {
  classSection: string;
  subject: string;
  students: number;
  capacity: number;
  weeklyHours: number;
};

export type AdminEmployee = {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  employmentType: string;
  reportsTo: string;
  experienceYears: number;
  baseSalaryMonthlyInr: number;
  qualifications: string[];
  joinedDate: string;
  leaveYear: string;
  leaveBalances: LeaveBalance[];
  academicSessionLabel: string;
  classLoads: EmployeeClassLoad[];
};

import seed from "./seed.json";

export const adminEmployees = (seed as any).adminEmployees as AdminEmployee[];

export function getAdminEmployeeById(id: string) {
  return adminEmployees.find((e) => e.id === id);
}
