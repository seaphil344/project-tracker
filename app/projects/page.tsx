"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectDoc } from "@/lib/types";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/projects";
import { deleteTasksForProject } from "@/lib/tasks";
import { deleteMilestonesForProject } from "@/lib/milestones";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type ProjectSummary = {
  projectId: string;
  milestoneCount: number;
  taskCount: number;
  doneTaskCount: number;
  nextDue: number | null; // earliest milestone.dueDate
};

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
    return (
      <span className="text-xs font-medium text-red-600">
        Next due: Overdue • {labelDate}
      </span>
    );
  } else if (dueDay === todayStart) {
    return (
      <span className="text-xs font-medium text-amber-600">
        Next due: Today • {labelDate}
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-slate-600">
      Next due: {labelDate}
    </span>
  );
}

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

  // summaries
  const [summaries, setSummaries] = useState<
    Record<string, ProjectSummary>
  >({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await listProjects(user.uid);
    setProjects(data);
    setLoading(false);
  };

  // load projects
  useEffect(() => {
    if (!authLoading && user) {
      void load();
    }
  }, [authLoading, user]);

  // load summaries for each project (milestones, tasks, next due date)
  useEffect(() => {
    const fetchSummaries = async () => {
      if (!projects.length) {
        setSummaries({});
        return;
      }

      const result: Record<string, ProjectSummary> = {};

      for (const p of projects) {
        // milestones for this project
        const milestonesQ = query(
          collection(db, "milestones"),
          where("projectId", "==", p.id)
        );
        const milestonesSnap = await getDocs(milestonesQ);
        const milestoneDocs = milestonesSnap.docs.map((d) => d.data() as any);

        const milestoneCount = milestoneDocs.length;

        // compute earliest due date (if any milestone has dueDate)
        let nextDue: number | null = null;
        for (const m of milestoneDocs) {
          if (m.dueDate) {
            if (nextDue === null || m.dueDate < nextDue) {
              nextDue = m.dueDate;
            }
          }
        }

        // tasks for this project
        const tasksQ = query(
          collection(db, "tasks"),
          where("projectId", "==", p.id)
        );
        const tasksSnap = await getDocs(tasksQ);
        const taskDocs = tasksSnap.docs.map((d) => d.data() as any);

        const taskCount = taskDocs.length;
        const doneTaskCount = taskDocs.filter(
          (t) => t.status === "DONE"
        ).length;

        result[p.id] = {
          projectId: p.id,
          milestoneCount,
          taskCount,
          doneTaskCount,
          nextDue,
        };
      }

      setSummaries(result);
    };

    void fetchSummaries();
  }, [projects]);

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
        <h1 className="text-2xl font-semibold text-slate-900">
          Projects
        </h1>
        <p className="text-sm text-slate-600">
          You must be logged in to view your projects.
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
      {/* Header + create form */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Projects
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track work across projects, milestones, and tasks.
          </p>
        </div>
        <form
          onSubmit={handleCreate}
          className="w-full max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Description (optional)"
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
            const summary = summaries[p.id];

            const percent =
              summary && summary.taskCount > 0
                ? Math.round(
                    (summary.doneTaskCount / summary.taskCount) * 100
                  )
                : 0;

            if (isEditing) {
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Project name"
                    />
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={2}
                      value={editDescription}
                      onChange={(e) =>
                        setEditDescription(e.target.value)
                      }
                      placeholder="Description"
                    />
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                key={p.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div
                    className="flex cursor-pointer items-start justify-between gap-2"
                    onClick={() =>
                      (window.location.href = `/projects/${p.id}`)
                    }
                  >
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {p.name}
                      </h2>
                      {p.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {p.description}
                        </p>
                      )}

                      {/* Summary area */}
                      {summary && (
                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                          <p>
                            {summary.milestoneCount} milestone
                            {summary.milestoneCount === 1 ? "" : "s"} •{" "}
                            {summary.taskCount} task
                            {summary.taskCount === 1 ? "" : "s"}
                          </p>
                          {summary.taskCount > 0 && (
                            <p>
                              {summary.doneTaskCount}/
                              {summary.taskCount} tasks complete (
                              {percent}%)
                            </p>
                          )}
                          {summary.nextDue && (
                            <p>{renderDueLabel(summary.nextDue)}</p>
                          )}
                        </div>
                      )}

                      {summary && summary.taskCount > 0 && (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-[width]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status pill */}
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${
                        p.status === "ACTIVE"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status === "ACTIVE" ? "Active" : "Archived"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p.id)}
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
