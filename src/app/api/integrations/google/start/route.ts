import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireContext } from "@/server/auth/context";
import { env } from "@/server/env";
import { buildAuthUrl, googleConfigured } from "@/server/integrations/google";

// Kicks off the Google OAuth consent flow. Stores a CSRF state in a cookie.
export async function GET() {
  await requireContext(); // must be signed in
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=google_not_configured", env.appUrl));
  }

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("g_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });

  return NextResponse.redirect(buildAuthUrl(state));
}
