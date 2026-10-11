import { prisma } from "@/lib/prisma";
import { CREDITS_PER_DOCUMENT } from "@/lib/constants";

export type UnlockResult = { ok: true } | { ok: false; code: "not_found" | "insufficient_credits" };

export const UNLOCK_ERROR_MESSAGES: Record<string, string> = {
  not_found: "Dokumen tidak ditemukan.",
  insufficient_credits: "Kredit tidak cukup. Silakan topup terlebih dahulu.",
};

export async function unlockWithCredits(userId: string, submissionId: string): Promise<UnlockResult> {
  return prisma.$transaction(async (tx): Promise<UnlockResult> => {
    const submission = await tx.serviceSubmission.findUnique({
      where: { id: submissionId },
      include: { nakesProfile: true },
    });
    if (!submission || submission.nakesProfile.userId !== userId) {
      return { ok: false, code: "not_found" } as const;
    }
    if (submission.unlockedAt) return { ok: true };

    // Conditional decrement: two concurrent clicks can't spend more than the balance.
    const debited = await tx.user.updateMany({
      where: { id: userId, credits: { gte: CREDITS_PER_DOCUMENT } },
      data: { credits: { decrement: CREDITS_PER_DOCUMENT } },
    });
    if (debited.count === 0) {
      return { ok: false, code: "insufficient_credits" } as const;
    }

    const marked = await tx.serviceSubmission.updateMany({
      where: { id: submissionId, unlockedAt: null },
      data: { unlockedAt: new Date() },
    });
    if (marked.count === 0) {
      // Unlocked by a parallel request in the meantime: undo this debit.
      throw new Error("ALREADY_UNLOCKED");
    }

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -CREDITS_PER_DOCUMENT,
        note: "Buka akses dokumen SKP",
        submissionId,
      },
    });
    return { ok: true };
  }).catch((e: unknown): UnlockResult => {
    if (e instanceof Error && e.message === "ALREADY_UNLOCKED") return { ok: true };
    throw e;
  });
}

export async function grantCredits(adminId: string, userId: string, amount: number, note: string | null) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    prisma.creditTransaction.create({
      data: { userId, amount, note: note || "Topup oleh admin", createdById: adminId },
    }),
  ]);
}

export async function unlockByAdmin(adminId: string, submissionId: string) {
  const submission = await prisma.serviceSubmission.findUniqueOrThrow({
    where: { id: submissionId },
    include: { nakesProfile: true },
  });
  if (submission.unlockedAt) return;
  await prisma.$transaction([
    prisma.serviceSubmission.update({
      where: { id: submissionId },
      data: { unlockedAt: new Date() },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: submission.nakesProfile.userId,
        amount: 0,
        note: "Akses dokumen dibuka oleh admin",
        submissionId,
        createdById: adminId,
      },
    }),
  ]);
}
