import { requireContext } from "@/server/auth/context";
import { prisma } from "@/server/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const integrations = [
  { id: "google_search_console", label: "Google Search Console", note: "Real queries, clicks, impressions & positions (free, first-party)" },
  { id: "google_analytics", label: "Google Analytics 4", note: "Sessions & conversions for landing pages (free)" },
  { id: "google_ads", label: "Google Ads", note: "Keyword-volume ranges from Keyword Planner (free with an Ads account)" },
];

export default async function SettingsPage() {
  const ctx = await requireContext();
  const connected = await prisma.integration.findMany({ where: { workspaceId: ctx.workspaceId } });
  const isConnected = (id: string) => connected.some((c) => c.provider === id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Workspace: {ctx.workspaceName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data integrations (free, first-party)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrations.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="font-medium">{it.label}</div>
                <div className="text-xs text-muted">{it.note}</div>
              </div>
              {isConnected(it.id) ? <Badge tone="success">Connected</Badge> : <Badge tone="neutral">Connect (Phase 2)</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
