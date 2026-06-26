import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { env } from "@/server/env";
import { requireContext } from "@/server/auth/context";
import { exchangeCode, GOOGLE_PROVIDER } from "@/server/integrations/google";

// Google redirects here after consent. Verify CSRF state, exchange the code for
// tokens, and persist them against the workspace.
export async function GET(req: NextRequest) {
  const ctx = await requireContext();
  const settings = new URL("/dashboard/settings", env.appUrl);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("g_oauth_state")?.value;
  jar.delete("g_oauth_state");

  if (!code || !state || state !== expectedState) {
    settings.searchParams.set("error", "oauth_state");
    return NextResponse.redirect(settings);
  }

  try {
    const tokens = await exchangeCode(code);
    await prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId: ctx.workspaceId, provider: GOOGLE_PROVIDER } },
      create: {
        workspaceId: ctx.workspaceId,
        provider: GOOGLE_PROVIDER,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        accessToken: tokens.access_token,
        // Google only returns refresh_token on first consent; keep the old one otherwise.
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    settings.searchParams.set("connected", "google");
  } catch {
    settings.searchParams.set("error", "oauth_exchange");
  }
  return NextResponse.redirect(settings);
}
