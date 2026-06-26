# FreeRush

An AI-grounded SEO command center — a polished, multi-tenant dashboard that turns
a single URL into a deep, action-first SEO & AI-search analysis. Built to run on a
**$0 data budget** by leaning on free first-party Google data and self-hosted data
services instead of expensive third-party APIs.

> **Positioning vs. SEMRUSH:** SEMRUSH's moat is web-scale proprietary data we
> can't replicate cheaply. FreeRush wins where it matters for the owner of a site:
> *real* first-party Google data (Search Console / Analytics) that SEMRUSH can only
> estimate, plus grounded AI analysis that answers "what do I actually do next?".

## Architecture

Self-hosted Next.js (App Router) + Postgres, with a swappable **data-provider
layer** so every free source can later be upgraded to a paid one without touching
callers.

| Service | Role | $0 source |
| --- | --- | --- |
| `app` | Next.js dashboard + API | — |
| `db` | Postgres (data + queue) | postgres:16 |
| `worker` | pg-boss background jobs (analysis, growth report) | — |
| `scraper` | Playwright page rendering | self-hosted (replaces Firecrawl) |
| `searxng` | SERP-like results | self-hosted metasearch |

Other free data: Google Autocomplete (keyword discovery), PageSpeed Insights
(Core Web Vitals), Gemini 2.5 Flash (AI engine, free tier). All external calls go
through a Postgres-backed cache to conserve free-tier quotas.

Multi-tenancy: every tenant-owned row carries `workspaceId`; access is scoped
through `requireContext()` / `loadProject()`.

## Quick start (Docker — full stack)

```bash
cp .env.example .env          # set AUTH_SECRET (openssl rand -base64 32); GEMINI_API_KEY optional
docker compose up --build
# app on http://localhost:3000  ·  run migrations once:
docker compose exec app npx prisma migrate deploy
```

## Quick start (local dev)

```bash
npm install
cp .env.example .env          # point DATABASE_URL at a local Postgres
npx prisma migrate dev        # create schema
npm run db:seed               # optional: demo@freerush.local / freerush123
npm run dev                   # app
npm run worker                # background job runner (separate terminal)
```

You also need the `scraper` and `searxng` services for live analysis; the easiest
path is `docker compose up scraper searxng db` and run the app/worker on the host.

## Without an AI key

Leave `GEMINI_API_KEY` blank and the app uses a deterministic mock AI provider, so
the full flow (signup → add site → background analysis → dashboard) still runs end
to end at truly $0.

## Roadmap

- **Phase 1 (this milestone):** dashboard shell + migrated analyzer, background jobs.
- **Phase 2:** Google Search Console / Analytics / Ads OAuth; keyword engine.
- **Phase 3:** scheduled rank tracking.
- **Phase 4:** competitors & content depth, AI-visibility expansion.
- **Phase 5:** SaaS hardening (billing, plan limits, paid provider impls).
