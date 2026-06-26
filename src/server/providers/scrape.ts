import { env } from "@/server/env";
import { cached } from "./cache";
import type { ScrapeProvider, ScrapeResult } from "./types";

// Calls our self-hosted Playwright scraper service (services/scraper). Replaces
// Firecrawl at $0. Results cached 24h so re-running an analysis is free.
class HttpScrapeProvider implements ScrapeProvider {
  async scrape(url: string): Promise<ScrapeResult> {
    return cached("scrape", { url }, 60 * 60 * 24, async () => {
      const res = await fetch(`${env.scraperUrl}/scrape`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`scraper ${res.status}: ${await res.text()}`);
      return (await res.json()) as ScrapeResult;
    });
  }
}

export function makeScrapeProvider(): ScrapeProvider {
  return new HttpScrapeProvider();
}
