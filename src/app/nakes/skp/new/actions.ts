"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import {
  parseSubmissionForm,
  resolveInstitution,
  saveEvidenceFiles,
  submissionFields,
  type SubmissionFormState,
} from "@/lib/submission-input";

export async function createSubmissionAction(
  _prevState: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const user = await requireNakes();
  const profile = await prisma.nakesProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Lengkapi profil terlebih dahulu." };

  const parsed = parseSubmissionForm(formData);
  if ("error" in parsed) return parsed;
  const { data } = parsed;

  const institution = await resolveInstitution(data, user.id);
  if ("error" in institution) return institution;

  const submission = await prisma.serviceSubmission.create({
    data: {
      ...submissionFields(data, institution.id),
      nakesProfileId: profile.id,
      status: data.intent === "draft" ? "DRAFT" : "SUBMITTED",
      entries: { create: data.entries },
    },
  });
  await saveEvidenceFiles(submission.id, data.evidenceFiles);

  redirect(`/nakes/skp/${submission.id}`);
}
