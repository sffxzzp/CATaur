import type { NextConfig } from "next";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // Avoid Next.js picking the monorepo root when multiple lockfiles exist.
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;
