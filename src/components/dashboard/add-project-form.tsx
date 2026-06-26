"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject } from "@/server/projects/actions";

export function AddProjectForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add site
      </Button>
    );
  }

  return (
    <form action={createProject} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-3">
      <Input name="name" placeholder="Site name" className="w-40" />
      <Input name="url" placeholder="example.com" className="w-56" required />
      <Button type="submit">Analyze</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
