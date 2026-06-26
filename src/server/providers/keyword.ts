import { cached } from "./cache";
import type { KeywordProvider, KeywordIdea } from "./types";

// Free keyword discovery via Google's public Autocomplete endpoint. We expand a
// seed across a-z modifiers to surface long-tail demand. Volume/difficulty are
// intentionally NOT claimed here (no free absolute-volume source) — that lives
// behind VolumeProvider and is shown as relative bands in the UI.
const SUGGEST = "https://suggestqueries.google.com/complete/search";

class AutocompleteKeywordProvider implements KeywordProvider {
  async expand(seed: string): Promise<KeywordIdea[]> {
    return cached("keyword", { seed }, 60 * 60 * 24 * 3, async () => {
      const modifiers = ["", "how", "best", "near me", "vs", "for", "cost", "service"];
      const seen = new Set<string>();
      const ideas: KeywordIdea[] = [];

      for (const mod of modifiers) {
        const q = mod ? `${seed} ${mod}` : seed;
        try {
          const u = new URL(SUGGEST);
          u.searchParams.set("client", "firefox");
          u.searchParams.set("q", q);
          const res = await fetch(u);
          if (!res.ok) continue;
          const data = await res.json(); // [query, [suggestions...]]
          for (const s of (data?.[1] ?? []) as string[]) {
            const k = s.toLowerCase().trim();
            if (!seen.has(k)) {
              seen.add(k);
              ideas.push({ keyword: s, source: "autocomplete" });
            }
          }
        } catch {
          // best-effort; skip failures
        }
      }
      return ideas;
    });
  }
}

export function makeKeywordProvider(): KeywordProvider {
  return new AutocompleteKeywordProvider();
}
