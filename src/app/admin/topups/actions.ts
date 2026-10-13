"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { approveTopup, rejectTopup } from "@/lib/topup-requests";

export async function approveTopupAction(requestId: string) {
  const admin = await requireAdmin();
  await approveTopup(admin.id, requestId);
  revalidatePath("/admin/topups");
  revalidatePath("/admin/users");
  revalidatePath("/nakes/topup");
}

export async function rejectTopupAction(requestId: string, formData: FormData) {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200) || null;
  await rejectTopup(admin.id, requestId, reason);
  revalidatePath("/admin/topups");
  revalidatePath("/nakes/topup");
}
