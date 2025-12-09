export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type MilestoneStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ProjectDoc {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface MilestoneDoc {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  orderIndex: number;
  dueDate?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TaskDoc {
  id: string;
  projectId: string;
  milestoneId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  dueDate?: number | null;
  createdAt: number;
  updatedAt: number;
}
