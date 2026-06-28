import { withSupabaseRoute } from "@/lib/supabase/route-handler";
import { getSchoolCodeFromSlug } from "@/lib/supabase/client";

export const GET = withSupabaseRoute("user", async (req, ctx) => {
  const schoolSlug = new URL(req.url).searchParams.get("schoolId");
  if (!schoolSlug) {
    return Response.json({ error: "schoolId required" }, { status: 400 });
  }

  try {
    const code = getSchoolCodeFromSlug(schoolSlug);
    if (!code) return Response.json({ items: [] });

    const { data: school } = await ctx.supabaseAdmin.from("schools").select("id").eq("code", code).single();
    if (!school?.id) return Response.json({ items: [] });

    const { data, error } = await ctx.supabaseAdmin
      .from("homework")
      .select("*")
      .eq("school_id", school.id)
      .order("assigned_date", { ascending: false });

    if (error) {
      if (error.message.includes("Could not find the table")) {
        return Response.json({ items: [] });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ items: data ?? [] });
  } catch (err) {
    console.error("portal/homework", err);
    return Response.json({ error: "Failed to load homework" }, { status: 500 });
  }
});
