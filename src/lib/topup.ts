export function adminWhatsappUrl(message: string): string | null {
  const number = (process.env.ADMIN_WHATSAPP ?? "").replace(/\D/g, "");
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function creditPriceLabel(): string | null {
  return process.env.CREDIT_PRICE_LABEL?.trim() || null;
}
