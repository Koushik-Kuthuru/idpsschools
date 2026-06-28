import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  addBranchDepartment,
  addBranchDesignation,
  deleteBranchDepartment,
  deleteBranchDesignation,
  loadBranchDepartments,
  updateBranchDepartment,
  updateBranchDesignation,
} from "@/lib/loadBranchDepartments";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const schoolSlug = url.searchParams.get("schoolId");
  const academicYear = url.searchParams.get("academicYear");

  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ departments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load departments";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const academicYear = body.academicYear ? String(body.academicYear) : null;
    const action = String(body.action ?? "").trim();

    if (!schoolSlug) {
      return Response.json({ error: "schoolId required" }, { status: 400 });
    }

    if (action === "addDepartment") {
      await addBranchDepartment(supabaseAdmin, schoolSlug, String(body.name ?? ""));
    } else if (action === "addDesignation") {
      await addBranchDesignation(
        supabaseAdmin,
        schoolSlug,
        String(body.departmentId ?? ""),
        String(body.name ?? "")
      );
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ departments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save department";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const schoolSlug = String(body.schoolId ?? "").trim();
    const academicYear = body.academicYear ? String(body.academicYear) : null;
    const action = String(body.action ?? "").trim();

    if (!schoolSlug) {
      return Response.json({ error: "schoolId required" }, { status: 400 });
    }

    if (action === "updateDepartment") {
      await updateBranchDepartment(
        supabaseAdmin,
        schoolSlug,
        String(body.departmentId ?? ""),
        String(body.name ?? "")
      );
    } else if (action === "updateDesignation") {
      await updateBranchDesignation(
        supabaseAdmin,
        schoolSlug,
        String(body.departmentId ?? ""),
        String(body.designationId ?? ""),
        String(body.name ?? "")
      );
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ departments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update department";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const schoolSlug = url.searchParams.get("schoolId");
    const academicYear = url.searchParams.get("academicYear");
    const action = url.searchParams.get("action");
    const departmentId = url.searchParams.get("departmentId");
    const designationId = url.searchParams.get("designationId");

    if (!schoolSlug) {
      return Response.json({ error: "schoolId required" }, { status: 400 });
    }

    if (action === "deleteDepartment" && departmentId) {
      const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
      const target = departments.find((d) => d.id === departmentId);
      if (target && target.staffCount > 0) {
        return Response.json(
          { error: `Cannot delete — ${target.staffCount} staff assigned to this department` },
          { status: 400 }
        );
      }
      await deleteBranchDepartment(supabaseAdmin, schoolSlug, departmentId);
    } else if (action === "deleteDesignation" && departmentId && designationId) {
      const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
      const dept = departments.find((d) => d.id === departmentId);
      const desig = dept?.designations.find((d) => d.id === designationId);
      if (desig && desig.staffCount > 0) {
        return Response.json(
          { error: `Cannot delete — ${desig.staffCount} staff assigned to this designation` },
          { status: 400 }
        );
      }
      await deleteBranchDesignation(supabaseAdmin, schoolSlug, departmentId, designationId);
    } else {
      return Response.json({ error: "Invalid delete request" }, { status: 400 });
    }

    const departments = await loadBranchDepartments(supabaseAdmin, schoolSlug, academicYear);
    return Response.json({ departments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete department";
    return Response.json({ error: message }, { status: 400 });
  }
}
