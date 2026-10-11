"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function approveSubmissionAction(submissionId: string) {
  const admin = await requireAdmin();
  await prisma.serviceSubmission.update({
    where: { id: submissionId },
    data: {
      status: "APPROVED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: null,
    },
  });
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}

export async function rejectSubmissionAction(
  submissionId: string,
  note: string
) {
  const admin = await requireAdmin();
  await prisma.serviceSubmission.update({
    where: { id: submissionId },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      adminNote: note || "Ditolak oleh admin",
    },
  });
  revalidatePath(`/admin/submissions/${submissionId}`);
  revalidatePath("/admin/submissions");
}
