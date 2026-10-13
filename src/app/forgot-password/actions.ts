"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/app-url";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { MAX_SELF_SERVICE_RESETS_PER_HOUR, createResetToken, recentSelfServiceResets } from "@/lib/password-reset";
import { getTopupInfo } from "@/lib/topup";

export type ForgotState = { error?: string; sent?: boolean; mail?: boolean; waUrl?: string | null } | undefined;

export async function forgotPasswordAction(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Email tidak valid." };
  const email = parsed.data;

  const mail = isMailConfigured();
  if (mail) {
    // Respons selalu sama (ada/tidaknya akun tidak bocor); pengiriman gagal hanya dicatat.
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user?.isActive && (await recentSelfServiceResets(user.id)) < MAX_SELF_SERVICE_RESETS_PER_HOUR) {
        const token = await createResetToken(user.id);
        const link = `${await appBaseUrl()}/reset-password?token=${token}`;
        await sendMail(
          user.email,
          "Reset password TemanNakes",
          `Halo,\n\nKami menerima permintaan reset password untuk akun ${user.email}.\n` +
            `Buka tautan berikut (berlaku 1 jam, sekali pakai):\n${link}\n\n` +
            `Jika kamu tidak meminta ini, abaikan email ini; password kamu tidak berubah.\n\nTemanNakes`
        );
      }
    } catch (err) {
      console.error("forgot-password: gagal memproses/mengirim email", err);
    }
    return { sent: true, mail: true };
  }

  const waUrl = (await getTopupInfo()).whatsappUrl(
    `Halo Admin TemanNakes, saya lupa password akun ${email}. Mohon dibuatkan tautan reset password.`
  );
  return { sent: true, mail: false, waUrl };
}
