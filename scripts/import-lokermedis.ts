// Impor loker aktif dari lokermedis.id (JSON-LD JobPosting di halaman publik
// yang tercantum di sitemap). Tidak menyentuh /api/ (dilarang robots.txt).
// applyLink = URL postingan asli, sekaligus kunci dedup (jalankan ulang aman).
// Pakai: npx tsx scripts/import-lokermedis.ts [--limit=N] [--dry]
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const BASE = "https://lokermedis.id";
const prisma = new PrismaClient();
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// curl (bukan fetch) supaya HTTPS_PROXY/CA environment otomatis dipakai.
async function get(url: string) {
  const { stdout } = await run(
    "curl",
    ["-sSfL", "-m", "30", "-A", "TemanNakes-importer", url],
    { maxBuffer: 20 * 1024 * 1024 }
  );
  return stdout;
}

function parseJob(html: string) {
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      if (j["@type"] === "JobPosting") return j;
    } catch {}
  }
  return null;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("Admin belum ada — jalankan db:seed dulu");

  const sitemap = await get(`${BASE}/sitemap-lowongan.xml`);
  let urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (limit) urls = urls.slice(0, limit);

  let added = 0, skipped = 0, expired = 0, failed = 0;
  for (const url of urls) {
    if (await prisma.jobPosting.findFirst({ where: { applyLink: url } })) { skipped++; continue; }
    try {
      const j = parseJob(await get(url));
      await sleep(400);
      if (!j) { failed++; continue; }
      const expiresAt = new Date(j.validThrough);
      if (isNaN(+expiresAt) || expiresAt < new Date()) { expired++; continue; }
      const addr = j.jobLocation?.address ?? {};
      const location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ") || "Indonesia";
      const data = {
        title: String(j.title),
        institution: String(j.hiringOrganization?.name ?? "—"),
        description: String(j.description ?? j.title),
        location,
        applyLink: url,
        expiresAt,
        createdById: admin.id,
      };
      if (!dry) await prisma.jobPosting.create({ data });
      else console.log(data.title, "|", data.institution, "|", location, "|", expiresAt.toISOString().slice(0, 10));
      added++;
    } catch (e) {
      failed++;
      console.error(String(e));
    }
  }
  console.log({ total: urls.length, added, skipped, expired, failed, dry });
}

main().finally(() => prisma.$disconnect());
