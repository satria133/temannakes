import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { professionLabel } from "@/lib/constants";
import { GrantForm } from "./grant-form";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const query = await searchParams;
  const q = typeof query?.q === "string" ? query.q.trim() : "";

  const users = await prisma.user.findMany({
    where: {
      role: "NAKES",
      ...(q && {
        OR: [
          { email: { contains: q } },
          { nakesProfile: { fullName: { contains: q } } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { nakesProfile: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Pengguna & Kredit</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Tambahkan kredit setelah pembayaran topup diterima. Angka negatif untuk koreksi.
      </p>

      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder="Cari email atau nama..." className="input max-w-sm" />
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-navy-800">
            <tr>
              <th className="px-3 py-2">Nakes</th>
              <th className="px-3 py-2">Profesi</th>
              <th className="px-3 py-2 text-right">Kredit</th>
              <th className="px-3 py-2">Tambah kredit</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">
                  <p className="font-medium">{u.nakesProfile?.fullName ?? "(profil belum diisi)"}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </td>
                <td className="px-3 py-2">
                  {u.nakesProfile ? professionLabel(u.nakesProfile.profession) : "—"}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-brand-700">{u.credits}</td>
                <td className="px-3 py-2">
                  <GrantForm userId={u.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-zinc-500">
                  Tidak ada pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
