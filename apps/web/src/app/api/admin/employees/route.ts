import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const department = url.searchParams.get("department");

    let query = supabaseAdmin.from('staff_profiles').select('*');

    if (id) {
      query = query.eq('id', id);
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data: employees, error } = await query;
    if (error) throw error;

    if (id) {
      return NextResponse.json({ employee: employees?.[0] || null });
    }

    // Map to expected frontend format
    const formattedEmployees = employees.map((e: any) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
      roleTitle: e.role,
      department: e.department || "",
      status: e.status || "Active",
      email: e.email || "",
      phone: e.phone || ""
    }));

    return NextResponse.json({
      employees: formattedEmployees,
      stats: {
        total: formattedEmployees.length,
        present: formattedEmployees.length,
        onLeaveToday: []
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ error: "Not implemented in Supabase migration yet" }, { status: 501 });
}

export async function PUT(req: Request) {
  return NextResponse.json({ error: "Not implemented in Supabase migration yet" }, { status: 501 });
}
