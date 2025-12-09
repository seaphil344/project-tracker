// hooks/useProjectMilestones.ts
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import type { MilestoneDoc, TaskDoc } from "@/lib/types";

type TasksByMilestone = Record<string, TaskDoc[]>;

// refreshKey is kept for backwards compatibility but not used anymore
export function useProjectMilestones(projectId: string, _refreshKey?: number) {
  const [milestones, setMilestones] = useState<MilestoneDoc[]>([]);
  const [tasksByMilestone, setTasksByMilestone] =
    useState<TasksByMilestone>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);

    // Listen for milestone changes for this project
    const milestonesQuery = query(
      collection(db, "milestones"),
      where("projectId", "==", projectId),
      orderBy("orderIndex", "asc")
    );

    const tasksQuery = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    const unsubMilestones = onSnapshot(milestonesQuery, (snap) => {
      const ms: MilestoneDoc[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MilestoneDoc, "id">),
      }));
      setMilestones(ms);
    });

    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const allTasks: TaskDoc[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<TaskDoc, "id">),
      }));

      const grouped: TasksByMilestone = {};
      for (const t of allTasks) {
        if (!grouped[t.milestoneId]) grouped[t.milestoneId] = [];
        grouped[t.milestoneId].push(t);
      }

      setTasksByMilestone(grouped);
      setLoading(false);
    });

    return () => {
      unsubMilestones();
      unsubTasks();
    };
  }, [projectId]);

  return { milestones, tasksByMilestone, loading };
}
