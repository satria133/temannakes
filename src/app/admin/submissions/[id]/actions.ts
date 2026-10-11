"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { unlockByAdmin } from "@/lib/credits";
import { revalidatePath } from "next/cache";

function revalidate(submissionId: string) {
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

// Only documents waiting for review can be decided; drafts stay private.
export async function approveSubmissionAction(submissionId: string) {
  const admin = await requireAdmin();
  await prisma.serviceSubmission.updateMany({
    where: { id: submissionId, status: "SUBMITTED" },
    data: {
      status: "APPROVED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: null,
    },
  });
  revalidate(submissionId);
}

export async function rejectSubmissionAction(submissionId: string, note: string) {
  const admin = await requireAdmin();
  await prisma.serviceSubmission.updateMany({
    where: { id: submissionId, status: "SUBMITTED" },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: note.trim() || "Ditolak oleh admin",
    },
  });
  revalidate(submissionId);
}

export async function adminUnlockAction(submissionId: string) {
  const admin = await requireAdmin();
  await unlockByAdmin(admin.id, submissionId);
  revalidate(submissionId);
}
