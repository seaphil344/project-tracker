// lib/projects.ts
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

export async function createProject(input: {
  ownerId: string;
  name: string;
  description?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, PROJECTS), {
    ownerId: input.ownerId,
    name: input.name,
    description: input.description ?? "",
    status: "ACTIVE",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return docRef.id;
}

export async function listProjects(ownerId: string): Promise<ProjectDoc[]> {
  const q = query(
    collection(db, PROJECTS),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProjectDoc, "id">)
  }));
}
