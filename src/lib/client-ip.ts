// IP klien di balik nginx: X-Real-IP diisi nginx ($remote_addr) sehingga tidak bisa
// dipalsukan klien. X-Forwarded-For hanya dipakai bagian terakhirnya (yang ditambah nginx),
// bukan entri pertama yang bisa dikirim sendiri oleh klien.
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const xff = headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return xff?.[xff.length - 1] ?? "unknown";
}
