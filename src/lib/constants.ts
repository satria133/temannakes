export const ROLES = ["NAKES", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROFESSIONS = [
  "TTLM",
  "PERAWAT",
  "TENAGA_VOKASI_FARMASI",
  "APOTEKER",
  "DOKTER_UMUM",
  "BIDAN",
  "LAINNYA",
] as const;
export type Profession = (typeof PROFESSIONS)[number];

export const PROFESSION_LABELS: Record<Profession, string> = {
  TTLM: "Tenaga Teknologi Laboratorium Medik",
  PERAWAT: "Perawat",
  TENAGA_VOKASI_FARMASI: "Tenaga Vokasi Farmasi",
  APOTEKER: "Apoteker",
  DOKTER_UMUM: "Dokter Umum",
  BIDAN: "Bidan",
  LAINNYA: "Lainnya",
};

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
