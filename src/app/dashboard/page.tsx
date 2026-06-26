import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { prisma } from "@/server/db/prisma";
import { requireContext } from "@/server/auth/context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddProjectForm } from "@/components/dashboard/add-project-form";
import { ScoreDot } from "@/components/dashboard/score";

export default async function DashboardPage() {
  const ctx = await requireContext();
  const projects = await prisma.project.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      reports: { where: { kind: "ANALYSIS" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted">Sites you&apos;re tracking and analyzing.</p>
        </div>
        <AddProjectForm />
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Globe className="h-8 w-8 text-muted" />
          <p className="font-medium">No sites yet</p>
          <p className="text-sm text-muted">Add your first site to run an AI-grounded SEO analysis.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const latest = p.reports[0];
            return (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <ScoreDot score={latest?.score ?? null} status={latest?.status} />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted">{p.domain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={latest?.status} score={latest?.score} />
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, score }: { status?: string; score?: number | null }) {
  if (!status || status === "QUEUED" || status === "RUNNING")
    return <Badge tone="primary">Analyzing…</Badge>;
  if (status === "FAILED") return <Badge tone="danger">Failed</Badge>;
  if (typeof score === "number")
    return <Badge tone={score >= 70 ? "success" : score >= 50 ? "warning" : "danger"}>Score {score}</Badge>;
  return <Badge>Ready</Badge>;
}
