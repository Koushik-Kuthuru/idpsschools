import XLSX from "xlsx";

function cellStr(value) {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  let text = String(value).trim();
  if (/^\d+\.0$/.test(text)) text = text.slice(0, -2);
  return text;
}

export function cleanAbcValue(value) {
  const text = cellStr(value);
  if (!text) return "";
  const upper = text.toUpperCase();
  if (upper === "N/A" || upper === "NA" || text === "--" || text === "-") return "";
  return text;
}

export function parseAbcDob(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    if (y >= 1900 && y <= 2100) return value.toISOString().slice(0, 10);
  }
  const text = cellStr(value);
  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

export function normalizeAbcGender(raw) {
  const g = String(raw ?? "").trim().toLowerCase();
  if (g.startsWith("m")) return "male";
  if (g.startsWith("f")) return "female";
  return null;
}

export function pickAbcPhone(...values) {
  for (const value of values) {
    const text = cleanAbcValue(value).replace(/\D/g, "");
    if (text.length >= 10) return text.slice(-10);
  }
  return "";
}

function readByHeader(header, row) {
  const byHeader = {};
  header.forEach((label, index) => {
    if (label) byHeader[String(label).trim()] = row[index];
  });
  return byHeader;
}

function h(byHeader, key) {
  return cleanAbcValue(byHeader[key]);
}

function hRaw(byHeader, key) {
  return cellStr(byHeader[key]);
}

