import { insertData, buildPath, getTimestamp, db, auth } from "@/lib/db-client";

"use client";




export type SchoolActivityInput = {
  schoolId: string;
  text: string;
  href?: string;
  type?: string;
  actorName?: string;
  actorRole?: string;
};

/** Records a live branch activity (shown on admin dashboard feed). */
export async function logSchoolActivity(input: SchoolActivityInput) {
  const user = auth.currentUser;
  await insertData(buildPath(db, "schools", input.schoolId, "activity"), {
    text: input.text,
    href: input.href ?? `/schools/${input.schoolId}/admin`,
    type: input.type ?? "general",
    actorName: input.actorName ?? user?.displayName ?? null,
    actorEmail: user?.email ?? null,
    actorRole: input.actorRole ?? null,
    live: true,
    createdAt: getTimestamp(),
  });
}
