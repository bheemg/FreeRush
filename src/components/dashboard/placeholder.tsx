import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Used for pages on the roadmap but not yet built, so the nav is never broken.
export function Placeholder({ title, phase, children }: { title: string; phase: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge tone="primary">{phase}</Badge>
      </div>
      <Card className="p-8 text-sm leading-relaxed text-muted">{children}</Card>
    </div>
  );
}
