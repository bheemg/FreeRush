import { prisma } from "@/server/db/prisma";
import { env } from "@/server/env";

// Google OAuth + Search Console helpers (no SDK — plain fetch). Phase 2's
// first-party data edge: real queries/clicks/impressions/positions, free.

export const GOOGLE_PROVIDER = "google_search_console";
export const REDIRECT_URI = `${env.appUrl}/api/integrations/google/callback`;

// Read-only Search Console + identity. Add analytics.readonly later for GA4.
const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/webmasters.readonly",
];

export function googleConfigured(): boolean {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

export function buildAuthUrl(state: string): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.google.clientId);
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("access_type", "offline"); // get a refresh token
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("state", state);
  return u.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${await res.text()}`);
  return res.json();
}

// Returns a valid access token for the workspace, refreshing if expired.
export async function getValidAccessToken(workspaceId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider: GOOGLE_PROVIDER } },
  });
  if (!integration?.accessToken) return null;

  const stillValid = integration.expiresAt && integration.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return integration.accessToken;

  if (!integration.refreshToken) return integration.accessToken; // best effort
  const refreshed = await refreshAccessToken(integration.refreshToken);
  await prisma.integration.update({
    where: { workspaceId_provider: { workspaceId, provider: GOOGLE_PROVIDER } },
    data: {
      accessToken: refreshed.access_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    },
  });
  return refreshed.access_token;
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

// Lists the Search Console properties this account can access.
export async function listSites(workspaceId: string): Promise<GscSite[]> {
  const token = await getValidAccessToken(workspaceId);
  if (!token) return [];
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.siteEntry ?? []) as GscSite[];
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Top search queries for a property over the last 28 days.
export async function topQueries(workspaceId: string, siteUrl: string): Promise<GscQueryRow[]> {
  const token = await getValidAccessToken(workspaceId);
  if (!token) return [];
  const end = new Date();
  const start = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["query"],
        rowLimit: 50,
      }),
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}
