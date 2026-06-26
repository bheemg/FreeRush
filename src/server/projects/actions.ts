"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { requireContext } from "@/server/auth/context";
import { toDomain } from "@/lib/utils";
import { enqueueAnalysis } from "@/server/jobs/queue";

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(3),
});

// Creates a project inside the caller's workspace and kicks off the first
// analysis as a background job. Tenant scoping comes from requireContext().
export async function createProject(formData: FormData) {
  const ctx = await requireContext();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
  });
  if (!parsed.success) return;

  const rawUrl = parsed.data.url;
  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  const domain = toDomain(url);

  const project = await prisma.project.create({
    data: {
      workspaceId: ctx.workspaceId,
      name: parsed.data.name || domain,
      url,
      domain,
    },
  });

  await enqueueAnalysis({ workspaceId: ctx.workspaceId, projectId: project.id });

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${project.id}`);
}
