"use server";

import { redirect } from "next/navigation";
import { consumeVerificationToken } from "@/lib/email-verification";

// Verifikasi lewat tombol (POST), bukan saat halaman dibuka: pemindai email/antivirus yang
// membuka tautan otomatis tidak boleh menghabiskan token.
export async function confirmEmailAction(formData: FormData) {
  const ok = await consumeVerificationToken(String(formData.get("token") ?? ""));
  redirect(ok ? "/login?verified=1" : "/verify-email?token=invalid");
}
