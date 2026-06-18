import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolUuidFromSlug } from "@/lib/supabase/client";

async function createAuthUser(id: string, name: string, defaultPassword?: string) {
  const email = `${id.toLowerCase()}@idps.local`;
  const password = defaultPassword || "Welcome@123";

  // Check if exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const found = existing.users.find(u => u.email === email);
  if (found) return found;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (error) {
    console.error("Auth creation error:", error);
    throw error;
  }
  return data.user;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.type === "core") {
      // 1. Insert Schools (Avoid duplicates)
      for (const school of body.schools) {
        const { error } = await supabaseAdmin.from("schools").upsert({
          name: school.name,
          code: school.id === "idpscherukupalli" ? "IDPS-CHER" : school.id === "idpskalaburagi" ? "IDPS-KALA" : school.id,
          city: school.city,
          state: school.state,
          address: school.address,
          phone: school.phone,
          email: school.email,
        }, { onConflict: "code" });
        if (error) console.error("School insert error:", error);
      }

      // 2. Insert Super Admins
      for (const sa of body.superAdmins) {
        try {
          const authUser = await createAuthUser(sa.username || sa.email || sa.id, sa.name || "Super Admin", sa.portalPassword);
          await supabaseAdmin.from("users").upsert({
            id: authUser.id,
            role: "super_admin",
            full_name: sa.name || "Super Admin",
            email: authUser.email,
          });
        } catch (e) {
          console.error("Super admin error:", e);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (body.type === "school_data") {
      const code = body.schoolId === "idpscherukupalli" ? "IDPS-CHER" : body.schoolId === "idpskalaburagi" ? "IDPS-KALA" : body.schoolId;
      const { data: schoolRecord } = await supabaseAdmin.from('schools').select('id').eq('code', code).single();
      const schoolUuid = schoolRecord?.id;
      
      if (!schoolUuid) throw new Error("Could not find school UUID for " + body.schoolId + " (Code: " + code + ")");

      // 1. Teachers
      for (const t of body.teachers) {
        try {
          const employeeId = t.employeeId || t.id;
          const name = `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.name;
          const authUser = await createAuthUser(employeeId, name, t.portalPassword);
          
          await supabaseAdmin.from("users").upsert({
            id: authUser.id,
            school_id: schoolUuid,
            role: "teacher",
            full_name: name,
            email: authUser.email,
            phone: t.mobile || t.phone,
          });

          await supabaseAdmin.from("staff_profiles").upsert({
            user_id: authUser.id,
            school_id: schoolUuid,
            employee_id: employeeId,
            designation: t.designation || "Teacher",
            department: t.department || "Teaching",
            date_of_joining: t.joiningDate,
          }, { onConflict: "employee_id" });
        } catch (e) {
          console.error("Teacher insert error:", e);
        }
      }

      // 2. Non-teaching staff
      for (const s of body.staff) {
        try {
          const employeeId = s.employeeId || s.id;
          const name = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name;
          const authUser = await createAuthUser(employeeId, name, s.portalPassword);
          
          await supabaseAdmin.from("users").upsert({
            id: authUser.id,
            school_id: schoolUuid,
            role: "staff",
            full_name: name,
            email: authUser.email,
            phone: s.mobile || s.phone,
          });

          await supabaseAdmin.from("staff_profiles").upsert({
            user_id: authUser.id,
            school_id: schoolUuid,
            employee_id: employeeId,
            designation: s.designation || "Staff",
            department: s.department || "General",
            date_of_joining: s.joiningDate,
          }, { onConflict: "employee_id" });
        } catch (e) {
          console.error("Staff insert error:", e);
        }
      }

      // 3. Students
      for (const st of body.students) {
        try {
          const admissionNumber = st.admissionNumber || st.id;
          const name = st.studentName || `${st.firstName || ''} ${st.lastName || ''}`.trim();
          const authUser = await createAuthUser(st.username || admissionNumber, name, st.portalPassword);
          
          await supabaseAdmin.from("users").upsert({
            id: authUser.id,
            school_id: schoolUuid,
            role: "student",
            full_name: name,
            email: authUser.email,
            phone: st.studentPhone || st.mobile,
          });

          await supabaseAdmin.from("students").upsert({
            user_id: authUser.id,
            school_id: schoolUuid,
            admission_number: admissionNumber,
            date_of_birth: st.dob || st.dateOfBirth,
            gender: st.gender,
            blood_group: st.bloodGroup,
            address: st.address,
            admission_date: st.admissionDate,
          }, { onConflict: "admission_number" });
        } catch (e) {
          console.error("Student insert error:", e);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error: any) {
    console.error("Migration Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
