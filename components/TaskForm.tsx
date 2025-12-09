"use client";

import { useState } from "react";
import { createTask } from "@/lib/tasks";
import type { TaskPriority } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  projectId: string;
  milestoneId: string;
  onCreated?: () => void;
};

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function TaskForm({ projectId, milestoneId, onCreated }: Props) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!user) return; // Must be logged in

    setSubmitting(true);

    try {
      await createTask(projectId, milestoneId, {
        title: title.trim(),
        priority,
        description: "",
        dueDate: null,
        assigneeId: user.uid,       // 👈 Assigned to current user
      });

      setTitle("");
      setPriority("MEDIUM");
      onCreated?.();
    } catch (err) {
      console.error("Error creating task:", err);
    }

    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-sm"
    >
      <input
        type="text"
        placeholder="New task title"
        className="w-full rounded border px-3 py-2 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={submitting}
      />

      <select
        className="rounded border px-2 py-1 text-sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        disabled={submitting}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={submitting || !user}
        className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Add Task"}
      </button>
    </form>
  );
}
