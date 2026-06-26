// Central, typed access to runtime configuration. Keeps provider code free of
// scattered process.env lookups and makes the $0-vs-paid switches obvious.
export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  authSecret: process.env.AUTH_SECRET ?? "dev-secret",

  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  },

  searxngUrl: process.env.SEARXNG_URL ?? "http://localhost:8080",
  scraperUrl: process.env.SCRAPER_URL ?? "http://localhost:3001",
  pagespeedKey: process.env.PAGESPEED_API_KEY ?? "",

  // Public base URL of the app (used to build OAuth redirect URIs).
  appUrl: process.env.AUTH_URL ?? "http://localhost:3000",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },

  serp: {
    country: process.env.SERP_COUNTRY ?? "au",
    language: process.env.SERP_LANGUAGE ?? "en",
  },

  // Optional paid providers — presence flips the provider factory to the paid impl.
  paid: {
    firecrawl: process.env.FIRECRAWL_API_KEY ?? "",
    serpapi: process.env.SERPAPI_API_KEY ?? "",
  },
} as const;
