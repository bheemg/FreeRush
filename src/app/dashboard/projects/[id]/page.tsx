import { loadProject } from "@/server/projects/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing, ScoreMeter } from "@/components/dashboard/score";
import { PendingReport } from "@/components/dashboard/pending-report";
import { Sparkline } from "@/components/dashboard/sparkline";

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, data, history } = await loadProject(id);

  if (!data || report?.status !== "COMPLETE") {
    return <PendingReport status={report?.status} progress={report?.progress} error={report?.error} />;
  }

  const b = data.business;

  return (
    <div className="space-y-5">
      {/* Score header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-8 pt-5">
          <div className="flex items-center gap-5">
            <ScoreRing score={data.overallScore} grade={data.grade} />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {data.aiReady ? <Badge tone="success">AI-Ready</Badge> : <Badge tone="warning">Not AI-Ready</Badge>}
                {data.grounded ? <Badge tone="primary">Grounded</Badge> : <Badge>Sample data</Badge>}
              </div>
              <div className="text-sm text-muted">{b.type}{b.location ? ` · ${b.location}` : ""}</div>
              {history.length > 1 && <Sparkline values={history} />}
            </div>
          </div>
          <div className="grid flex-1 gap-3 sm:min-w-64">
            {data.audit.map((c) => (
              <ScoreMeter key={c.key} label={c.label} score={c.score} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Executive summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-foreground/90">{data.executiveSummary}</CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Top priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Top priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.priorities.length === 0 && <p className="text-sm text-muted">No priorities generated.</p>}
            {data.priorities.map((p, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2 font-medium">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                    {i + 1}
                  </span>
                  {p.title}
                </div>
                <p className="mt-1 text-sm text-muted">{p.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* About the business */}
        <Card>
          <CardHeader>
            <CardTitle>About the business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={b.name} />
            <Row label="Type" value={b.type} />
            <Row label="Services" value={b.services.join(", ") || "—"} />
            <Row label="Location" value={b.location || "—"} />
            <Row label="Phone" value={b.phone || "—"} />
            <Row label="Address" value={b.address || "—"} />
            {b.trustSignals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {b.trustSignals.map((t) => (
                  <Badge key={t} tone="neutral">{t}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
