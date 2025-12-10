// app/my-tasks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { updateTask, deleteTask } from "@/lib/tasks";
import { getProjectsByIds } from "@/lib/projects";
import { getMilestonesByIds } from "@/lib/milestones";
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

function renderDueLabel(timestamp?: number | null) {
  if (!timestamp) return null;

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
    return (
      <span className="text-xs font-medium text-red-600">
        Overdue • {labelDate}
      </span>
    );
  } else if (dueDay === todayStart) {
    return (
      <span className="text-xs font-medium text-amber-600">
        Due today • {labelDate}
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-600">
      Due {labelDate}
    </span>
  );
}

export default function MyTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [projectsById, setProjectsById] = useState<
    Record<string, ProjectDoc>
  >({});
  const [milestonesById, setMilestonesById] = useState<
    Record<string, MilestoneDoc>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTasks([]);
      setProjectsById({});
      setMilestonesById({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "tasks"),
      where("assigneeId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const loaded: TaskDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TaskDoc, "id">),
        }));

        // Sort by dueDate (nulls last)
        loaded.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return a.dueDate - b.dueDate;
          }
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          return 0;
        });

        setTasks(loaded);

        // Collect unique project & milestone IDs
        const projectIds = Array.from(
          new Set(loaded.map((t) => t.projectId).filter(Boolean))
        ) as string[];
        const milestoneIds = Array.from(
          new Set(
            loaded.map((t) => t.milestoneId).filter(Boolean)
          )
        ) as string[];

        // IMPORTANT: getProjectsByIds / getMilestonesByIds return records, not arrays
        const [projectsRecord, milestonesRecord] = await Promise.all([
          projectIds.length
            ? getProjectsByIds(projectIds)
            : Promise.resolve({} as Record<string, ProjectDoc>),
          milestoneIds.length
            ? getMilestonesByIds(milestoneIds)
            : Promise.resolve({} as Record<string, MilestoneDoc>),
        ]);

        setProjectsById(projectsRecord || {});
        setMilestonesById(milestonesRecord || {});
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to tasks:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid]);

  const grouped = useMemo(() => {
    const base: Record<TaskStatus, TaskDoc[]> = {
      BACKLOG: [],
      IN_PROGRESS: [],
      BLOCKED: [],
      DONE: [],
    };

    for (const t of tasks) {
      base[t.status].push(t);
    }

    return base;
  }, [tasks]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
    // onSnapshot will update UI
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = confirm(
      "Delete this task? This cannot be undone."
    );
    if (!confirmed) return;

    await deleteTask(taskId);
    // onSnapshot will update UI
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          My Tasks
        </h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view your tasks.
        </p>
        <a
          href="/login"
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Go to login
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          My Tasks
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          All tasks assigned to you, across projects and milestones.
        </p>
      </div>

      {/* Board */}
      {loading ? (
        <p className="text-sm text-slate-600">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-600">
          You don&apos;t have any tasks yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex flex-col rounded-xl bg-slate-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {grouped[col.key].length}
                </span>
              </div>

              <div className="flex-1 space-y-2">
                {grouped[col.key].map((task) => {
                  const project = projectsById[task.projectId];
                  const milestone = task.milestoneId
                    ? milestonesById[task.milestoneId]
                    : undefined;

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="mt-1 text-xs text-slate-600">
                              {task.description}
                            </p>
                          )}

                          {/* Project / Milestone info */}
                          <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                            {project && (
                              <p>
                                Project:{" "}
                                <span className="font-medium text-slate-700">
                                  {project.name}
                                </span>
                              </p>
                            )}
                            {milestone && (
                              <p>
                                Milestone:{" "}
                                <span className="font-medium text-slate-700">
                                  {milestone.name}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Due + priority */}
                          <div className="mt-1 space-y-0.5">
                            {task.dueDate && (
                              <p className="text-xs">
                                {renderDueLabel(task.dueDate)}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              Priority: {task.priority}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-2">
                        <label className="mb-1 block text-[11px] text-slate-500">
                          Status
                        </label>
                        <select
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-700"
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id,
                              e.target.value as TaskStatus
                            )
                          }
                        >
                          <option value="BACKLOG">Backlog</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {grouped[col.key].length === 0 && (
                  <p className="mt-4 text-xs italic text-slate-400">
                    No tasks in this column
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
