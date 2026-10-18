import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.AUTH_URL ?? "https://temannakes.aisatira.web.id").replace(/\/+$/, "");
  return ["", "/jobs", "/webinars", "/register", "/login"].map((p) => ({ url: `${base}${p}` }));
}
