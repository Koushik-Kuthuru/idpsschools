import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";

export const GET = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
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
      return noStoreJson({ employee: employees?.[0] || null });
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

    return noStoreJson({
      employees: formattedEmployees,
      stats: {
        total: formattedEmployees.length,
        present: formattedEmployees.length,
        onLeaveToday: []
      }
    });
  } catch (e: any) {
    return noStoreJson({ error: e?.message || "Unknown error" }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  return noStoreJson({ error: "Not implemented in Supabase migration yet" }, { status: 501 });
});

export const PUT = withAdminRoute(async (req, ctx) => {
  const supabaseAdmin = ctx.admin;
  return noStoreJson({ error: "Not implemented in Supabase migration yet" }, { status: 501 });
});
