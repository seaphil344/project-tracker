// app/projects/[projectId]/milestones/[milestoneId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TaskForm from "@/components/TaskForm";
import { listMilestones } from "@/lib/milestones";
import {
  listTasksForProject,
  updateTask,
  deleteTask,
} from "@/lib/tasks";
import type {
  TaskDoc,
  TaskStatus,
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

export default function MilestoneBoardPage() {
  const params = useParams<{ projectId: string; milestoneId: string }>();
  const projectId = params.projectId;
  const milestoneId = params.milestoneId;

  const { user, loading: authLoading } = useAuth();
  const [milestone, setMilestone] = useState<MilestoneDoc | null>(null);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user || !projectId || !milestoneId) return;

    setLoading(true);

    // Use helpers that match your rules
    const allMilestones = await listMilestones(projectId);
    const current =
      allMilestones.find((m) => m.id === milestoneId) ?? null;
    setMilestone(current);

    const allTasks = await listTasksForProject(projectId);
    const milestoneTasks = allTasks.filter(
      (t) => t.milestoneId === milestoneId
    );
    setTasks(milestoneTasks);

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && projectId && milestoneId) {
      void load();
    }
  }, [authLoading, user, projectId, milestoneId]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
    await load();
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = confirm(
      "Delete this task? This cannot be undone."
    );
    if (!confirmed) return;

    await deleteTask(taskId);
    await load();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Milestone
        </h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view this milestone.
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

  if (!projectId || !milestoneId) {
    return (
      <p className="text-sm text-slate-600">
        Missing project or milestone.
      </p>
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
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {milestone ? milestone.name : "Milestone"}
          </h1>
          {milestone?.description && (
            <p className="mt-1 text-sm text-slate-600">
              {milestone.description}
            </p>
          )}
          {milestone?.dueDate && (
            <div className="mt-2">
              {renderDueLabel(milestone.dueDate)}
            </div>
          )}
        </div>

        <div className="w-full max-w-sm">
          <TaskForm
            projectId={projectId}
            milestoneId={milestoneId}
            onCreated={load}
          />
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <p className="text-sm text-slate-600">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-600">
          No tasks in this milestone yet. Create one to get started.
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
                {grouped[col.key].map((task) => (
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
                ))}

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
