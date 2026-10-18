import { prisma } from "@/lib/prisma";

export const AUDIT_LABELS: Record<string, string> = {
  "topup.approve": "Setujui topup",
  "topup.reject": "Tolak topup",
  "credits.grant": "Ubah kredit manual",
  "submission.approve": "Setujui dokumen SKP",
  "submission.reject": "Tolak dokumen SKP",
  "submission.unlock": "Buka akses dokumen (gratis)",
  "user.reset_link": "Buat tautan reset password",
  "admin.add": "Tambah admin",
  "admin.promote": "Jadikan nakes sebagai admin",
  "admin.deactivate": "Nonaktifkan admin",
  "admin.activate": "Aktifkan admin",
  "admin.email_change": "Ganti email admin",
  "settings.update": "Ubah pengaturan",
};

type Actor = { id: string; email?: string | null };

// Kegagalan mencatat audit tidak boleh menggagalkan tindakan yang sudah berhasil.
export async function logAudit(
  actor: Actor,
  action: string,
  opts: { targetType?: string; targetId?: string; detail?: string } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email ?? actor.id,
        action,
        targetType: opts.targetType ?? null,
        targetId: opts.targetId ?? null,
        detail: opts.detail?.slice(0, 300) ?? null,
      },
    });
  } catch (err) {
    console.error("audit: gagal mencatat", action, err);
  }
}
