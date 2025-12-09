"use client";

import { useState } from "react";
import { createTask } from "@/lib/tasks";
import type { TaskPriority } from "@/lib/types";

type Props = {
  projectId: string;
  milestoneId: string;
  onCreated?: () => void;
};

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function TaskForm({ projectId, milestoneId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    await createTask(projectId, milestoneId, {
      title: title.trim(),
      priority,
      description: "",
      dueDate: null,
      assigneeId: null
    });
    setTitle("");
    setPriority("MEDIUM");
    setSubmitting(false);
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        className="w-full rounded border px-3 py-2 text-sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
