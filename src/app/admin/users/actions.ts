"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { grantCredits } from "@/lib/credits";
import { createResetToken } from "@/lib/password-reset";
import { appBaseUrl } from "@/lib/app-url";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int("Jumlah harus bilangan bulat")
    .refine((v) => v !== 0, "Jumlah tidak boleh 0")
    .refine((v) => Math.abs(v) <= 1000, "Maksimal 1000 kredit per transaksi"),
  note: z.string().trim().max(200).optional(),
});

export type GrantState = { error?: string; ok?: string } | undefined;

export async function grantCreditsAction(_prev: GrantState, formData: FormData): Promise<GrantState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const { userId, amount, note } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "NAKES") return { error: "Pengguna tidak ditemukan." };
  if (target.credits + amount < 0) return { error: `Saldo tidak boleh minus (saldo: ${target.credits}).` };

  await grantCredits(admin.id, userId, amount, note || null);
  await logAudit(admin, "credits.grant", {
    targetType: "user", targetId: userId,
    detail: `${target.email}: ${amount > 0 ? "+" : ""}${amount}${note ? ` (${note})` : ""}`,
  });
  revalidatePath("/admin/users");
  return { ok: `${amount > 0 ? "+" : ""}${amount} kredit untuk ${target.email}` };
}

export type ResetLinkState = { error?: string; url?: string } | undefined;

// Tautan reset sekali pakai (berlaku 1 jam) untuk dikirim admin ke nakes lewat WhatsApp.
// Membuat tautan baru membatalkan tautan lama milik nakes tersebut.
export async function createResetLinkAction(userId: string): Promise<ResetLinkState> {
  const admin = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== "NAKES" || !target.isActive) return { error: "Pengguna tidak ditemukan." };
  const token = await createResetToken(target.id, admin.id);
  await logAudit(admin, "user.reset_link", { targetType: "user", targetId: target.id, detail: target.email });
  return { url: `${await appBaseUrl()}/reset-password?token=${token}` };
}
