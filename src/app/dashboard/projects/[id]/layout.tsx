import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { loadProject } from "@/server/projects/queries";
import { ProjectTabs } from "@/components/dashboard/project-tabs";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { project } = await loadProject(id);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {project.domain} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <ProjectTabs projectId={id} />
      {children}
    </div>
  );
}
