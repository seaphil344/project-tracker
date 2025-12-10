"use client";

import { useState } from "react";
import { createTask } from "@/lib/tasks";

export default function TaskForm({
  projectId,
  milestoneId,
  onCreated,
}: {
  projectId: string;
  milestoneId: string;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    await createTask({
      projectId,
      milestoneId,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
      priority,
      status: "BACKLOG",
    });

    setLoading(false);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");

    onCreated?.();
  };

  return (
    <form
      onSubmit={handleCreate}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
    >
      <h3 className="text-sm font-semibold text-slate-900">Add Task</h3>

      {/* Title */}
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Description */}
      <textarea
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Task description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Row: due date + priority */}
      <div className="flex gap-3">
        <input
          type="date"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <select
          className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      {/* PRIMARY BUTTON — matches all other buttons across the app */}
      <button
        type="submit"
        disabled={!title.trim() || loading}
        className="
          w-full rounded-lg 
          bg-indigo-600 
          px-4 py-2 
          text-sm font-medium text-white 
          hover:bg-indigo-700 
          disabled:opacity-50
        "
      >
        {loading ? "Adding…" : "Add Task"}
      </button>
    </form>
  );
}
