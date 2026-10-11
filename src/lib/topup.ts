import { getSettings } from "@/lib/settings";

export async function getTopupInfo() {
  const { adminWhatsapp, creditPriceLabel } = await getSettings();
  const number = adminWhatsapp.replace(/\D/g, "");
  return {
    priceLabel: creditPriceLabel || null,
    whatsappUrl: (message: string) =>
      number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null,
  };
}
