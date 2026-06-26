import { getBoss, QUEUES } from "./boss";

export interface AnalysisJob {
  workspaceId: string;
  projectId: string;
}

// Enqueue side, called from server actions. Ensures the queue exists then sends.
export async function enqueueAnalysis(data: AnalysisJob): Promise<void> {
  const boss = await getBoss();
  await boss.createQueue(QUEUES.analysis);
  await boss.send(QUEUES.analysis, data);
}
