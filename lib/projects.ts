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
  updateDoc,
  deleteDoc,
  documentId,
} from "firebase/firestore";
import type { ProjectDoc } from "./types";

const PROJECTS = "projects";

// Create
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
    updatedAt: Date.now(),
  });

  return docRef.id;
}

// List for owner
export async function listProjects(ownerId?: string): Promise<ProjectDoc[]> {
    if (!ownerId) return []; // ✅ never hit Firestore with undefined
  
    const q = query(
      collection(db, PROJECTS),
      where("ownerId", "==", ownerId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ProjectDoc, "id">),
    }));
}

// Optional: used by My Tasks (if you ever re-enable it)
export async function getProjectsByIds(
  ids: string[]
): Promise<Record<string, ProjectDoc>> {
  if (ids.length === 0) return {};

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
        ...(docSnap.data() as Omit<ProjectDoc, "id">),
      };
    });
  }

  return results;
}

// ✅ NEW: update project (name/description/status)
export async function updateProject(
  projectId: string,
  updates: Partial<Pick<ProjectDoc, "name" | "description" | "status">>
): Promise<void> {
  const ref = doc(db, PROJECTS, projectId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Date.now(),
  });
}

// ✅ NEW: delete project doc
export async function deleteProject(projectId: string): Promise<void> {
  const ref = doc(db, PROJECTS, projectId);
  await deleteDoc(ref);
}
