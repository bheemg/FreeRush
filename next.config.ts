import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted Docker target: emits a minimal standalone server bundle.
  output: "standalone",
  serverExternalPackages: ["pg-boss", "@prisma/client", "bcryptjs"],
};

export default nextConfig;
