"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { saveSettings } from "@/lib/settings";

const schema = z.object({
  adminWhatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-+()]/g, ""))
    .refine((v) => v === "" || /^62\d{8,13}$/.test(v), "Nomor WhatsApp harus format 62…, mis. 6281234567890"),
  creditPriceLabel: z.string().trim().max(100, "Teks harga maksimal 100 karakter"),
});

export type SettingsState = { error?: string; ok?: boolean } | undefined;

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    adminWhatsapp: String(formData.get("adminWhatsapp") ?? ""),
    creditPriceLabel: String(formData.get("creditPriceLabel") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };

  await saveSettings(parsed.data, admin.id);
  revalidatePath("/admin/settings");
  revalidatePath("/nakes/topup");
  return { ok: true };
}
