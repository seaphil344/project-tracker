// lib/milestones.ts
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
  documentId
} from "firebase/firestore";
import type { MilestoneDoc, MilestoneStatus } from "./types";

const MILESTONES = "milestones";

export async function createMilestone(
  projectId: string,
  input: { name: string; description?: string; dueDate?: number | null }
): Promise<string> {
  const q = query(collection(db, MILESTONES), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  const orderIndex = snap.size;

  const docRef = await addDoc(collection(db, MILESTONES), {
    projectId,
    name: input.name,
    description: input.description ?? "",
    status: "NOT_STARTED",
    orderIndex,
    dueDate: input.dueDate ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return docRef.id;
}

export async function listMilestones(projectId: string): Promise<MilestoneDoc[]> {
  const q = query(
    collection(db, MILESTONES),
    where("projectId", "==", projectId),
    orderBy("orderIndex", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<MilestoneDoc, "id">)
  }));
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus
): Promise<void> {
  const ref = doc(db, MILESTONES, milestoneId);
  await updateDoc(ref, {
    status,
    updatedAt: Date.now()
  });
}

// ✅ NEW: used by /my-tasks to resolve milestone names
export async function getMilestonesByIds(
  ids: string[]
): Promise<Record<string, MilestoneDoc>> {
  if (ids.length === 0) return {};

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) {
    chunks.push(ids.slice(i, i + 10));
  }

  const results: Record<string, MilestoneDoc> = {};

  for (const chunk of chunks) {
    const q = query(
      collection(db, MILESTONES),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    snap.forEach((docSnap) => {
      results[docSnap.id] = {
        id: docSnap.id,
        ...(docSnap.data() as Omit<MilestoneDoc, "id">)
      };
    });
  }

  return results;
}
