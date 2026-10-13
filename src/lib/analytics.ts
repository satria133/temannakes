import { createHash } from "crypto";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|uptime|curl|wget|python-requests|headless|lighthouse|go-http-client/i;
const MOBILE_RE = /android|iphone|ipad|ipod|mobile|opera mini/i;

export function isBot(ua: string) {
  return !ua || BOT_RE.test(ua);
}

export function deviceFromUa(ua: string): "mobile" | "desktop" {
  return MOBILE_RE.test(ua) ? "mobile" : "desktop";
}

// Hari dalam WIB (UTC+7) sebagai YYYY-MM-DD.
export function dayWIB(date = new Date()) {
  return new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

// Hash berganti tiap hari (hari ikut di dalam hash) dan memakai AUTH_SECRET sebagai
// garam, jadi tidak ada identitas yang bisa dilacak lintas hari atau dibalik ke IP.
export function visitorHash(ip: string, ua: string, day: string) {
  const salt = process.env.AUTH_SECRET ?? "dev-salt";
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

// Jalur yang tidak dilacak: area admin, file, API, aset.
export function trackablePath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 200 || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0];
  if (/^\/(admin|api|files|_next)(\/|$)/.test(path)) return null;
  // Segmen ID dinamis (cuid dll.) digabung agar tidak membocorkan ID dokumen.
  return path.replace(/\/[a-z0-9]{20,}(?=\/|$)/gi, "/:id") || "/";
}

export function referrerHost(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return host && host !== ownHost?.replace(/^www\./, "").split(":")[0] ? host.slice(0, 100) : null;
  } catch {
    return null;
  }
}
