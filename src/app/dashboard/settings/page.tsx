import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { requireContext } from "@/server/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { googleConfigured, listSites, GOOGLE_PROVIDER } from "@/server/integrations/google";
import { disconnectGoogle } from "@/server/integrations/actions";
import { prisma } from "@/server/db/prisma";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const ctx = await requireContext();
  const sp = await searchParams;

  const gscIntegration = await prisma.integration.findUnique({
    where: { workspaceId_provider: { workspaceId: ctx.workspaceId, provider: GOOGLE_PROVIDER } },
  });
  const gscConnected = Boolean(gscIntegration);
  const sites = gscConnected ? await listSites(ctx.workspaceId) : [];
  const configured = googleConfigured();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Workspace: {ctx.workspaceName}</p>
      </div>

      {sp.connected === "google" && (
        <Banner tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
          Google Search Console connected.
        </Banner>
      )}
      {sp.error && (
        <Banner tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
          {sp.error === "google_not_configured"
            ? "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env, then restart."
            : "Couldn't complete the Google connection. Please try again."}
        </Banner>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Google Search Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Real queries, clicks, impressions & positions for sites you own — free, first-party data SEMRUSH can only
            estimate.
          </p>

          {!configured ? (
            <Badge tone="warning">Add Google API keys to .env first</Badge>
          ) : gscConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge tone="success">Connected</Badge>
                <form action={disconnectGoogle}>
                  <Button type="submit" variant="outline" size="sm">
                    Disconnect
                  </Button>
                </form>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Your properties</div>
                {sites.length === 0 ? (
                  <p className="text-sm text-muted">No verified Search Console properties found on this account.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {sites.map((s) => (
                      <li key={s.siteUrl} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <span>{s.siteUrl}</span>
                        <Badge tone="neutral">{s.permissionLevel}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <Link href="/api/integrations/google/start">
              <Button>Connect Google Search Console</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>Google Analytics 4 — sessions & conversions</span>
            <Badge tone="neutral">Phase 2</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>Google Ads — keyword-volume ranges</span>
            <Badge tone="neutral">Phase 2</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Banner({ tone, icon, children }: { tone: "success" | "danger"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls = tone === "success" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger";
  return <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${cls}`}>{icon}{children}</div>;
}
