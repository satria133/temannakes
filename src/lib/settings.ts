import { prisma } from "@/lib/prisma";

// Each setting falls back to its env var until an admin saves a value, so the
// server's .env keeps working as the initial configuration.
export const SETTINGS = {
  adminWhatsapp: { env: "ADMIN_WHATSAPP" },
  creditPriceLabel: { env: "CREDIT_PRICE_LABEL" },
  bankInfo: { env: "BANK_INFO" },
} as const;

export type SettingKey = keyof typeof SETTINGS;

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.keys(SETTINGS) } },
  });
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const result = {} as Record<SettingKey, string>;
  for (const [key, def] of Object.entries(SETTINGS) as [SettingKey, (typeof SETTINGS)[SettingKey]][]) {
    result[key] = stored.has(key) ? stored.get(key)! : (process.env[def.env] ?? "").trim();
  }
  return result;
}

export async function saveSettings(values: Record<SettingKey, string>, adminId: string) {
  await prisma.$transaction(
    (Object.keys(values) as SettingKey[]).map((key) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: values[key], updatedById: adminId },
        update: { value: values[key], updatedById: adminId },
      })
    )
  );
}
