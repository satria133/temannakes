import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/app-url";
import { isMailConfigured, sendMail } from "@/lib/mailer";

const TTL_MS = 24 * 3600_000;
const hash = (t: string) => createHash("sha256").update(t).digest("hex");

// Verifikasi hanya diwajibkan bila email bisa dikirim (SMTP aktif); tanpa itu pendaftaran
// tetap jalan seperti biasa dan seed menandai semua akun terverifikasi saat SMTP pertama aktif.
export const emailVerificationRequired = isMailConfigured;

export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + TTL_MS) },
    }),
  ]);
  return token;
}

export async function recentVerificationEmails(userId: string): Promise<number> {
  return prisma.emailVerificationToken.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
}

export async function sendVerificationEmail(user: { id: string; email: string }) {
  const token = await createVerificationToken(user.id);
  const link = `${await appBaseUrl()}/verify-email?token=${token}`;
  await sendMail(
    user.email,
    "Verifikasi email TemanNakes",
    `Halo,\n\nTerima kasih sudah mendaftar di TemanNakes.\n` +
      `Buka tautan berikut untuk memverifikasi email (berlaku 24 jam):\n${link}\n\n` +
      `Jika kamu tidak mendaftar, abaikan email ini.\n\nTemanNakes`
  );
}

export async function isVerificationTokenValid(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash(token) } });
  return !!row && row.usedAt === null && row.expiresAt > new Date();
}

export async function consumeVerificationToken(token: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.emailVerificationToken.findUnique({ where: { tokenHash: hash(token) } });
    if (!row) return false;
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return false;
    await tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
    return true;
  });
}
