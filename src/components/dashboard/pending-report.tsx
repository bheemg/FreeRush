"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

// Renders the not-ready states for a report and quietly polls for completion
// while a background analysis is running.
export function PendingReport({ status, progress, error }: { status?: string; progress?: number; error?: string | null }) {
  const router = useRouter();
  const running = !status || status === "QUEUED" || status === "RUNNING";

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [running, router]);

  if (status === "FAILED") {
    return (
      <Card className="flex flex-col items-center gap-2 p-12 text-center">
        <AlertTriangle className="h-8 w-8 text-danger" />
        <p className="font-medium">Analysis failed</p>
        <p className="max-w-md text-sm text-muted">{error || "Something went wrong. Try re-running the analysis."}</p>
      </Card>
    );
  }

  if (running) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium">Analyzing your site…</p>
        <p className="text-sm text-muted">Scraping, auditing, and synthesizing with AI. This runs in the background.</p>
        {typeof progress === "number" && (
          <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(progress, 5)}%` }} />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-2 p-12 text-center">
      <Sparkles className="h-8 w-8 text-muted" />
      <p className="font-medium">No analysis yet</p>
    </Card>
  );
}
