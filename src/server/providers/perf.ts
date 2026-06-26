import { env } from "@/server/env";
import { cached } from "./cache";
import type { PerfProvider, PerfResult } from "./types";

// PageSpeed Insights (free, 25k/day with a key; works keyless at low volume).
// Feeds Core Web Vitals into the overall grade, as in the original prototype.
const PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

class PageSpeedProvider implements PerfProvider {
  async audit(url: string): Promise<PerfResult> {
    return cached("perf", { url }, 60 * 60 * 24, async () => {
      const u = new URL(PSI);
      u.searchParams.set("url", url);
      u.searchParams.set("strategy", "mobile");
      u.searchParams.append("category", "performance");
      if (env.pagespeedKey) u.searchParams.set("key", env.pagespeedKey);

      try {
        const res = await fetch(u);
        if (!res.ok) return { score: 0, fetched: false } satisfies PerfResult;
        const data = await res.json();
        const lh = data?.lighthouseResult;
        const audits = lh?.audits ?? {};
        return {
          score: Math.round((lh?.categories?.performance?.score ?? 0) * 100),
          lcp: audits["largest-contentful-paint"]?.numericValue,
          cls: audits["cumulative-layout-shift"]?.numericValue,
          inp: audits["interaction-to-next-paint"]?.numericValue,
          fetched: true,
        } satisfies PerfResult;
      } catch {
        return { score: 0, fetched: false } satisfies PerfResult;
      }
    });
  }
}

export function makePerfProvider(): PerfProvider {
  return new PageSpeedProvider();
}
