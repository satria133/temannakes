"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { approveTopup, rejectTopup } from "@/lib/topup-requests";

export async function approveTopupAction(requestId: string) {
  const admin = await requireAdmin();
  if (await approveTopup(admin.id, requestId)) {
    const req = await prisma.topupRequest.findUnique({ where: { id: requestId }, include: { user: { select: { email: true } } } });
    await logAudit(admin, "topup.approve", {
      targetType: "topup", targetId: requestId, detail: `${req?.user.email}: +${req?.credits} kredit`,
    });
  }
  revalidatePath("/admin/topups");
  revalidatePath("/admin/users");
  revalidatePath("/nakes/topup");
}

export async function rejectTopupAction(requestId: string, formData: FormData) {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 200) || null;
  if (await rejectTopup(admin.id, requestId, reason)) {
    const req = await prisma.topupRequest.findUnique({ where: { id: requestId }, include: { user: { select: { email: true } } } });
    await logAudit(admin, "topup.reject", {
      targetType: "topup", targetId: requestId, detail: `${req?.user.email}${reason ? `: ${reason}` : ""}`,
    });
  }
  revalidatePath("/admin/topups");
  revalidatePath("/nakes/topup");
}
