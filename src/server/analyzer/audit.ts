import type { ScrapeResult } from "@/server/providers";

export type CheckStatus = "pass" | "warn" | "fail";

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface AuditCategory {
  key: "technical" | "ai" | "content";
  label: string;
  score: number; // 0-100
  checks: Check[];
}

// Deterministic, rules-based site checks run against the scraped page. These are
// the trustworthy, non-AI backbone of the audit (HTTPS, title, meta, canonical,
// viewport, etc.) mirroring the original prototype's readiness checks.
export function runAudit(scrape: ScrapeResult): AuditCategory[] {
  const { meta, html, title, url } = scrape;
  const text = scrape.markdown ?? "";

  const technical: Check[] = [
    check("https", "HTTPS", url.startsWith("https://") ? "pass" : "fail", "Secure connection"),
    check(
      "title",
      "Title tag",
      title && title.length >= 10 && title.length <= 65 ? "pass" : title ? "warn" : "fail",
      title ? `“${title}” (${title.length} chars)` : "Missing <title>",
    ),
    check(
      "meta-desc",
      "Meta description",
      meta.description ? (meta.description.length <= 160 ? "pass" : "warn") : "fail",
      meta.description ? `${meta.description.length} chars` : "No meta description",
    ),
    check("viewport", "Mobile viewport", meta.viewport ? "pass" : "fail", meta.viewport ?? "Missing viewport meta"),
    check("canonical", "Canonical tag", meta.canonical ? "pass" : "warn", meta.canonical ?? "No canonical set"),
    check(
      "robots",
      "Indexable",
      meta.robots?.includes("noindex") ? "fail" : "pass",
      meta.robots ?? "Default (indexable)",
    ),
  ];

  const ai: Check[] = [
    check("h1", "Single clear H1", meta.h1 ? "pass" : "warn", meta.h1 ?? "No H1 found"),
    check(
      "schema",
      "Structured data",
      /application\/ld\+json/i.test(html) ? "pass" : "warn",
      /application\/ld\+json/i.test(html) ? "JSON-LD present" : "No JSON-LD detected",
    ),
    check(
      "answerable",
      "Answer-ready content",
      text.length > 1200 ? "pass" : "warn",
      `${text.length} chars of extractable text`,
    ),
  ];

  const content: Check[] = [
    check("wordcount", "Content depth", text.length > 2000 ? "pass" : text.length > 600 ? "warn" : "fail", `${text.length} chars`),
    check("og", "Social/OG title", meta.ogTitle ? "pass" : "warn", meta.ogTitle ?? "No og:title"),
    check("headings", "Heading structure", /\n##? /.test(text) ? "pass" : "warn", "Section headings detected"),
  ];

  return [
    category("technical", "Technical SEO", technical),
    category("ai", "AI Readiness", ai),
    category("content", "Content & On-Page", content),
  ];
}

function check(id: string, label: string, status: CheckStatus, detail: string): Check {
  return { id, label, status, detail };
}

function category(key: AuditCategory["key"], label: string, checks: Check[]): AuditCategory {
  const score = Math.round(
    (checks.reduce((s, c) => s + (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0), 0) / checks.length) * 100,
  );
  return { key, label, score, checks };
}