export function readAbcExcelRows(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = wb.SheetNames.includes("abc") ? "abc" : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const header = rows[0] ?? [];

  return rows.slice(1).flatMap((row, idx) => {
    const byHeader = readByHeader(header, row);
    const admissionNo = hRaw(byHeader, "ADM NO");
    const studentName = h(byHeader, "STUDENT NAME");
    if (!admissionNo || !studentName) return [];

    const className = h(byHeader, "CLASS") || "Unknown";
    const section = h(byHeader, "SECTION") || "Main";
    const fatherName = h(byHeader, "FATHER NAME");
    const motherName = h(byHeader, "MOTHER NAME");
    const parentPhone = pickAbcPhone(
      byHeader["FATHER MOBILE"],
      byHeader["MOTHER MOBILE"],
      byHeader["MOBILE PERMANENT"],
      byHeader["MOBILE CORRESPONDANCE"],
      byHeader["GUARDIAN MOBILE"]
    );

    const permAddress = h(byHeader, "PERMANENT ADDRESS");
    const corrAddress = h(byHeader, "CORRESPONDANCE ADDRESS");
    const sameAsPerm = h(byHeader, "SAME ADDRESS AS CORRESPONDANCE").toLowerCase() === "yes";

    const importRow = {
      rowNum: idx + 2,
      admission_no_raw: admissionNo.replace(/\.0$/, ""),
      full_name: studentName,
      dob: parseAbcDob(byHeader["DOB"]),
      gender: normalizeAbcGender(byHeader["GENDER"]),
      address: permAddress || corrAddress || null,
      parent_name: [fatherName, motherName].filter(Boolean).join(" / ") || null,
      father_name: fatherName,
      mother_name: motherName,
      aadhar_no: hRaw(byHeader, "STUDENT AADHAR NO") || null,
      father_phone: pickAbcPhone(byHeader["FATHER MOBILE"], byHeader["MOBILE PERMANENT"]),
      mother_phone: pickAbcPhone(byHeader["MOTHER MOBILE"], byHeader["MOBILE2 PERMANENT"]),
      parent_phone: parentPhone || null,
      username: hRaw(byHeader, "USERNAME") || null,
      password: hRaw(byHeader, "PASSWORD") || null,
      classLabel: section ? `${className} - ${section}` : className,
      class_name: className,
      section,

      srNo: hRaw(byHeader, "Sr. no."),
      rollNo: h(byHeader, "ROLL NO"),
      admissionClass: h(byHeader, "ADMISSION CLASS"),
      house: h(byHeader, "HOUSE"),
      stream: h(byHeader, "STREAM"),
      nationality: h(byHeader, "NATIONALITY") || "INDIAN",
      casteCategory: h(byHeader, "CATEGORY"),
      studentReligion: h(byHeader, "STUDENT RELIGION"),
      motherTongue: h(byHeader, "LANGUAGE"),
      email: h(byHeader, "STUDENT EMAIL"),
      bloodGroup: h(byHeader, "BLOOD GROUP"),
      heightTerm1: hRaw(byHeader, "HEIGHT"),
      weightTerm1: hRaw(byHeader, "WEIGHT"),
      heightTerm2: hRaw(byHeader, "HEIGHT2"),
      weightTerm2: hRaw(byHeader, "WEIGHT2"),
      disability: h(byHeader, "DISABILITY"),
      admissionDate: parseAbcDob(byHeader["ADM DATE"]),
      srnNo: hRaw(byHeader, "SRN NO."),
      tenthRollNo: h(byHeader, "TENTH ROLLNO"),
      twelveRollNo: h(byHeader, "TWELVE ROLLNO"),
      immuneStatus: h(byHeader, "IMMUNE STATUS"),
      immuneStatusSplNeed: h(byHeader, "IMMUNE STATUS SPL NEED"),
      studentType: h(byHeader, "STUDENT TYPE"),
      langLabUsername: hRaw(byHeader, "LANG LAB USERNAME"),
      langLabPassword: hRaw(byHeader, "LANG LAB PASSWORD"),
      examinationSerialNo: h(byHeader, "EXAMINATION SERIAL NO"),

      permAddress,
      permMobile: pickAbcPhone(byHeader["MOBILE PERMANENT"]),
      permWhatsapp: pickAbcPhone(byHeader["MOBILE2 PERMANENT"]),
      permLocation: h(byHeader, "LOCATION PERMANENT"),
      permArea: h(byHeader, "AREA PERMANENT"),
      permPlace: h(byHeader, "PLACE PERMANENT"),
      permState: h(byHeader, "PERMANENT STATE"),
      permCity: h(byHeader, "PERMANENT CITY"),
      permPincode: hRaw(byHeader, "PERMANENT PINCODE"),

      corrAddress,
      corrMobile: pickAbcPhone(byHeader["MOBILE CORRESPONDANCE"]),
      corrWhatsapp: pickAbcPhone(byHeader["MOBILE2 CORRESPONDANCE"]),
      corrLocation: h(byHeader, "LOCATION CORRESPONDANCE"),
      corrArea: h(byHeader, "AREA CORRESPONDANCE"),
      corrPlace: h(byHeader, "PLACE CORRESPONDANCE"),
      corrState: h(byHeader, "CORRESPONDANCE STATE"),
      corrCity: h(byHeader, "CORRESPONDANCE CITY"),
      corrPincode: hRaw(byHeader, "CORRESPONDANCE PINCODE"),
      sameAsPerm,

      fatherEmail: h(byHeader, "FATHER EMAIL"),
      fatherOccupation: h(byHeader, "FATHER OCCUPATION"),
      fatherIncome: h(byHeader, "FATHER INCOME"),
      fatherDepartment: h(byHeader, "FATHER DEPARTMENT"),
      fatherDesignation: h(byHeader, "FATHER DESIGNATION"),
      fatherOffice: h(byHeader, "NAME OF COMPANY FATHER"),
      fatherOfficeAddress: h(byHeader, "COMPANY ADDRESS FATHER"),
      fatherOfficeContact: h(byHeader, "COMPANY CONTACT NO FATHER"),
      fatherAadhar: hRaw(byHeader, "FATHER AADHAR NO"),
      fatherPan: h(byHeader, "FATHER PAN"),
      fatherMobile1: pickAbcPhone(byHeader["FATHER MOBILE"]),
      fatherMobile2: pickAbcPhone(byHeader["FATHER MOBILE2"]),
      fatherQualification: h(byHeader, "FATHER QUALIFICATION"),
      fatherReligion: h(byHeader, "FATHER RELIGION"),
      fatherCaste: h(byHeader, "CATEGORY FATHER"),
      fatherMarital: h(byHeader, "MARRIED STATUS FATHER"),
      fatherNationality: h(byHeader, "FATHER NATIONALITY") || "INDIAN",
      fatherIndustry: h(byHeader, "FATHER INDUSTRY/SECTOR"),

      motherEmail: h(byHeader, "MOTHER EMAIL"),
      motherOccupation: h(byHeader, "MOTHER OCCUPATION"),
      motherIncome: h(byHeader, "MOTHER INCOME"),
      motherDepartment: h(byHeader, "MOTHER DEPARTMENT"),
      motherDesignation: h(byHeader, "MOTHER DESIGNATION"),
      motherOffice: h(byHeader, "NAME OF COMPANY MOTHER"),
      motherOfficeAddress: h(byHeader, "COMPANY ADDRESS MOTHER"),
      motherOfficeContact: h(byHeader, "COMPANY CONTACT NO MOTHER"),
      motherAadhar: hRaw(byHeader, "MOTHER AADHAR NO"),
      motherPan: h(byHeader, "PAN MOTHER"),
      motherMobile1: pickAbcPhone(byHeader["MOTHER MOBILE"]),
      motherMobile2: pickAbcPhone(byHeader["MOTHER MOBILE2"]),
      motherQualification: h(byHeader, "MOTHER QUALIFICATION"),
      motherReligion: h(byHeader, "MOTHER RELIGION"),
      motherCaste: h(byHeader, "CATEGORY MOTHER"),
      motherMarital: h(byHeader, "MARRIED STATUS MOTHER"),
      motherNationality: h(byHeader, "MOTHER NATIONALITY") || "INDIAN",
      motherIndustry: h(byHeader, "MOTHER INDUSTRY/SECTOR"),

      guardianName: h(byHeader, "GUARDIAN NAME"),
      guardianRelation: h(byHeader, "GUARDIAN RELATION"),
      guardianEmail: h(byHeader, "GUARDIAN EMAIL"),
      guardianOccupation: h(byHeader, "GUARDIAN OCCUPATION"),
      guardianIncome: h(byHeader, "GUARDIAN INCOME"),
      guardianDepartment: h(byHeader, "GUARDIAN DEPARTMENT"),
      guardianDesignation: h(byHeader, "GUARDIAN DESIGNATION"),
      guardianOffice: h(byHeader, "NAME OF COMPANY GUARDIAN"),
      guardianOfficeAddress: h(byHeader, "COMPANY ADDRESS GUARDIAN"),
      guardianOfficeContact: h(byHeader, "COMPANY CONTACT NO GUARDIAN"),
      guardianAadhar: hRaw(byHeader, "AADHAR GUARDIAN"),
      guardianPan: h(byHeader, "GUARDIAN PAN"),
      guardianMobile1: pickAbcPhone(byHeader["GUARDIAN MOBILE"], byHeader["GUARDIAN MOBILE2"]),
      guardianMobile2: pickAbcPhone(byHeader["GUARDIAN MOBILE2"]),
      guardianQualification: h(byHeader, "GUARDIAN QUALIFICATION"),
      guardianReligion: h(byHeader, "GUARDIAN RELIGION"),
      guardianCaste: h(byHeader, "CATEGORY GUARDIAN"),
      guardianMarital: h(byHeader, "MARRIED STATUS GUARDIAN"),
      guardianNationality: h(byHeader, "GUARDIAN NATIONALITY"),
      guardianGender: h(byHeader, "GENDER GUARDIAN"),
      guardianIndustry: h(byHeader, "GUARDIAN INDUSTRY/SECTOR"),

      modeOfTransport: h(byHeader, "MODE OF TRANSPORT"),

      rawByHeader: Object.fromEntries(
        header.filter(Boolean).map((label) => [String(label).trim(), cellStr(byHeader[String(label).trim()])])
      ),
    };

    return [importRow];
  });
}

