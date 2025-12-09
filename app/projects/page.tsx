"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectDoc } from "@/lib/types";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/projects";
import {
  deleteTasksForProject,
  deleteTasksForMilestone, // ok if unused
} from "@/lib/tasks";
import { deleteMilestonesForProject } from "@/lib/milestones";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] =
    useState<ProjectDoc["status"]>("ACTIVE");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await listProjects(user.uid);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      void load();
    }
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    await createProject({
      ownerId: user.uid,
      name: newName.trim(),
      description: newDescription.trim(),
    });

    setNewName("");
    setNewDescription("");
    await load();
  };

  const startEdit = (p: ProjectDoc) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description ?? "");
    setEditStatus(p.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditStatus("ACTIVE");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    await updateProject(editingId, {
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    });

    cancelEdit();
    await load();
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = confirm(
      "Delete this project, its milestones, and all tasks? This cannot be undone."
    );
    if (!confirmed) return;

    // Cascade delete: tasks → milestones → project
    await deleteTasksForProject(projectId);
    await deleteMilestonesForProject(projectId);
    await deleteProject(projectId);

    await load();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-600">Checking auth…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view your projects.
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
      {/* Header + create form */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-600">
            Track work across projects, milestones and tasks.
          </p>
        </div>
        <form
          onSubmit={handleCreate}
          className="w-full max-w-sm space-y-2 rounded border bg-white p-3"
        >
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Description (optional)"
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!newName.trim()}
          >
            Create Project
          </button>
        </form>
      </div>

      {/* Project list */}
      {loading ? (
        <p className="text-sm text-slate-600">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-600">
          No projects yet. Create your first one to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const isEditing = editingId === p.id;

            if (isEditing) {
              return (
                <div
                  key={p.id}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <input
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Project name"
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
                    <select
                      className="w-full rounded border px-3 py-2 text-sm"
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(
                          e.target.value as ProjectDoc["status"]
                        )
                      }
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex-1 rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 rounded border px-3 py-2 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div
                    className="flex cursor-pointer items-start justify-between gap-2"
                    onClick={() =>
                      (window.location.href = `/projects/${p.id}`)
                    }
                  >
                    <div>
                      <h2 className="font-medium">{p.name}</h2>
                      {p.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs">
                      {p.status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="flex-1 rounded border px-3 py-2 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p.id)}
                      className="flex-1 rounded border px-3 py-2 text-xs text-red-600"
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
