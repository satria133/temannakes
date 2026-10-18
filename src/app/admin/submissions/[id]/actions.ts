"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { unlockByAdmin } from "@/lib/credits";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

function revalidate(submissionId: string) {
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

// Only documents waiting for review can be decided; drafts stay private.
export async function approveSubmissionAction(submissionId: string) {
  const admin = await requireAdmin();
  const res = await prisma.serviceSubmission.updateMany({
    where: { id: submissionId, status: "SUBMITTED" },
    data: {
      status: "APPROVED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: null,
    },
  });
  if (res.count) await logAudit(admin, "submission.approve", { targetType: "submission", targetId: submissionId });
  revalidate(submissionId);
}

export async function rejectSubmissionAction(submissionId: string, note: string) {
  const admin = await requireAdmin();
  const res = await prisma.serviceSubmission.updateMany({
    where: { id: submissionId, status: "SUBMITTED" },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: note.trim() || "Ditolak oleh admin",
    },
  });
  if (res.count) {
    await logAudit(admin, "submission.reject", { targetType: "submission", targetId: submissionId, detail: note.trim() });
  }
  revalidate(submissionId);
}

export async function adminUnlockAction(submissionId: string) {
  const admin = await requireAdmin();
  await unlockByAdmin(admin.id, submissionId);
  await logAudit(admin, "submission.unlock", { targetType: "submission", targetId: submissionId });
  revalidate(submissionId);
}