export function buildAbcProfileFields(row, importSource = "abc.xlsx") {
  const fields = {
    studentName: row.full_name,
    formNo: row.rollNo,
    registrationNo: row.rollNo,
    srnNo: row.srnNo,
    username: row.username || undefined,
    portalPassword: row.password || row.username || undefined,
    grade: row.class_name,
    section: row.section,
    gender: row.gender === "male" ? "Male" : row.gender === "female" ? "Female" : "",
    dob: row.dob || "",
    aadharNo: row.aadhar_no || "",
    house: row.house,
    stream: row.stream,
    email: row.email,
    nationality: row.nationality,
    casteCategory: row.casteCategory,
    motherTongue: row.motherTongue,
    studentType: row.studentType,
    admissionClass: row.admissionClass,
    studentReligion: row.studentReligion,
    bloodGroup: row.bloodGroup,
    heightTerm1: row.heightTerm1,
    weightTerm1: row.weightTerm1,
    heightTerm2: row.heightTerm2,
    weightTerm2: row.weightTerm2,
    disability: row.disability,
    admissionDate: row.admissionDate || "",
    tenthRollNo: row.tenthRollNo,
    twelveRollNo: row.twelveRollNo,
    immuneStatus: row.immuneStatus,
    immuneStatusSplNeed: row.immuneStatusSplNeed,
    langLabUsername: row.langLabUsername,
    langLabPassword: row.langLabPassword,
    examinationSerialNo: row.examinationSerialNo,

    fatherName: row.father_name,
    fatherEmail: row.fatherEmail,
    fatherOccupation: row.fatherOccupation,
    fatherIncome: row.fatherIncome,
    fatherDepartment: row.fatherDepartment,
    fatherDesignation: row.fatherDesignation,
    fatherOffice: row.fatherOffice,
    fatherOfficeAddress: row.fatherOfficeAddress,
    fatherOfficeContact: row.fatherOfficeContact,
    fatherAadhar: row.fatherAadhar,
    fatherPan: row.fatherPan,
    fatherMobile1: row.fatherMobile1,
    fatherMobile2: row.fatherMobile2,
    fatherQualification: row.fatherQualification,
    fatherReligion: row.fatherReligion,
    fatherCaste: row.fatherCaste,
    fatherMarital: row.fatherMarital,
    fatherNationality: row.fatherNationality,
    fatherIndustry: row.fatherIndustry,

    motherName: row.mother_name,
    motherEmail: row.motherEmail,
    motherOccupation: row.motherOccupation,
    motherIncome: row.motherIncome,
    motherDepartment: row.motherDepartment,
    motherDesignation: row.motherDesignation,
    motherOffice: row.motherOffice,
    motherOfficeAddress: row.motherOfficeAddress,
    motherOfficeContact: row.motherOfficeContact,
    motherAadhar: row.motherAadhar,
    motherPan: row.motherPan,
    motherMobile1: row.motherMobile1,
    motherMobile2: row.motherMobile2,
    motherQualification: row.motherQualification,
    motherReligion: row.motherReligion,
    motherCaste: row.motherCaste,
    motherMarital: row.motherMarital,
    motherNationality: row.motherNationality,
    motherIndustry: row.motherIndustry,

    guardianName: row.guardianName,
    guardianRelation: row.guardianRelation,
    guardianEmail: row.guardianEmail,
    guardianOccupation: row.guardianOccupation,
    guardianIncome: row.guardianIncome,
    guardianDepartment: row.guardianDepartment,
    guardianDesignation: row.guardianDesignation,
    guardianOffice: row.guardianOffice,
    guardianOfficeAddress: row.guardianOfficeAddress,
    guardianOfficeContact: row.guardianOfficeContact,
    guardianAadhar: row.guardianAadhar,
    guardianPan: row.guardianPan,
    guardianMobile1: row.guardianMobile1,
    guardianMobile2: row.guardianMobile2,
    guardianQualification: row.guardianQualification,
    guardianReligion: row.guardianReligion,
    guardianCaste: row.guardianCaste,
    guardianMarital: row.guardianMarital,
    guardianNationality: row.guardianNationality,
    guardianGender: row.guardianGender,
    guardianIndustry: row.guardianIndustry,

    permAddress: row.permAddress,
    permMobile: row.permMobile,
    permWhatsapp: row.permWhatsapp,
    permLocation: row.permLocation,
    permArea: row.permArea,
    permPlace: row.permPlace,
    permState: row.permState,
    permCity: row.permCity,
    permPincode: row.permPincode,

    corrAddress: row.sameAsPerm ? row.permAddress : row.corrAddress,
    corrMobile: row.corrMobile,
    corrWhatsapp: row.corrWhatsapp,
    corrLocation: row.corrLocation,
    corrArea: row.corrArea,
    corrPlace: row.corrPlace,
    corrState: row.corrState,
    corrCity: row.corrCity,
    corrPincode: row.corrPincode,
    sameAsPerm: row.sameAsPerm,

    mobileNumber: row.parent_phone || row.permMobile || "",
    permMobile: row.permMobile || row.parent_phone || "",

    abcImportSource: importSource,
    abcImportRow: row.rowNum,
    abcRawColumns: row.rawByHeader,
  };

  const cleaned = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "boolean") {
      cleaned[key] = value;
      continue;
    }
    if (typeof value === "object") {
      cleaned[key] = value;
      continue;
    }
    if (String(value).trim() !== "") cleaned[key] = value;
  }
  return cleaned;
}

export function mapAbcTransport(mode, existing = {}) {
  const text = String(mode ?? "").trim().toLowerCase();
  const usesTransport = text.includes("bus") || text === "yes" || text === "y";
  if (!text || text === "--" || text === "no" || text === "n") {
    if (existing.route || existing.busNo) return existing;
    return { ...existing, facility: "NO" };
  }
  if (usesTransport) {
    return {
      ...existing,
      facility: "YES",
      fees: Array.isArray(existing.fees) ? existing.fees : Array(12).fill("0"),
    };
  }
  return existing;
}
