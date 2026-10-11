import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { PROFESSIONS } from "@/lib/constants";

export type SubmissionFormState = { error?: string } | undefined;
export type SubmissionIntent = "draft" | "submit";

const LETTERHEAD_EXTENSIONS = [".png", ".jpg", ".jpeg"];
const EVIDENCE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const identitySchema = z.object({
  profession: z.enum(PROFESSIONS, { message: "Profesi tidak valid" }),
  periodMonths: z.coerce
    .number()
    .refine((v) => v === 6 || v === 12, "Periode harus 6 atau 12 bulan"),
  periodStartMonth: z.coerce.number().int().min(1).max(12),
  periodStartYear: z.coerce.number().int().min(2000).max(2100),
  fullName: z.string().trim().min(2, "Nama wajib diisi"),
  strNumber: z.string().trim().min(1, "No. STR wajib diisi"),
  sipNumber: z.string().trim().min(1, "No. SIP wajib diisi"),
  sipValidUntil: z.coerce.date({ message: "Tanggal SIP berlaku tidak valid" }),
  position: z.string().trim().min(1, "Jabatan wajib diisi"),
  employeeNip: optionalText,
  supervisorName: z.string().trim().min(2, "Nama atasan wajib diisi"),
  supervisorNip: optionalText,
  city: optionalText,
});

export type ParsedSubmission = z.infer<typeof identitySchema> & {
  intent: SubmissionIntent;
  periodStart: Date;
  periodEnd: Date;
  entries: {
    activityTemplateId?: string;
    customActivityName?: string;
    month: number;
    year: number;
    quantity: number;
  }[];
  evidenceFiles: File[];
  institutionId: string | null;
  newInstitution: { name: string; letterhead: File } | null;
};

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function hasExtension(file: File, allowed: string[]) {
  return allowed.includes(path.extname(file.name).toLowerCase());
}

export function parseSubmissionForm(
  formData: FormData
): { data: ParsedSubmission } | { error: string } {
  const parsed = identitySchema.safeParse({
    profession: text(formData, "profession"),
    periodMonths: text(formData, "periodMonths"),
    periodStartMonth: text(formData, "periodStartMonth"),
    periodStartYear: text(formData, "periodStartYear"),
    fullName: text(formData, "fullName"),
    strNumber: text(formData, "strNumber"),
    sipNumber: text(formData, "sipNumber"),
    sipValidUntil: text(formData, "sipValidUntil"),
    position: text(formData, "position"),
    employeeNip: text(formData, "employeeNip"),
    supervisorName: text(formData, "supervisorName"),
    supervisorNip: text(formData, "supervisorNip"),
    city: text(formData, "city"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const identity = parsed.data;
  const intent: SubmissionIntent = text(formData, "intent") === "draft" ? "draft" : "submit";

  const { periodStartYear: y, periodStartMonth: m, periodMonths } = identity;
  const months: { month: number; year: number }[] = [];
  for (let i = 0; i < periodMonths; i++) {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    months.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
  }

  const rowKeys = formData.getAll("rowKey").map(String);
  const templateIds = formData.getAll("rowTemplateId").map(String);
  const customNames = formData.getAll("rowCustomName").map(String);

  const entries: ParsedSubmission["entries"] = [];
  rowKeys.forEach((key, i) => {
    const activityTemplateId = templateIds[i] || undefined;
    const customActivityName = customNames[i]?.trim() || undefined;
    if (!activityTemplateId && !customActivityName) return;
    months.forEach((mo, monthIndex) => {
      const quantity = Number(text(formData, `qty-${key}-${monthIndex}`) || 0);
      if (Number.isFinite(quantity) && quantity > 0) {
        entries.push({
          activityTemplateId,
          customActivityName: activityTemplateId ? undefined : customActivityName,
          month: mo.month,
          year: mo.year,
          quantity: Math.floor(quantity),
        });
      }
    });
  });

  if (intent === "submit" && entries.length === 0) {
    return { error: "Isi minimal satu jumlah kegiatan sebelum mengajukan." };
  }

  const evidenceFiles = formData
    .getAll("evidenceFiles")
    .filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of evidenceFiles) {
    if (!hasExtension(f, EVIDENCE_EXTENSIONS)) {
      return { error: `Format bukti tidak didukung: ${f.name} (gunakan PDF/JPG/PNG/WEBP).` };
    }
    if (f.size > MAX_FILE_BYTES) {
      return { error: `File terlalu besar (maks 10MB): ${f.name}` };
    }
  }

  let institutionId: string | null = text(formData, "institutionId") || null;
  let newInstitution: ParsedSubmission["newInstitution"] = null;
  if (!institutionId || institutionId === "NEW") {
    institutionId = null;
    const name = text(formData, "newInstitutionName").trim();
    const letterhead = formData.get("newInstitutionLetterhead");
    if (!name || !(letterhead instanceof File) || letterhead.size === 0) {
      return { error: "Nama instansi dan file kop surat wajib diisi untuk instansi baru." };
    }
    if (!hasExtension(letterhead, LETTERHEAD_EXTENSIONS)) {
      return { error: "Kop surat harus berupa gambar PNG atau JPG." };
    }
    if (letterhead.size > MAX_FILE_BYTES) {
      return { error: "File kop surat terlalu besar (maks 10MB)." };
    }
    newInstitution = { name, letterhead };
  }

  return {
    data: {
      ...identity,
      intent,
      periodStart: new Date(Date.UTC(y, m - 1, 1)),
      periodEnd: new Date(Date.UTC(y, m - 1 + periodMonths - 1, 1)),
      entries,
      evidenceFiles,
      institutionId,
      newInstitution,
    },
  };
}

export async function resolveInstitution(
  data: ParsedSubmission,
  userId: string
): Promise<{ id: string } | { error: string }> {
  if (data.institutionId) {
    const exists = await prisma.institution.findUnique({ where: { id: data.institutionId } });
    return exists ? { id: exists.id } : { error: "Instansi tidak ditemukan." };
  }
  const { name, letterhead } = data.newInstitution!;
  const duplicate = await prisma.institution.findUnique({ where: { name } });
  if (duplicate) {
    return { error: `Instansi "${name}" sudah ada — pilih dari daftar.` };
  }
  const { url } = await saveUploadedFile(letterhead, "institutions");
  const institution = await prisma.institution.create({
    data: { name, letterheadUrl: url, addedById: userId },
  });
  return { id: institution.id };
}

export function submissionFields(data: ParsedSubmission, institutionId: string) {
  return {
    institutionId,
    profession: data.profession,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    periodMonths: data.periodMonths,
    fullName: data.fullName,
    strNumber: data.strNumber,
    sipNumber: data.sipNumber,
    sipValidUntil: data.sipValidUntil,
    position: data.position,
    employeeNip: data.employeeNip,
    supervisorName: data.supervisorName,
    supervisorNip: data.supervisorNip,
    city: data.city,
  };
}

export async function saveEvidenceFiles(submissionId: string, files: File[]) {
  for (const file of files) {
    const { url, fileName } = await saveUploadedFile(file, "evidence");
    await prisma.evidenceFile.create({ data: { submissionId, fileUrl: url, fileName } });
  }
}

export function canEditSubmission(s: { status: string; unlockedAt: Date | null }) {
  return s.status === "DRAFT" || s.unlockedAt !== null;
}
