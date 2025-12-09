"use client";

import { useState } from "react";
import { createMilestone } from "@/lib/milestones";

type Props = {
  projectId: string;
  onCreated?: () => void;
};

export default function MilestoneForm({ projectId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await createMilestone(projectId, {
      name: name.trim(),
      description: description.trim(),
      dueDate: null
    });
    setName("");
    setDescription("");
    setSubmitting(false);
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Milestone name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Description (optional)"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create Milestone"}
      </button>
    </form>
  );
}
