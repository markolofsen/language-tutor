import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
] as const;

const nextConfig: NextConfig = {
  // The Docker image runs .next/standalone; Vercel and local builds keep the default output.
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" as const } : {}),
  // The libSQL driver ships a native module; Next must not bundle it.
  serverExternalPackages: ["@libsql/client", "libsql"],
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
};

export default nextConfig;
