import { env } from "@/server/env";
import type { AiGenerateOptions, AiProvider, AiResult } from "./types";

// Gemini 2.5 Flash via the free REST endpoint, with Google Search grounding and
// a retry/backoff. Falls back to a deterministic mock when no key is configured
// so the whole app remains runnable at truly $0 (and in CI).

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

class GeminiProvider implements AiProvider {
  constructor(private apiKey: string, private model: string) {}

  async generate(prompt: string, opts: AiGenerateOptions = {}): Promise<AiResult> {
    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    };
    if (opts.system) {
      body.systemInstruction = { parts: [{ text: opts.system }] };
    }
    if (opts.grounded) {
      body.tools = [{ google_search: {} }];
    }

    const url = `${GEMINI_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) {
            await sleep(500 * 2 ** attempt);
            continue;
          }
          throw new Error(`Gemini ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
        const grounded = Boolean(data?.candidates?.[0]?.groundingMetadata);
        return { text, grounded, model: this.model };
      } catch (err) {
        lastErr = err;
        await sleep(500 * 2 ** attempt);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Gemini request failed");
  }
}

class MockAiProvider implements AiProvider {
  async generate(prompt: string, opts: AiGenerateOptions = {}): Promise<AiResult> {
    const text = opts.json
      ? JSON.stringify({ mock: true, note: "Set GEMINI_API_KEY for real analysis", echo: prompt.slice(0, 120) })
      : `[mock] ${prompt.slice(0, 200)}`;
    return { text, grounded: false, model: "mock" };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function makeAiProvider(): AiProvider {
  if (env.gemini.apiKey) return new GeminiProvider(env.gemini.apiKey, env.gemini.model);
  return new MockAiProvider();
}
