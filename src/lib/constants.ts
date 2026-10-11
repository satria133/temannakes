export const ROLES = ["NAKES", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROFESSIONS = [
  "ATLM",
  "PERAWAT",
  "DOKTER",
  "DOKTER_GIGI",
  "VOKASI_FARMASI",
  "APOTEKER",
  "RADIOLOGI",
  "PSIKOLOG_KLINIS",
  "FISIOTERAPI",
  "GIZI",
] as const;
export type Profession = (typeof PROFESSIONS)[number];

export const PROFESSION_LABELS: Record<Profession, string> = {
  ATLM: "Ahli Teknologi Laboratorium Medik (ATLM)",
  PERAWAT: "Perawat",
  DOKTER: "Dokter",
  DOKTER_GIGI: "Dokter Gigi",
  VOKASI_FARMASI: "Tenaga Vokasi Farmasi",
  APOTEKER: "Apoteker",
  RADIOLOGI: "Radiografer (Radiologi)",
  PSIKOLOG_KLINIS: "Psikolog Klinis",
  FISIOTERAPI: "Fisioterapis",
  GIZI: "Nutrisionis / Dietisien (Gizi)",
};

// Codes used before the profession list was revised; migrated by prisma/seed.ts.
export const LEGACY_PROFESSION_CODES: Record<string, Profession> = {
  TTLM: "ATLM",
  DOKTER_UMUM: "DOKTER",
  TENAGA_VOKASI_FARMASI: "VOKASI_FARMASI",
};

export function professionLabel(code: string): string {
  return PROFESSION_LABELS[code as Profession] ?? code;
}

export const CREDITS_PER_DOCUMENT = 1;

export const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Menunggu Review",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export const SUBSCRIPTION_TYPES = ["WEBINAR", "LOKER"] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

export const PERIOD_MONTHS_OPTIONS = [6, 12] as const;

export const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export const HIGHLIGHT_DAYS_BEFORE = 7;
export const LISTING_WINDOW_DAYS = 30;
