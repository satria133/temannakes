import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { AddAdminForm, AdminRowActions, PromoteForm } from "./admin-forms";

export default async function AdminAdminsPage() {
  const me = await requireAdmin();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, isActive: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Kelola Admin</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Tambah admin, ganti email, nonaktifkan, atau buat tautan reset password. Setiap perubahan tercatat di Jejak Audit.
      </p>

      <ul className="mt-4 divide-y rounded-lg border bg-white text-sm">
        {admins.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">
                {a.email}
                {a.id === me.id && <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">kamu</span>}
              </p>
              <p className="text-xs text-zinc-500">
                {a.isActive ? "Aktif" : "Nonaktif"} · dibuat {a.createdAt.toLocaleDateString("id-ID")}
              </p>
            </div>
            <AdminRowActions id={a.id} active={a.isActive} isSelf={a.id === me.id} />
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-navy-800">Tambah admin baru</h2>
          <div className="mt-3"><AddAdminForm /></div>
        </section>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-navy-800">Jadikan akun nakes sebagai admin</h2>
          <div className="mt-3"><PromoteForm /></div>
        </section>
      </div>
    </div>
  );
}
