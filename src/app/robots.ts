import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.AUTH_URL ?? "https://temannakes.aisatira.web.id").replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/nakes", "/api", "/files", "/reset-password", "/verify-email"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
