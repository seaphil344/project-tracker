import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";
import type { ProjectDoc } from "./types";

const PROJECTS = "projects";

const FAKE_USER_ID = "demo-user"; // replace with auth uid later

export async function createProject(input: {
  name: string;
  description?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, PROJECTS), {
    name: input.name,
    description: input.description ?? "",
    status: "ACTIVE",
    ownerId: FAKE_USER_ID,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return docRef.id;
}

export async function listProjects(): Promise<ProjectDoc[]> {
  const q = query(
    collection(db, PROJECTS),
    where("ownerId", "==", FAKE_USER_ID),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProjectDoc, "id">)
  }));
}
