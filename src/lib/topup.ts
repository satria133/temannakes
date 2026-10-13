import { getSettings } from "@/lib/settings";

export async function getTopupInfo() {
  const { adminWhatsapp, creditPriceLabel, bankInfo } = await getSettings();
  const number = adminWhatsapp.replace(/\D/g, "");
  return {
    priceLabel: creditPriceLabel || null,
    bankInfo: bankInfo || null,
    whatsappUrl: (message: string) =>
      number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null,
  };
}
