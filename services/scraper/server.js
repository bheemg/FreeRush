// Minimal self-hosted scraping service — FreeRush's $0 replacement for Firecrawl.
// POST /scrape { url } -> { url, status, html, markdown, title, meta }
// Renders the page with headless Chromium so JS-heavy sites work, then returns
// cleaned HTML + a markdown-ish text extraction for downstream AI analysis.
const http = require("http");
const { chromium } = require("playwright");

const PORT = process.env.PORT || 3001;
let browser;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  }
  return browser;
}

function htmlToMarkdown(html) {
  // Deliberately simple: strip scripts/styles, collapse tags to text + headings.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(h[1-6]|p|li|div|section|article|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<h1[^>]*>/gi, "\n# ")
    .replace(/<h2[^>]*>/gi, "\n## ")
    .replace(/<h3[^>]*>/gi, "\n### ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function scrape(url) {
  const b = await getBrowser();
  const ctx = await b.newContext({ userAgent: "Mozilla/5.0 (compatible; FreeRushBot/1.0)" });
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(800);
    const html = await page.content();
    const title = await page.title();
    const meta = await page.evaluate(() => {
      const get = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || null;
      return {
        description: get('meta[name="description"]', "content"),
        canonical: get('link[rel="canonical"]', "href"),
        viewport: get('meta[name="viewport"]', "content"),
        ogTitle: get('meta[property="og:title"]', "content"),
        robots: get('meta[name="robots"]', "content"),
        h1: document.querySelector("h1")?.textContent?.trim() || null,
      };
    });
    return { url, status: resp?.status() ?? 0, html, markdown: htmlToMarkdown(html), title, meta };
  } finally {
    await ctx.close();
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200).end("ok");
    return;
  }
  if (req.method === "POST" && req.url === "/scrape") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const { url } = JSON.parse(body || "{}");
        if (!url) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "url required" }));
          return;
        }
        const result = await scrape(url);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: String(err?.message || err) }));
      }
    });
    return;
  }
  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`scraper listening on ${PORT}`));
