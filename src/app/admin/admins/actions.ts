"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { appBaseUrl } from "@/lib/app-url";
import { createResetToken } from "@/lib/password-reset";
import { changeAdminEmail, createAdmin, promoteToAdmin, setAdminActive } from "@/lib/admin-users";

export type AdminFormState = { error?: string; ok?: string; url?: string; email?: string } | undefined;

const emailSchema = z.string().trim().email("Email tidak valid");

export async function addAdminAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const me = await requireAdmin();
  const raw = String(formData.get("email") ?? "");
  const email = emailSchema.safeParse(raw);
  if (!email.success) return { error: email.error.issues[0].message, email: raw };
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: "Password admin minimal 10 karakter.", email: raw };

  const r = await createAdmin(email.data, password);
  if (!r.ok) return { error: r.error, email: raw };
  await logAudit(me, "admin.add", { targetType: "user", detail: email.data });
  revalidatePath("/admin/admins");
  return { ok: `Admin ${email.data} ditambahkan.` };
}

export async function promoteAdminAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const me = await requireAdmin();
  const raw = String(formData.get("email") ?? "");
  const email = emailSchema.safeParse(raw);
  if (!email.success) return { error: email.error.issues[0].message, email: raw };
  if (formData.get("confirm") !== "on") return { error: "Centang konfirmasi dulu.", email: raw };

  const r = await promoteToAdmin(email.data);
  if (!r.ok) return { error: r.error, email: raw };
  await logAudit(me, "admin.promote", { targetType: "user", detail: email.data });
  revalidatePath("/admin/admins");
  return { ok: `${email.data} sekarang admin (harus login ulang).` };
}

export async function toggleAdminActiveAction(targetId: string, active: boolean): Promise<AdminFormState> {
  const me = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { email: true } });
  const r = await setAdminActive(targetId, active, me.id);
  if (!r.ok) return { error: r.error };
  await logAudit(me, active ? "admin.activate" : "admin.deactivate", {
    targetType: "user", targetId, detail: target?.email,
  });
  revalidatePath("/admin/admins");
  return { ok: active ? "Admin diaktifkan." : "Admin dinonaktifkan." };
}

export async function changeAdminEmailAction(targetId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const me = await requireAdmin();
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };
  const before = await prisma.user.findUnique({ where: { id: targetId }, select: { email: true } });
  const r = await changeAdminEmail(targetId, email.data);
  if (!r.ok) return { error: r.error };
  await logAudit(me, "admin.email_change", { targetType: "user", targetId, detail: `${before?.email} → ${email.data}` });
  revalidatePath("/admin/admins");
  return { ok: targetId === me.id ? "Email diganti. Kamu akan diminta login ulang." : "Email diganti." };
}

export async function adminResetLinkAction(targetId: string): Promise<AdminFormState> {
  const me = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.role !== "ADMIN") return { error: "Admin tidak ditemukan." };
  if (!target.isActive) return { error: "Admin nonaktif: aktifkan dulu sebelum membuat tautan reset." };
  const token = await createResetToken(target.id, me.id);
  await logAudit(me, "user.reset_link", { targetType: "user", targetId, detail: target.email });
  return { url: `${await appBaseUrl()}/reset-password?token=${token}` };
}
