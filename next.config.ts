import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is entirely session/DB-driven (auth, admin review, listings),
   * so there's no static content worth prerendering — disable Cache
   * Components to avoid fighting it on every dynamic page. */
  experimental: {
    // Evidence photos/PDFs and letterheads are uploaded through Server Actions
    // (default limit 1MB). Keep in sync with request_body max_size in Caddy.
    serverActions: { bodySizeLimit: "20mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
