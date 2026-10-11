// Impor loker tenaga kesehatan dari lokermedis.id.
// Sumber: sitemap-lowongan.xml + JSON-LD JobPosting di halaman publik (bukan /api/,
// yang dilarang robots.txt). applyLink = URL postingan asli sekaligus kunci dedup.
// Dikerjakan per batch (offset) supaya satu request tetap singkat di balik nginx.
import { prisma } from "@/lib/prisma";

const BASE = "https://lokermedis.id";
const UA = "TemanNakes-importer";

// Sitemap/JSON-LD tidak punya field kategori, jadi penyaringan berbasis judul:
// harus memuat profesi klinis (HEALTH) dan tidak memuat penanda posisi non-klinis
// (NON_CLINICAL), mis. "Sales Consultant Dental Clinic" ditolak walau ada kata dental.
const HEALTH = [
  "dokter", "doctor", "physician", "general practitioner", "dentist", "spesialis", "specialist",
  "perawat", "nurse", "ners", "bidan", "midwife", "midwives", "apoteker", "pharmacist",
  "asisten apoteker", "pharmacist assistant", "pharmacy assistant", "tenaga teknis kefarmasian",
  "ttk", "atlm", "analis", "analyst", "radiografer", "radiographer", "radiolog", "fisioterapis",
  "fisioterapi", "physiotherapist", "physiotherapy", "terapis okupasi", "occupational therapist",
  "terapi wicara", "speech therapist", "ahli gizi", "nutrisionis", "dietisien", "dietitian",
  "nutritionist", "psikolog", "psychologist", "sanitarian", "penata anestesi", "anestesi",
  "perekam medis", "paramedis", "paramedic", "flebotomis", "phlebotomist", "tenaga kesehatan",
  "nakes", "aba therapist", "terapis perilaku",
];
const NON_CLINICAL = [
  "sales", "marketing", "akuntansi", "accounting", "tax", "finance", "keuangan", "ledger",
  "content creator", "driver", "office boy", "security", "satpam", "maintenance", "mep",
  "admin", "administrator", "administration", "front office", "front liner", "receptionist",
  "kasir", "cashier", "purchasing", "procurement", "hrd", "legal", "programmer", "designer",
  "insurance", "guarantee", "store leader", "reflexology", "massage", "body treatment",
  "distribution", "warehouse", "gudang", "cleaning", "housekeeping", "chef", "unit head",
];

const norm = (t: string) => ` ${t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
const hasWord = (t: string, w: string) => t.includes(` ${w} `);

export function isHealthJob(title: string) {
  const t = norm(title);
  return HEALTH.some((w) => hasWord(t, w)) && !NON_CLINICAL.some((w) => hasWord(t, w));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, retries = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } catch (e) {
    if (retries > 0) {
      await sleep(800);
      return get(url, retries - 1);
    }
    throw e;
  }
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

export type ImportResult = {
  total: number;
  nextOffset: number;
  done: boolean;
  added: number;
  skipped: number;
  expired: number;
  nonHealth: number;
  failed: number;
};

export async function importLokermedisBatch(opts: {
  createdById: string;
  offset?: number;
  batchSize?: number;
}): Promise<ImportResult> {
  const offset = opts.offset ?? 0;
  const batchSize = opts.batchSize ?? 10;

  const sitemap = await get(`${BASE}/sitemap-lowongan.xml`);
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith(`${BASE}/lowongan/`));
  const slice = urls.slice(offset, offset + batchSize);

  const existing = new Set(
    (
      await prisma.jobPosting.findMany({
        where: { applyLink: { in: slice } },
        select: { applyLink: true },
      })
    ).map((j) => j.applyLink)
  );

  const r: ImportResult = {
    total: urls.length,
    nextOffset: offset + slice.length,
    done: offset + slice.length >= urls.length,
    added: 0,
    skipped: 0,
    expired: 0,
    nonHealth: 0,
    failed: 0,
  };

  for (const url of slice) {
    if (existing.has(url)) { r.skipped++; continue; }
    try {
      const j = parseJob(await get(url));
      await sleep(300);
      if (!j) { r.failed++; continue; }
      if (!isHealthJob(String(j.title))) { r.nonHealth++; continue; }
      const expiresAt = new Date(j.validThrough);
      if (isNaN(+expiresAt) || expiresAt < new Date()) { r.expired++; continue; }
      const addr = j.jobLocation?.address ?? {};
      const location =
        [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ") || "Indonesia";
      await prisma.jobPosting.create({
        data: {
          title: String(j.title),
          institution: String(j.hiringOrganization?.name ?? "—"),
          description: String(j.description ?? j.title),
          location,
          applyLink: url,
          expiresAt,
          createdById: opts.createdById,
        },
      });
      r.added++;
    } catch {
      r.failed++;
    }
  }
  return r;
}
