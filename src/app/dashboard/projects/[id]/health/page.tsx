import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { loadProject } from "@/server/projects/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingReport } from "@/components/dashboard/pending-report";
import type { CheckStatus } from "@/server/analyzer/audit";

const icon = {
  pass: <CheckCircle2 className="h-4 w-4 text-success" />,
  warn: <AlertTriangle className="h-4 w-4 text-warning" />,
  fail: <XCircle className="h-4 w-4 text-danger" />,
};

export default async function HealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, data } = await loadProject(id);

  if (!data || report?.status !== "COMPLETE") {
    return <PendingReport status={report?.status} progress={report?.progress} error={report?.error} />;
  }

  return (
    <div className="space-y-5">
      {data.perf.fetched && (
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <div className="font-medium">Core Web Vitals (PageSpeed)</div>
              <div className="text-sm text-muted">Mobile performance score · 15% of overall grade</div>
            </div>
            <div className="text-3xl font-bold">{data.perf.score}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {data.audit.map((cat) => (
          <Card key={cat.key}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{cat.label}</CardTitle>
              <span className="text-lg font-bold">{cat.score}</span>
            </CardHeader>
            <CardContent className="space-y-2">
              {cat.checks.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  {icon[c.status as CheckStatus]}
                  <div>
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted">{c.detail}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
