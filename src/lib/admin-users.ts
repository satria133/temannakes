import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AdminOpResult = { ok: true } | { ok: false; error: string };

// Akun admin aktif terakhir tidak boleh dinonaktifkan: panel tidak akan bisa dipulihkan lewat UI.
export async function setAdminActive(targetId: string, active: boolean, actorId: string): Promise<AdminOpResult> {
  if (!active && targetId === actorId) return { ok: false, error: "Kamu tidak bisa menonaktifkan akunmu sendiri." };
  return prisma.$transaction(async (tx): Promise<AdminOpResult> => {
    const target = await tx.user.findUnique({ where: { id: targetId } });
    if (!target || target.role !== "ADMIN") return { ok: false, error: "Admin tidak ditemukan." };
    if (!active) {
      const others = await tx.user.count({ where: { role: "ADMIN", isActive: true, id: { not: targetId } } });
      if (others === 0) return { ok: false, error: "Harus ada minimal satu admin aktif." };
    }
    await tx.user.update({
      where: { id: targetId },
      data: { isActive: active, ...(active ? {} : { sessionVersion: { increment: 1 } }) },
    });
    return { ok: true };
  });
}

export async function changeAdminEmail(targetId: string, newEmail: string): Promise<AdminOpResult> {
  const email = newEmail.trim();
  return prisma.$transaction(async (tx): Promise<AdminOpResult> => {
    const target = await tx.user.findUnique({ where: { id: targetId } });
    if (!target || target.role !== "ADMIN") return { ok: false, error: "Admin tidak ditemukan." };
    const taken = await tx.user.findUnique({ where: { email } });
    if (taken && taken.id !== targetId) return { ok: false, error: "Email sudah dipakai akun lain." };
    await tx.user.update({
      where: { id: targetId },
      data: { email, emailVerifiedAt: new Date(), sessionVersion: { increment: 1 } },
    });
    return { ok: true };
  });
}

export async function createAdmin(email: string, password: string): Promise<AdminOpResult> {
  const clean = email.trim();
  if (await prisma.user.findUnique({ where: { email: clean } })) {
    return { ok: false, error: "Email sudah terdaftar. Jika itu akun nakes, gunakan \"Jadikan admin\"." };
  }
  await prisma.user.create({
    data: {
      email: clean,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  return { ok: true };
}

// Menaikkan akun nakes yang SUDAH ada. Password akun itu tidak berubah; sesinya dicabut
// agar peran baru berlaku. Halaman nakes tidak lagi bisa dibuka oleh peran admin.
export async function promoteToAdmin(email: string): Promise<AdminOpResult> {
  const user = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (!user) return { ok: false, error: "Tidak ada akun dengan email itu." };
  if (user.role === "ADMIN") return { ok: false, error: "Akun itu sudah admin." };
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", isActive: true, emailVerifiedAt: user.emailVerifiedAt ?? new Date(), sessionVersion: { increment: 1 } },
  });
  return { ok: true };
}
