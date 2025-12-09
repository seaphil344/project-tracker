import { db } from "./firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "firebase/firestore";
import type { TaskDoc, TaskStatus } from "./types";

const TASKS = "tasks";

export async function createTask(
  projectId: string,
  milestoneId: string,
  input: {
    title: string;
    description?: string;
    priority?: TaskDoc["priority"];
    dueDate?: number | null;
    assigneeId?: string | null;
  }
): Promise<string> {
  const docRef = await addDoc(collection(db, TASKS), {
    projectId,
    milestoneId,
    title: input.title,
    description: input.description ?? "",
    status: "BACKLOG",
    priority: input.priority ?? "MEDIUM",
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return docRef.id;
}

export async function listTasksForProject(projectId: string): Promise<TaskDoc[]> {
  const q = query(collection(db, TASKS), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<TaskDoc, "id">)
  }));
}

// ✅ NEW: update task status
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const ref = doc(db, TASKS, taskId);
  await updateDoc(ref, {
    status,
    updatedAt: Date.now()
  });
}
