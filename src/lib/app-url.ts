import { headers } from "next/headers";

// Basis URL untuk tautan di email/pesan: AUTH_URL (produksi) atau host permintaan.
export async function appBaseUrl(): Promise<string> {
  const env = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").trim().replace(/\/+$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
