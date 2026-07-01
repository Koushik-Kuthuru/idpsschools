export const STAFF_PROFILE_NOTICE_PREFIX = "__staff_profile__:";

export type StaffYearProfile = {
  department?: string;
  designation?: string;
  classes?: string;
  subjects?: string;
  classTeacher?: string;
  portalPassword?: string;
  password?: string;
};

export type StaffExtendedProfile = {
  empCode?: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  spouseName?: string;
  spouseContact?: string;
  childrenCount?: number;
  permanentAddress?: string;
  correspondenceAddress?: string;
  aadharNo?: string;
  panNo?: string;
  qualification?: string;
  confirmationDate?: string;
  trainedStatus?: string;
  availingTransport?: string;
  busNo?: string;
  route?: string;
  stop?: string;
  spouseOrganisation?: string;
  lockerNo?: string;
  lockerKey?: string;
  schoolWing?: string;
  previousSchool?: string;
  bloodGroup?: string;
  computerKnowledge?: string;
  experienceMonths?: number;
  relatives?: string;
  probationMonths?: number;
  employmentStatus?: string;
  remarks?: string;
  resigningDate?: string;
  noticePeriodDays?: number;
  emergencyPerson?: string;
  emergencyContact?: string;
  gender?: string;
  dob?: string;
};

export type StaffProfileData = StaffYearProfile &
  StaffExtendedProfile & {
  username?: string;
  academicYear?: string;
  years?: Record<string, StaffYearProfile>;
};

export function baseEmployeeId(employeeId: string | null | undefined): string {
  const id = String(employeeId ?? "").trim();
  const hash = id.indexOf("#");
  return hash === -1 ? id : id.slice(0, hash);
}

export function profileTitle(staffId: string) {
  return `${STAFF_PROFILE_NOTICE_PREFIX}${staffId}`;
}

export function buildYearProfile(row: {
  department: string;
  designation: string;
  password: string;
  username: string;
  classes: string;
  subjects: string;
  classTeacher: string;
}): StaffYearProfile {
  return {
    department: row.department,
    designation: row.designation,
    portalPassword: row.password || row.username || undefined,
    password: row.password || undefined,
    classes: row.classes || "",
    subjects: row.subjects || "",
    classTeacher: row.classTeacher || "",
  };
}

export function resolveStaffYearProfile(
  profile: StaffProfileData,
  yearName: string
): (StaffYearProfile & { username?: string }) | null {
  const years = profile.years;
  if (years?.[yearName]) {
    return { ...years[yearName], username: profile.username };
  }

  if (String(profile.academicYear ?? "") === yearName) {
    return profile;
  }

  return null;
}

export function mergeStaffProfileYear(
  existing: StaffProfileData,
  academicYear: string,
  yearData: StaffYearProfile,
  username?: string
): StaffProfileData {
  const profile: StaffProfileData = { ...existing, years: { ...(existing.years ?? {}) } };

  if (profile.academicYear && !profile.years![profile.academicYear]) {
    profile.years![profile.academicYear] = {
      department: profile.department,
      designation: profile.designation,
      classes: profile.classes,
      subjects: profile.subjects,
      classTeacher: profile.classTeacher,
      portalPassword: profile.portalPassword,
      password: profile.password,
    };
  }

  delete profile.academicYear;
  delete profile.department;
  delete profile.designation;
  delete profile.classes;
  delete profile.subjects;
  delete profile.classTeacher;
  delete profile.portalPassword;
  delete profile.password;

  profile.years![academicYear] = yearData;
  if (username) profile.username = username;

  return profile;
}

export function clearStaffProfileYear(profile: StaffProfileData, academicYear: string): StaffProfileData {
  if (!profile.years?.[academicYear]) {
    if (profile.academicYear === academicYear) {
      const next = { ...profile };
      delete next.academicYear;
      delete next.department;
      delete next.designation;
      delete next.classes;
      delete next.subjects;
      delete next.classTeacher;
      delete next.portalPassword;
      delete next.password;
      return next;
    }
    return profile;
  }

  const years = { ...profile.years };
  delete years[academicYear];
  return { ...profile, years };
}
