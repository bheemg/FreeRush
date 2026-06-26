// Provider contracts. Each external data capability hides behind an interface so
// the $0 free implementation can be swapped for a paid one later without touching
// callers. The provider factory (./index.ts) picks the impl based on env keys.

export interface ScrapeResult {
  url: string;
  status: number;
  html: string;
  markdown: string;
  title: string;
  meta: {
    description: string | null;
    canonical: string | null;
    viewport: string | null;
    ogTitle: string | null;
    robots: string | null;
    h1: string | null;
  };
}

export interface ScrapeProvider {
  scrape(url: string): Promise<ScrapeResult>;
}

export interface SerpItem {
  position: number;
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface SerpResult {
  query: string;
  items: SerpItem[];
  relatedSearches: string[];
  peopleAlsoAsk: string[];
}

export interface SerpProvider {
  search(query: string): Promise<SerpResult>;
}

export interface KeywordIdea {
  keyword: string;
  source: "autocomplete" | "paa" | "related";
}

export interface KeywordProvider {
  expand(seed: string): Promise<KeywordIdea[]>;
}

export interface PerfResult {
  score: number; // 0-100 performance score
  lcp?: number;
  cls?: number;
  inp?: number;
  fetched: boolean;
}

export interface PerfProvider {
  audit(url: string): Promise<PerfResult>;
}

export interface AiGenerateOptions {
  system?: string;
  json?: boolean;
  grounded?: boolean;
  temperature?: number;
}

export interface AiResult {
  text: string;
  grounded: boolean;
  model: string;
}

export interface AiProvider {
  generate(prompt: string, opts?: AiGenerateOptions): Promise<AiResult>;
}
