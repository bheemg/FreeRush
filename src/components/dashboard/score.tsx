import { cn } from "@/lib/utils";

function tone(score: number) {
  if (score >= 70) return { ring: "text-success", bg: "bg-success" };
  if (score >= 50) return { ring: "text-warning", bg: "bg-warning" };
  return { ring: "text-danger", bg: "bg-danger" };
}

/** Small status dot used in the project list. */
export function ScoreDot({ score, status }: { score: number | null; status?: string }) {
  if (status === "RUNNING" || status === "QUEUED" || score === null)
    return <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />;
  return <span className={cn("h-2.5 w-2.5 rounded-full", tone(score).bg)} />;
}

/** Big circular score gauge for the overview header. */
export function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const t = tone(score);
  return (
    <div className="relative h-32 w-32">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-border" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={t.ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted">Grade {grade}</span>
      </div>
    </div>
  );
}

/** Horizontal category meter. */
export function ScoreMeter({ label, score }: { label: string; score: number }) {
  const t = tone(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full", t.bg)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
