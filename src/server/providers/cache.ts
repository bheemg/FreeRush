import { createHash } from "crypto";
import { prisma } from "@/server/db/prisma";

// Wraps any external provider call in a Postgres-backed cache so we never burn
// free-tier quota on a request we've already made. Keyed by provider + a stable
// hash of the params. This is the single most important $0-budget safeguard.
export async function cached<T>(
  provider: string,
  params: unknown,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = createHash("sha256").update(JSON.stringify(params)).digest("hex");

  const hit = await prisma.providerCache.findUnique({
    where: { provider_key: { provider, key } },
  });
  if (hit && hit.expiresAt > new Date()) {
    return hit.value as T;
  }

  const value = await fetcher();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  await prisma.providerCache.upsert({
    where: { provider_key: { provider, key } },
    create: { provider, key, value: value as object, expiresAt },
    update: { value: value as object, expiresAt },
  });
  return value;
}
