"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  listTasksForProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from "@/lib/tasks";
import { listMilestones } from "@/lib/milestones";
import type {
  TaskDoc,
  MilestoneDoc,
  TaskStatus,
  TaskPriority,
} from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import { useAuth } from "@/contexts/AuthContext";

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

export default function MilestonePage() {
  const params = useParams<{ projectId: string; milestoneId: string }>();
  const projectId = params.projectId;
  const milestoneId = params.milestoneId;

  const { user, loading: authLoading } = useAuth();

  const [milestone, setMilestone] = useState<MilestoneDoc | null>(null);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] =
    useState<TaskPriority>("MEDIUM");
  const [editDueDateInput, setEditDueDateInput] = useState("");

  const load = async () => {
    setLoading(true);
    const [allMilestones, allTasks] = await Promise.all([
      listMilestones(projectId),
      listTasksForProject(projectId),
    ]);

    const m = allMilestones.find((mi) => mi.id === milestoneId) ?? null;
    setMilestone(m);
    setTasks(allTasks.filter((t) => t.milestoneId === milestoneId));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [projectId, milestoneId]);

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTaskStatus(taskId, status);
    await load();
  };

  const handleEditClick = (task: TaskDoc) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setEditDueDateInput(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditDueDateInput("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditPriority("MEDIUM");
    setEditDueDateInput("");
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId || !editTitle.trim()) return;

    let dueDate: number | null = null;
    if (editDueDateInput) {
      const d = new Date(editDueDateInput + "T00:00:00");
      dueDate = d.getTime();
    }

    await updateTask(editingTaskId, {
      title: editTitle.trim(),
      priority: editPriority,
      dueDate,
    });

    handleCancelEdit();
    await load();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(taskId);
    await load();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Milestone</h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view this milestone.
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

  const grouped: Record<TaskStatus, TaskDoc[]> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: [],
  };
  for (const t of tasks) {
    grouped[t.status].push(t);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading milestone...</p>;
  }

  if (!milestone) {
    return <p className="text-sm text-slate-600">Milestone not found.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">{milestone.name}</h1>
          {milestone.description && (
            <p className="text-sm text-slate-600">
              {milestone.description}
            </p>
          )}
        </div>
        <div className="w-full max-w-sm">
          <TaskForm
            projectId={projectId}
            milestoneId={milestoneId}
            onCreated={load}
          />
        </div>
      </header>

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
                const isEditing = task.id === editingTaskId;

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                    >
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <select
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editPriority}
                          onChange={(e) =>
                            setEditPriority(
                              e.target.value as TaskPriority
                            )
                          }
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>

                        <input
                          type="date"
                          className="w-full rounded border px-2 py-1 text-xs"
                          value={editDueDateInput}
                          onChange={(e) =>
                            setEditDueDateInput(e.target.value)
                          }
                        />
                      </div>

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded border px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>

                        {task.dueDate && (
                          <p className="mt-1 text-xs">
                            {renderDueLabel(task.dueDate)}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-500">
                          Priority: {task.priority}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditClick(task)}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded border px-2 py-1 text-xs text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <select
                      className="mt-2 w-full rounded border px-2 py-1 text-xs"
                      value={task.status}
                      onChange={(e) =>
                        handleTaskStatusChange(
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
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
    </div>
  );
}
