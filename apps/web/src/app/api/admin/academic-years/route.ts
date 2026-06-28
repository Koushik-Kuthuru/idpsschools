import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolveSchoolUuid } from "@/lib/resolveSchoolUuid";
import { resolveBranchUuid } from "@/lib/resolveBranchUuid";
import {
  createBranchAcademicYear,
  datesFromYearName,
  listBranchAcademicYears,
} from "@/lib/branchAcademicYears";

function defaultDatesFromName(name: string): { start_date: string; end_date: string } {
  return datesFromYearName(name);
}

export async function loadAcademicYearsForSchool(schoolSlug: string) {
  const schoolUuid = await resolveSchoolUuid(supabaseAdmin, schoolSlug, { createIfMissing: false });
  if (schoolUuid) {
    const { data, error } = await supabaseAdmin
      .from("academic_years")
      .select("id, name, start_date, end_date, is_current, created_at")
      .eq("school_id", schoolUuid)
      .order("start_date", { ascending: false });

    if (!error && data?.length) {
      return { years: data };
    }
    if (error && error.code !== "PGRST205") {
      throw new Error(error.message);
    }
  }

  const branchId = await resolveBranchUuid(supabaseAdmin, schoolSlug);
  if (!branchId) {
    return { error: "School not found" as const };
  }

  const years = await listBranchAcademicYears(supabaseAdmin, branchId);
  return { years };
}

export async function GET(req: Request) {
  const schoolSlug = new URL(req.url).searchParams.get("schoolId");
  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const result = await loadAcademicYearsForSchool(schoolSlug);
    if ("error" in result && result.error) {
      return Response.json({ error: result.error }, { status: 404 });
    }
    return Response.json({ years: result.years ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load academic years";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: {
    schoolId?: string;
    name?: string;
    start_date?: string;
    end_date?: string;
    setAsCurrent?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schoolSlug = body.schoolId?.trim();
  const name = body.name?.trim();
  if (!schoolSlug || !name) {
    return Response.json({ error: "schoolId and name are required" }, { status: 400 });
  }

  const schoolUuid = await resolveSchoolUuid(supabaseAdmin, schoolSlug, { createIfMissing: false });
  if (schoolUuid) {
    const defaults = defaultDatesFromName(name);
    const start_date = body.start_date?.trim() || defaults.start_date;
    const end_date = body.end_date?.trim() || defaults.end_date;
    const setAsCurrent = body.setAsCurrent !== false;

    const { data: existing } = await supabaseAdmin
      .from("academic_years")
      .select("id")
      .eq("school_id", schoolUuid)
      .eq("name", name)
      .maybeSingle();

    if (existing?.id) {
      return Response.json({ error: "An academic year with this name already exists" }, { status: 409 });
    }

    if (setAsCurrent) {
      await supabaseAdmin
        .from("academic_years")
        .update({ is_current: false })
        .eq("school_id", schoolUuid);
    }

    const { data, error } = await supabaseAdmin
      .from("academic_years")
      .insert({
        school_id: schoolUuid,
        name,
        start_date,
        end_date,
        is_current: setAsCurrent,
      })
      .select("id, name, start_date, end_date, is_current, created_at")
      .single();

    if (!error) {
      return Response.json({ year: data }, { status: 201 });
    }
    if (error.code !== "PGRST205") {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  const branchId = await resolveBranchUuid(supabaseAdmin, schoolSlug);
  if (!branchId) {
    return Response.json({ error: "School not found" }, { status: 404 });
  }

  try {
    const year = await createBranchAcademicYear(supabaseAdmin, branchId, {
      name,
      start_date: body.start_date,
      end_date: body.end_date,
      setAsCurrent: body.setAsCurrent,
    });
    return Response.json({ year }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create academic year";
    const status = message.includes("already exists") ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
