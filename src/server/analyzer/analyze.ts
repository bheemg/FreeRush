import { prisma } from "@/server/db/prisma";
import { getProviders } from "@/server/providers";
import { runAudit } from "./audit";
import type { BusinessProfile, KeywordRow, PriorityItem, ReportData } from "./types";

const SYNTHESIS_SYSTEM = `You are an expert SEO and AI-search strategist analyzing a real business website.
Use the provided scraped content. Be specific and grounded — never invent facts (phone, address, services)
that aren't supported by the content. Return STRICT JSON matching the requested schema.`;

interface AiSynthesis {
  business: BusinessProfile;
  executiveSummary: string;
  priorities: PriorityItem[];
  keywords: KeywordRow[];
}

// Orchestrates one full site analysis and writes a completed Report + score
// history. Designed to run inside the pg-boss worker (no serverless timeout).
export async function runAnalysis(reportId: string): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id: reportId }, include: { project: true } });
  if (!report) throw new Error(`report ${reportId} not found`);
  const { project } = report;
  const { scrape, perf, ai } = getProviders();

  await prisma.report.update({ where: { id: reportId }, data: { status: "RUNNING", progress: 10 } });

  // 1. Scrape + 2. deterministic audit + 3. performance (parallel where possible)
  const scraped = await scrape.scrape(project.url);
  await prisma.report.update({ where: { id: reportId }, data: { progress: 40 } });

  const [audit, perfResult] = await Promise.all([
    Promise.resolve(runAudit(scraped)),
    perf.audit(project.url),
  ]);
  await prisma.report.update({ where: { id: reportId }, data: { progress: 60 } });

  // 4. AI synthesis (grounded JSON)
  const prompt = buildPrompt(project.url, scraped.title, scraped.markdown.slice(0, 8000));
  const aiRes = await ai.generate(prompt, { system: SYNTHESIS_SYSTEM, json: true, grounded: true });
  const synthesis = parseSynthesis(aiRes.text);
  await prisma.report.update({ where: { id: reportId }, data: { progress: 85 } });

  // 5. Score = audit categories (85%) + performance (15%)
  const auditAvg = audit.reduce((s, c) => s + c.score, 0) / audit.length;
  const overallScore = Math.round(auditAvg * 0.85 + (perfResult.fetched ? perfResult.score : auditAvg) * 0.15);

  const data: ReportData = {
    grounded: aiRes.grounded,
    overallScore,
    grade: toGrade(overallScore),
    aiReady: overallScore >= 70 && audit.find((c) => c.key === "ai")!.score >= 60,
    perf: { score: perfResult.score, fetched: perfResult.fetched },
    audit,
    business: synthesis.business,
    executiveSummary: synthesis.executiveSummary,
    priorities: synthesis.priorities,
    keywords: synthesis.keywords,
  };

  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { status: "COMPLETE", progress: 100, grounded: aiRes.grounded, score: overallScore, data: data as object },
    }),
    prisma.scoreHistory.create({
      data: { workspaceId: report.workspaceId, projectId: project.id, score: overallScore },
    }),
  ]);
}

function buildPrompt(url: string, title: string, content: string): string {
  return `Analyze this website for SEO and AI-search readiness.
URL: ${url}
Title: ${title}
Scraped content:
"""
${content}
"""

Return JSON with this exact shape:
{
  "business": { "name": string, "type": string, "services": string[], "location": string|null,
    "isLocal": boolean, "trustSignals": string[], "phone": string|null, "address": string|null },
  "executiveSummary": string,
  "priorities": [{ "title": string, "why": string }],  // top 3
  "keywords": [{ "keyword": string, "intent": string, "priority": "now"|"soon"|"later",
    "difficulty": "easy"|"medium"|"hard", "rationale": string }]  // 8-12 customer search phrases
}`;
}

function parseSynthesis(text: string): AiSynthesis {
  const fallback: AiSynthesis = {
    business: { name: "Unknown", type: "Unknown", services: [], location: null, isLocal: false, trustSignals: [], phone: null, address: null },
    executiveSummary: "Analysis could not be synthesized (no AI key configured or response unparseable).",
    priorities: [],
    keywords: [],
  };
  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<AiSynthesis>;
    return {
      business: { ...fallback.business, ...parsed.business },
      executiveSummary: parsed.executiveSummary ?? fallback.executiveSummary,
      priorities: parsed.priorities ?? [],
      keywords: parsed.keywords ?? [],
    };
  } catch {
    return fallback;
  }
}

function toGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "F";
}
