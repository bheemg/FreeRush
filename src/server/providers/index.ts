import { makeAiProvider } from "./ai";
import { makeScrapeProvider } from "./scrape";
import { makeSerpProvider } from "./serp";
import { makeKeywordProvider } from "./keyword";
import { makePerfProvider } from "./perf";
import type {
  AiProvider,
  ScrapeProvider,
  SerpProvider,
  KeywordProvider,
  PerfProvider,
} from "./types";

// The single place callers obtain data providers. Today everything resolves to
// the free/$0 implementation; swapping to a paid impl later is a one-line change
// inside the relevant make*Provider() factory — callers never change.
export interface Providers {
  ai: AiProvider;
  scrape: ScrapeProvider;
  serp: SerpProvider;
  keyword: KeywordProvider;
  perf: PerfProvider;
}

let cached: Providers | null = null;

export function getProviders(): Providers {
  if (!cached) {
    cached = {
      ai: makeAiProvider(),
      scrape: makeScrapeProvider(),
      serp: makeSerpProvider(),
      keyword: makeKeywordProvider(),
      perf: makePerfProvider(),
    };
  }
  return cached;
}

export * from "./types";
