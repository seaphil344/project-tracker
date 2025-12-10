"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/lib/milestones";
import {
  listTasksForProject,
  deleteTasksForMilestone,
} from "@/lib/tasks";
import type { MilestoneDoc, MilestoneStatus, TaskDoc } from "@/lib/types";

function getMilestoneProgress(tasks: TaskDoc[]) {
  if (!tasks.length) return { total: 0, done: 0, percent: 0 };

  const done = tasks.filter((t) => t.status === "DONE").length;
  const percent = Math.round((done / tasks.length) * 100);

  return { total: tasks.length, done, percent };
}

function renderMilestoneDueLabel(timestamp?: number | null) {
  if (!timestamp) return null;

  const now = new Date();
  const today = new Date(
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
  const label = due.toLocaleDateString();

  if (dueDay < today) {
    return (
      <span className="text-xs font-medium text-red-600">
        Overdue • {label}
      </span>
    );
  }
  if (dueDay === today) {
    return (
      <span className="text-xs font-medium text-amber-600">
        Due Today • {label}
      </span>
    );
  }
  return (
    <span className="text-xs text-slate-600">
      Due {label}
    </span>
  );
}

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { user, loading: authLoading } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneDoc[]>([]);
  const [tasksByMilestone, setTasksByMilestone] = useState<
    Record<string, TaskDoc[]>
  >({});
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] =
    useState<MilestoneStatus>("NOT_STARTED");
  const [editDueDate, setEditDueDate] = useState("");

  const load = async () => {
    if (!user || !projectId) return;
    setLoading(true);

    const milestoneData = await listMilestones(projectId);
    setMilestones(milestoneData);

    const tasks = await listTasksForProject(projectId);
    const grouped: Record<string, TaskDoc[]> = {};
    for (const t of tasks) {
      if (!t.milestoneId) continue;
      if (!grouped[t.milestoneId]) grouped[t.milestoneId] = [];
      grouped[t.milestoneId].push(t);
    }
    setTasksByMilestone(grouped);

    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && projectId) {
      void load();
    }
  }, [authLoading, user, projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !projectId) return;

    // NOTE: matches lib/milestones.ts signature: (projectId, input)
    await createMilestone(projectId, {
      name: newName.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate ? new Date(newDueDate).getTime() : null,
    });

    setNewName("");
    setNewDescription("");
    setNewDueDate("");

    await load();
  };

  const startEdit = (m: MilestoneDoc) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditDescription(m.description ?? "");
    setEditStatus(m.status);
    setEditDueDate(
      m.dueDate ? new Date(m.dueDate).toISOString().slice(0, 10) : ""
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditStatus("NOT_STARTED");
    setEditDueDate("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    await updateMilestone(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
      dueDate: editDueDate ? new Date(editDueDate).getTime() : null,
    });

    cancelEdit();
    await load();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const confirmed = confirm(
      "Delete this milestone and all tasks inside it?"
    );
    if (!confirmed) return;

    await deleteTasksForMilestone(milestoneId);
    await deleteMilestone(milestoneId);
    await load();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Project
        </h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view this project.
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

  if (!projectId) {
    return (
      <p className="text-sm text-slate-600">
        No project selected.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Project Detail
        </h1>
        <p className="text-sm text-slate-600">
          Manage milestones and track progress.
        </p>
      </div>

      {/* Create milestone form */}
      <form
        onSubmit={handleCreate}
        className="max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          Create Milestone
        </h2>

        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Milestone name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />

        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={2}
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />

        <input
          type="date"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          disabled={!newName.trim()}
        >
          Add Milestone
        </button>
      </form>

      {/* Milestones list */}
      {loading ? (
        <p className="text-sm text-slate-600">Loading milestones…</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-slate-600">No milestones yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {milestones.map((m) => {
            const isEditing = editingId === m.id;
            const tasks = tasksByMilestone[m.id] ?? [];
            const { total, done, percent } = getMilestoneProgress(tasks);

            if (isEditing) {
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Edit Milestone
                  </h3>

                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <textarea
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={2}
                    value={editDescription}
                    onChange={(e) =>
                      setEditDescription(e.target.value)
                    }
                  />

                  <input
                    type="date"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editDueDate}
                    onChange={(e) =>
                      setEditDueDate(e.target.value)
                    }
                  />

                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as MilestoneStatus
                      )
                    }
                  >
                    <option value="NOT_STARTED">Not started</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  {/* Header / main content */}
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/${projectId}/milestones/${m.id}`)
                    }
                  >
                    <h2 className="text-sm font-semibold text-slate-900">
                      {m.name}
                    </h2>

                    {m.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {m.description}
                      </p>
                    )}

                    {m.dueDate && (
                      <div className="mt-2">
                        {renderMilestoneDueLabel(m.dueDate)}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-slate-600">
                      {total === 0
                        ? "No tasks yet"
                        : `${done}/${total} tasks complete (${percent}%)`}
                    </div>

                    {total > 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-[width]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
