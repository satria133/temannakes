"use server";

import { redirect } from "next/navigation";
import { resetPasswordWithToken, MIN_PASSWORD_LENGTH } from "@/lib/password-reset";

export type ResetState = { error?: string } | undefined;

export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) return { error: "Konfirmasi password tidak sama." };
  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) {
    return {
      error:
        result.code === "weak_password"
          ? `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`
          : "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
    };
  }
  redirect("/login?reset=1");
}
