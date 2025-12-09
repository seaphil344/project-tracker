// lib/projects.ts
import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  documentId
} from "firebase/firestore";
import type { ProjectDoc } from "./types";

const PROJECTS = "projects";

// ✅ create a project owned by a given user
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

// ✅ list projects for one owner, newest first
export async function listProjects(ownerId: string): Promise<ProjectDoc[]> {
  const q = query(
    collection(db, PROJECTS),
    where("ownerId", "==", ownerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<ProjectDoc, "id">)
  }));
}

// ✅ optional: used by /my-tasks page to resolve names
export async function getProjectsByIds(
  ids: string[]
): Promise<Record<string, ProjectDoc>> {
  if (ids.length === 0) return {};

  // Firestore 'in' limit is 10 – chunk if needed
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results: Record<string, ProjectDoc> = {};

  for (const chunk of chunks) {
    const q = query(
      collection(db, PROJECTS),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      results[docSnap.id] = {
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProjectDoc, "id">)
      };
    });
  }

  return results;
}
