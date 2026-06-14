import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function deleteSchoolDocument(
  schoolId: string,
  collectionName: string,
  documentId: string
) {
  await deleteDoc(doc(db, "schools", schoolId, collectionName, documentId));
}
