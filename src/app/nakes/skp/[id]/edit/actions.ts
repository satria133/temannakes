"use server";

import { unlink } from "fs/promises";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { resolveStoredFile } from "@/lib/storage";
import {
  canEditSubmission,
  parseSubmissionForm,
  resolveInstitution,
  saveEvidenceFiles,
  submissionFields,
  type SubmissionFormState,
} from "@/lib/submission-input";

export async function updateSubmissionAction(
  submissionId: string,
  _prevState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const user = await requireNakes();

  const existing = await prisma.serviceSubmission.findUnique({
    where: { id: submissionId },
    include: { nakesProfile: true, evidenceFiles: true },
  });
  if (!existing || existing.nakesProfile.userId !== user.id) {
    return { error: "Dokumen tidak ditemukan." };
  }
  if (!canEditSubmission(existing)) {
    return { error: "Dokumen yang sudah diajukan hanya bisa diedit setelah akses dibuka (topup kredit)." };
  }

  const parsed = parseSubmissionForm(formData);
  if ("error" in parsed) return parsed;
  const { data } = parsed;

  const institution = await resolveInstitution(data, user.id);
  if ("error" in institution) return institution;

  // A submitted/approved document never silently returns to draft: any edit
  // after submission goes back into the admin review queue.
  const status = existing.status === "DRAFT" && data.intent === "draft" ? "DRAFT" : "SUBMITTED";

  const removeIds = new Set(formData.getAll("removeEvidenceIds").map(String));
  const toRemove = existing.evidenceFiles.filter((f) => removeIds.has(f.id));

  await prisma.$transaction([
    prisma.serviceEntry.deleteMany({ where: { submissionId } }),
    prisma.evidenceFile.deleteMany({ where: { id: { in: toRemove.map((f) => f.id) } } }),
    prisma.serviceSubmission.update({
      where: { id: submissionId },
      data: {
        ...submissionFields(data, institution.id),
        status,
        adminNote: status === "SUBMITTED" ? null : existing.adminNote,
        reviewedById: null,
        reviewedAt: null,
        entries: { create: data.entries },
      },
    }),
  ]);

  for (const f of toRemove) {
    const filePath = resolveStoredFile(f.fileUrl);
    if (filePath) await unlink(filePath).catch(() => {});
  }
  await saveEvidenceFiles(submissionId, data.evidenceFiles);

  redirect(`/nakes/skp/${submissionId}`);
}
