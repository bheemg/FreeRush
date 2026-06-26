import { getBoss, QUEUES } from "./boss";
import type { AnalysisJob } from "./queue";
import { prisma } from "@/server/db/prisma";
import { runAnalysis } from "@/server/analyzer/analyze";

// Long-running background worker. Self-hosting (not serverless) is what lets the
// analysis and the 60-90s growth report run to completion without timeouts.
async function main() {
  const boss = await getBoss();
  await boss.createQueue(QUEUES.analysis);

  await boss.work<AnalysisJob>(QUEUES.analysis, async ([job]) => {
    const { workspaceId, projectId } = job.data;
    const report = await prisma.report.create({
      data: { workspaceId, projectId, kind: "ANALYSIS", status: "QUEUED" },
    });
    try {
      await runAnalysis(report.id);
      console.log(`[worker] analysis complete for project ${projectId}`);
    } catch (err) {
      await prisma.report.update({
        where: { id: report.id },
        data: { status: "FAILED", error: String((err as Error)?.message ?? err) },
      });
      console.error(`[worker] analysis failed for project ${projectId}:`, err);
    }
  });

  console.log("[worker] ready, listening for jobs");
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
