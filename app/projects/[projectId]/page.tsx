"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import type {
  MilestoneDoc,
  TaskDoc,
  MilestoneStatus,
} from "@/lib/types";
import MilestoneForm from "@/components/MilestoneForm";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateMilestoneStatus,
  updateMilestone,
  deleteMilestone,
} from "@/lib/milestones";
import { deleteTasksForMilestone } from "@/lib/tasks";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { user, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const { milestones, tasksByMilestone, loading } =
    useProjectMilestones(projectId, refreshKey);

  const reload = () => setRefreshKey((k) => k + 1);

  // ✏️ Editing state for milestones
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDateInput, setEditDueDateInput] = useState("");

  const startEdit = (m: MilestoneDoc) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditDescription(m.description ?? "");
    if (m.dueDate) {
      const d = new Date(m.dueDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setEditDueDateInput(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditDueDateInput("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditDueDateInput("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    let dueDate: number | null = null;
    if (editDueDateInput) {
      const d = new Date(editDueDateInput + "T00:00:00");
      dueDate = d.getTime();
    }

    await updateMilestone(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      dueDate,
    });

    cancelEdit();
    reload();
  };

  const handleMilestoneStatusChange = async (
    milestoneId: string,
    status: MilestoneStatus
  ) => {
    await updateMilestoneStatus(milestoneId, status);
    reload();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const confirmed = confirm(
      "Delete this milestone and all its tasks? This cannot be undone."
    );
    if (!confirmed) return;

    // Cascade delete: tasks first, then milestone
    await deleteTasksForMilestone(milestoneId);
    await deleteMilestone(milestoneId);
    reload();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Project</h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view this project.
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Project</h1>
          <p className="text-sm text-slate-600">
            Milestones break the project into meaningful chunks.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <MilestoneForm projectId={projectId} onCreated={reload} />
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Loading milestones...</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-slate-600">
          No milestones yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {milestones.map((m: MilestoneDoc) => {
            const tasks = tasksByMilestone[m.id] ?? [];
            const done = tasks.filter(
              (t: TaskDoc) => t.status === "DONE"
            ).length;

            const isEditing = editingId === m.id;

            if (isEditing) {
              return (
                <div
                  key={m.id}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-2">
                      <input
                        className="w-full rounded border px-3 py-2 text-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Milestone name"
                      />
                      <textarea
                        className="w-full rounded border px-3 py-2 text-sm"
                        rows={2}
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        placeholder="Description"
                      />
                      <input
                        type="date"
                        className="w-full rounded border px-3 py-2 text-sm md:max-w-xs"
                        value={editDueDateInput}
                        onChange={(e) =>
                          setEditDueDateInput(e.target.value)
                        }
                      />
                    </div>
                    <div className="mt-3 flex flex-col gap-2 md:mt-0 md:w-40">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded border px-3 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/${projectId}/milestones/${m.id}`)
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-medium">{m.name}</h2>
                      <select
                        className="rounded border px-2 py-1 text-xs"
                        value={m.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleMilestoneStatusChange(
                            m.id,
                            e.target.value as MilestoneStatus
                          )
                        }
                      >
                        <option value="NOT_STARTED">Not started</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                    {m.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {m.description}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500">
                      {done}/{tasks.length} tasks complete
                    </p>
                  </div>

                  <div className="flex gap-2 md:w-40 md:flex-col">
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="w-full rounded border px-3 py-2 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMilestone(m.id)}
                      className="w-full rounded border px-3 py-2 text-xs text-red-600"
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
