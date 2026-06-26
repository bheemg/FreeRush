import PgBoss from "pg-boss";
import { env } from "@/server/env";

// Single pg-boss instance per process. pg-boss uses Postgres as the queue, so we
// need no extra Redis — ideal for the $0 self-hosted stack. Both the web app
// (enqueue side) and the worker (consume side) connect to the same database.
let bossPromise: Promise<PgBoss> | null = null;

export function getBoss(): Promise<PgBoss> {
  if (!bossPromise) {
    const boss = new PgBoss({ connectionString: env.databaseUrl });
    boss.on("error", (err) => console.error("[pg-boss]", err));
    bossPromise = boss.start();
  }
  return bossPromise;
}

export const QUEUES = {
  analysis: "analysis",
  growthReport: "growth-report",
} as const;
