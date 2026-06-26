import { env } from "@/server/env";
import { toDomain } from "@/lib/utils";
import { cached } from "./cache";
import type { SerpProvider, SerpResult, SerpItem } from "./types";

// Free SERP-like data via self-hosted SearXNG (a metasearch aggregator). Not a
// 1:1 Google SERP, but enough for competitor discovery and rank approximation
// without per-call fees. Cached 12h to conserve the instance.
class SearxngSerpProvider implements SerpProvider {
  async search(query: string): Promise<SerpResult> {
    return cached("serp", { query, country: env.serp.country }, 60 * 60 * 12, async () => {
      const u = new URL("/search", env.searxngUrl);
      u.searchParams.set("q", query);
      u.searchParams.set("format", "json");
      u.searchParams.set("language", env.serp.language);
      u.searchParams.set("engines", "google");

      const res = await fetch(u, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`searxng ${res.status}`);
      const data = await res.json();

      const items: SerpItem[] = (data.results ?? [])
        .slice(0, 20)
        .map((r: { title: string; url: string; content?: string }, i: number) => ({
          position: i + 1,
          title: r.title,
          url: r.url,
          domain: toDomain(r.url),
          snippet: r.content,
        }));

      return {
        query,
        items,
        relatedSearches: (data.suggestions ?? []).slice(0, 10),
        peopleAlsoAsk: (data.answers ?? []).map((a: { answer?: string } | string) =>
          typeof a === "string" ? a : a.answer ?? "",
        ),
      } satisfies SerpResult;
    });
  }
}

export function makeSerpProvider(): SerpProvider {
  return new SearxngSerpProvider();
}
