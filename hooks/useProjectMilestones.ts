"use client";

import { useEffect, useState } from "react";
import { listMilestones } from "@/lib/milestones";
import { listTasksForProject } from "@/lib/tasks";
import type { MilestoneDoc, TaskDoc } from "@/lib/types";

export function useProjectMilestones(projectId: string, refreshKey = 0) {
  const [milestones, setMilestones] = useState<MilestoneDoc[]>([]);
  const [tasksByMilestone, setTasksByMilestone] =
    useState<Record<string, TaskDoc[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      setLoading(true);

      const [miles, tasks] = await Promise.all([
        listMilestones(projectId),
        listTasksForProject(projectId),
      ]);

      const grouped: Record<string, TaskDoc[]> = {};
      for (const t of tasks) {
        if (!grouped[t.milestoneId]) grouped[t.milestoneId] = [];
        grouped[t.milestoneId].push(t);
      }

      setMilestones(miles);
      setTasksByMilestone(grouped);
      setLoading(false);
    };

    void load();
  }, [projectId, refreshKey]);

  return { milestones, tasksByMilestone, loading };
}
