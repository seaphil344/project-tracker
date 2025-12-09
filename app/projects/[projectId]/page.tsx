"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProjectMilestones } from "@/hooks/useProjectMilestones";
import type { MilestoneDoc, TaskDoc, MilestoneStatus } from "@/lib/types";
import MilestoneForm from "@/components/MilestoneForm";
import { useAuth } from "@/contexts/AuthContext";
import { updateMilestoneStatus } from "@/lib/milestones";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const { user, loading: authLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const { milestones, tasksByMilestone, loading } =
    useProjectMilestones(projectId, refreshKey);

  const reload = () => setRefreshKey((k) => k + 1);

  // ✅ NEW: handler for milestone status
  const handleMilestoneStatusChange = async (
    milestoneId: string,
    status: MilestoneStatus
  ) => {
    await updateMilestoneStatus(milestoneId, status);
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
            const done = tasks.filter((t: TaskDoc) => t.status === "DONE").length;

            return (
              <a
                key={m.id}
                href={`/projects/${projectId}/milestones/${m.id}`}
                className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{m.name}</h2>
                    {m.description && (
                      <p className="mt-1 text-sm text-slate-600">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* ✅ NEW: milestone status select */}
                  <select
                    className="rounded border px-2 py-1 text-xs"
                    value={m.status}
                    onChange={(e) =>
                      handleMilestoneStatusChange(
                        m.id,
                        e.target.value as MilestoneStatus
                      )
                    }
                    onClick={(e) => e.stopPropagation()} // prevent link navigation
                  >
                    <option value="NOT_STARTED">Not started</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {done}/{tasks.length} tasks complete
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
