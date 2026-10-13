import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam
export const MAX_SELF_SERVICE_RESETS_PER_HOUR = 3;
export const MIN_PASSWORD_LENGTH = 8;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Token baru membatalkan semua token lama yang belum dipakai milik user itu.
export async function createResetToken(userId: string, createdById?: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        createdById: createdById ?? null,
      },
    }),
  ]);
  return token;
}

// Batas permintaan mandiri per user agar form "lupa password" tidak dipakai membanjiri inbox.
export async function recentSelfServiceResets(userId: string): Promise<number> {
  return prisma.passwordResetToken.count({
    where: {
      userId,
      createdById: null,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
  return !!row && row.usedAt === null && row.expiresAt > new Date();
}

export type ResetResult = { ok: true } | { ok: false; code: "invalid_token" | "weak_password" };

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<ResetResult> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { ok: false, code: "weak_password" };
  const passwordHash = await bcrypt.hash(newPassword, 10);

  return prisma.$transaction(async (tx): Promise<ResetResult> => {
    const row = await tx.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
    if (!row) return { ok: false, code: "invalid_token" };
    // Klaim atomik: hanya satu permintaan yang bisa memakai token ini.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return { ok: false, code: "invalid_token" };

    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return { ok: true };
  });
}
