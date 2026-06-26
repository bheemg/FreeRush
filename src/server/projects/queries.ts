import { notFound } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { requireContext } from "@/server/auth/context";
import type { ReportData } from "@/server/analyzer/types";

// Loads a project scoped to the caller's workspace (404 on cross-tenant access)
// plus its latest analysis report. Single source of truth for project pages.
export async function loadProject(projectId: string) {
  const ctx = await requireContext();
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: ctx.workspaceId },
  });
  if (!project) notFound();

  const latest = await prisma.report.findFirst({
    where: { projectId, kind: "ANALYSIS" },
    orderBy: { createdAt: "desc" },
  });

  const history = await prisma.scoreHistory.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: 30,
  });

  return {
    ctx,
    project,
    report: latest,
    data: (latest?.data as ReportData | null) ?? null,
    history: history.map((h) => h.score),
  };
}
