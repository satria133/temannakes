"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailVerificationRequired, recentVerificationEmails, sendVerificationEmail } from "@/lib/email-verification";

export type ResendState = { error?: string; sent?: boolean } | undefined;

export async function resendVerificationAction(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const parsed = z.string().trim().email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Email tidak valid." };

  // Respons selalu sama agar tidak membocorkan akun mana yang terdaftar.
  if (emailVerificationRequired()) {
    try {
      const user = await prisma.user.findUnique({ where: { email: parsed.data } });
      if (user && user.isActive && !user.emailVerifiedAt && (await recentVerificationEmails(user.id)) < 3) {
        await sendVerificationEmail(user);
      }
    } catch (err) {
      console.error("resend-verification: gagal", err);
    }
  }
  return { sent: true };
}
