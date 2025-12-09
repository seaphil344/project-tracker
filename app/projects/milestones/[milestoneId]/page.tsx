"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listTasksForProject } from "@/lib/tasks";
import { listMilestones } from "@/lib/milestones";
import type { TaskDoc, MilestoneDoc, TaskStatus } from "@/lib/types";
import TaskForm from "@/components/TaskForm";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "BACKLOG", label: "Backlog" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "DONE", label: "Done" }
];

export default function MilestonePage() {
  const params = useParams<{ projectId: string; milestoneId: string }>();
  const projectId = params.projectId;
  const milestoneId = params.milestoneId;

  const { user, loading: authLoading } = useAuth();

  const [milestone, setMilestone] = useState<MilestoneDoc | null>(null);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [allMilestones, allTasks] = await Promise.all([
      listMilestones(projectId),
      listTasksForProject(projectId)
    ]);

    const m =
      allMilestones.find((mi) => mi.id === milestoneId) ?? null;
    setMilestone(m);
    setTasks(allTasks.filter((t) => t.milestoneId === milestoneId));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [projectId, milestoneId]);

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
    DONE: []
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
              {grouped[col.key].map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Priority: {task.priority}
                  </p>
                </div>
              ))}
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
