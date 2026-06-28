import { removeData, buildPath, db, auth } from "@/lib/db-client";




export async function deleteSchoolDocument(
  schoolId: string,
  collectionName: string,
  documentId: string
) {
  await removeData(buildPath(db, "schools", schoolId, collectionName, documentId));
}
