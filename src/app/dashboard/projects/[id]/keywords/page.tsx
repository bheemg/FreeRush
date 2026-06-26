import { loadProject } from "@/server/projects/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingReport } from "@/components/dashboard/pending-report";

const priorityTone = { now: "danger", soon: "warning", later: "neutral" } as const;
const difficultyTone = { easy: "success", medium: "warning", hard: "danger" } as const;

export default async function KeywordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, data } = await loadProject(id);

  if (!data || report?.status !== "COMPLETE") {
    return <PendingReport status={report?.status} progress={report?.progress} error={report?.error} />;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-background text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Search phrase</th>
            <th className="px-4 py-3 font-medium">Intent</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Difficulty</th>
            <th className="px-4 py-3 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {data.keywords.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted">
                No keywords generated.
              </td>
            </tr>
          )}
          {data.keywords.map((k, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{k.keyword}</td>
              <td className="px-4 py-3 text-muted">{k.intent}</td>
              <td className="px-4 py-3">
                <Badge tone={priorityTone[k.priority] ?? "neutral"}>{k.priority}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={difficultyTone[k.difficulty] ?? "neutral"}>{k.difficulty}</Badge>
              </td>
              <td className="px-4 py-3 text-muted">{k.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
