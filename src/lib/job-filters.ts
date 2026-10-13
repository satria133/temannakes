// Kategori loker untuk filter. Pencocokan lewat kata kunci pada judul (loker tidak
// punya field profesi); sama dengan pendekatan impor LokerMedis.
export const JOB_CATEGORIES: { key: string; label: string; keywords: string[] }[] = [
  { key: "dokter", label: "Dokter", keywords: ["dokter", "doctor", "physician", "general practitioner", "spesialis"] },
  { key: "dokter-gigi", label: "Dokter Gigi", keywords: ["dokter gigi", "dentist", "drg"] },
  { key: "perawat", label: "Perawat", keywords: ["perawat", "nurse", "ners"] },
  { key: "bidan", label: "Bidan", keywords: ["bidan", "midwife"] },
  { key: "apoteker", label: "Apoteker & Farmasi", keywords: ["apoteker", "pharmac", "kefarmasian", "farmasi"] },
  { key: "lab", label: "Analis Laboratorium", keywords: ["analis", "analyst", "atlm", "laborat", "flebotomis", "phlebotomist"] },
  { key: "radiografer", label: "Radiografer", keywords: ["radiograf", "radiolog"] },
  { key: "terapi", label: "Fisioterapi & Terapi", keywords: ["fisioterap", "physiotherap", "terapis", "therapist", "terapi wicara"] },
  { key: "gizi", label: "Gizi", keywords: ["gizi", "nutrisi", "nutrition", "dietisien", "dietitian"] },
  { key: "psikolog", label: "Psikolog", keywords: ["psikolog", "psycholog"] },
  { key: "lainnya-klinis", label: "Lainnya (sanitarian, rekam medis, anestesi)", keywords: ["sanitarian", "perekam medis", "anestesi", "paramedis", "paramedic"] },
];

export function categoryByKey(key: string | undefined) {
  return JOB_CATEGORIES.find((c) => c.key === key);
}

// "Kota Surabaya, Jawa Timur" -> "Jawa Timur"
export function provinceOf(location: string) {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? "";
}
