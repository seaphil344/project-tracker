"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { deleteTask } from "@/lib/tasks";
import { getProjectsByIds } from "@/lib/projects";
import { getMilestonesByIds } from "@/lib/milestones";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import type {
  TaskDoc,
  TaskStatus,
  ProjectDoc,
  MilestoneDoc,
} from "@/lib/types";

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "DONE", label: "Done" },
];

function renderDueLabel(timestamp: number) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const due = new Date(timestamp);
  const dueDay = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  ).getTime();

  const labelDate = due.toLocaleDateString();

  if (dueDay < todayStart) {
    return <span className="text-red-600">Overdue • {labelDate}</span>;
  } else if (dueDay === todayStart) {
    return <span className="text-amber-600">Due today • {labelDate}</span>;
  }

  return <span className="text-slate-600">Due {labelDate}</span>;
}

export default function MyTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [projects, setProjects] = useState<Record<string, ProjectDoc>>({});
  const [milestones, setMilestones] =
    useState<Record<string, MilestoneDoc>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTasks([]);
      setProjects({});
      setMilestones({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "tasks"),
      where("assigneeId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const newTasks: TaskDoc[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<TaskDoc, "id">),
      }));

      setTasks(newTasks);

      // Resolve project & milestone names whenever the tasks change
      (async () => {
        const projectIds = Array.from(
          new Set(newTasks.map((t) => t.projectId).filter(Boolean))
        );
        const milestoneIds = Array.from(
          new Set(newTasks.map((t) => t.milestoneId).filter(Boolean))
        );

        let projectMap: Record<string, ProjectDoc> = {};
        let milestoneMap: Record<string, MilestoneDoc> = {};

        try {
          projectMap =
            projectIds.length > 0 ? await getProjectsByIds(projectIds) : {};
        } catch (e) {
          console.warn("Could not load some projects:", e);
        }

        try {
          milestoneMap =
            milestoneIds.length > 0
              ? await getMilestonesByIds(milestoneIds)
              : {};
        } catch (e) {
          console.warn("Could not load some milestones:", e);
        }

        setProjects(projectMap);
        setMilestones(milestoneMap);
        setLoading(false);
      })();
    });

    return () => unsubscribe();
  }, [authLoading, user?.uid]);

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(taskId);
    // No manual reload needed; onSnapshot will fire with updated data
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view your tasks.
        </p>
        <a
          href="/login"
          className="inline-flex rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go to login
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <p className="text-sm text-slate-600">Loading your tasks…</p>
      </div>
    );
  }

  const grouped: Record<TaskStatus, TaskDoc[]> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: [],
  };
  for (const t of tasks) {
    grouped[t.status].push(t);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">My Tasks</h1>
        <p className="text-sm text-slate-600">
          All tasks assigned to you across projects and milestones.
        </p>
      </header>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-600">
          You don&apos;t have any assigned tasks yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="rounded-xl border bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">{col.label}</h2>
                <span className="text-xs text-slate-500">
                  {grouped[col.key].length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[col.key].map((task) => {
                  const project = projects[task.projectId];
                  const milestone = milestones[task.milestoneId];

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>

                          <p className="mt-1 text-xs text-slate-600">
                            {project ? project.name : "Project"} •{" "}
                            {milestone ? milestone.name : "Milestone"}
                          </p>

                          {task.dueDate && (
                            <p className="mt-1 text-xs">
                              {renderDueLabel(task.dueDate)}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-500">
                            Priority: {task.priority}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded border px-2 py-1 text-xs text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {grouped[col.key].length === 0 && (
                  <p className="text-xs text-slate-500">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
