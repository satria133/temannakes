"use server";

import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";
import { PROFESSIONS } from "@/lib/constants";
import { redirect } from "next/navigation";

export type SubmissionFormState = { error?: string } | undefined;

export async function createSubmissionAction(
  _prevState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const user = await requireNakes();

  const profile = await prisma.nakesProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    return { error: "Lengkapi profil terlebih dahulu." };
  }

  const profession = formData.get("profession") as string;
  if (!PROFESSIONS.includes(profession as (typeof PROFESSIONS)[number])) {
    return { error: "Profesi tidak valid." };
  }

  const periodMonths = Number(formData.get("periodMonths"));
  if (periodMonths !== 6 && periodMonths !== 12) {
    return { error: "Periode harus 6 atau 12 bulan." };
  }

  const startMonth = Number(formData.get("periodStartMonth"));
  const startYear = Number(formData.get("periodStartYear"));
  if (!startMonth || !startYear) {
    return { error: "Periode mulai wajib diisi." };
  }
  const periodStart = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const periodEnd = new Date(
    Date.UTC(startYear, startMonth - 1 + periodMonths - 1, 1)
  );

  // Institution: existing selection, or a newly uploaded letterhead.
  let institutionId = formData.get("institutionId") as string | null;
  if (!institutionId || institutionId === "NEW") {
    const newName = (formData.get("newInstitutionName") as string | null)?.trim();
    const letterheadFile = formData.get("newInstitutionLetterhead") as File | null;
    if (!newName || !letterheadFile || letterheadFile.size === 0) {
      return { error: "Nama instansi dan kop surat wajib diisi untuk instansi baru." };
    }
    const { url } = await saveUploadedFile(letterheadFile, "institutions");
    const institution = await prisma.institution.create({
      data: { name: newName, letterheadUrl: url, addedById: user.id },
    });
    institutionId = institution.id;
  }

  // Activity rows: qty-<activityTemplateId|custom index>-<monthIndex>
  const entries: {
    activityTemplateId?: string;
    customActivityName?: string;
    month: number;
    year: number;
    quantity: number;
  }[] = [];

  const monthsInPeriod: { month: number; year: number }[] = [];
  for (let i = 0; i < periodMonths; i++) {
    const d = new Date(Date.UTC(startYear, startMonth - 1 + i, 1));
    monthsInPeriod.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
  }

  const templateIds = formData.getAll("rowTemplateId") as string[];
  const customNames = formData.getAll("rowCustomName") as string[];
  const rowKeys = formData.getAll("rowKey") as string[];

  rowKeys.forEach((key, rowIndex) => {
    const activityTemplateId = templateIds[rowIndex] || undefined;
    const customActivityName = customNames[rowIndex]?.trim() || undefined;
    if (!activityTemplateId && !customActivityName) return;

    monthsInPeriod.forEach((m, monthIndex) => {
      const raw = formData.get(`qty-${key}-${monthIndex}`);
      const quantity = raw ? Number(raw) : 0;
      if (quantity > 0) {
        entries.push({
          activityTemplateId,
          customActivityName,
          month: m.month,
          year: m.year,
          quantity,
        });
      }
    });
  });

  const evidenceFiles = formData.getAll("evidenceFiles") as File[];

  const submission = await prisma.serviceSubmission.create({
    data: {
      nakesProfileId: profile.id,
      institutionId,
      profession,
      periodStart,
      periodEnd,
      periodMonths,
      status: "SUBMITTED",
      entries: { create: entries },
    },
  });

  for (const file of evidenceFiles) {
    if (file.size === 0) continue;
    const { url, fileName } = await saveUploadedFile(file, "evidence");
    await prisma.evidenceFile.create({
      data: { submissionId: submission.id, fileUrl: url, fileName },
    });
  }

  redirect(`/nakes/skp/${submission.id}`);
}
