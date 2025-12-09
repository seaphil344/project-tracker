"use client";

import { useEffect, useState } from "react";
import type { ProjectDoc } from "@/lib/types";
import { listProjects, createProject } from "@/lib/projects";
import { useAuth } from "@/contexts/AuthContext";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Inline project form here to inject ownerId easily
  const handleCreate = async (name: string, description: string) => {
    await createProject({ ownerId: user.uid, name, description });
    await load();
  };

  return (
    <div className="space-y-6">
      <ProjectsHeader onCreate={handleCreate} />
      {loading ? (
        <p className="text-sm text-slate-600">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-slate-600">
          No projects yet. Create your first one to get started.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.id}
              href={`/projects/${p.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{p.name}</h2>
                <span className="rounded-full border px-2 py-1 text-xs">
                  {p.status}
                </span>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {p.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsHeader({
  onCreate
}: {
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onCreate(name.trim(), description.trim());
    setName("");
    setDescription("");
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-slate-600">
          Track work across projects, milestones and tasks.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-2 rounded border bg-white p-3"
      >
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Description (optional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
