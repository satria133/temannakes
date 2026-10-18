import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { AUDIT_LABELS } from "@/lib/audit";

const GROUPS = [
  { key: "", label: "Semua" },
  { key: "topup", label: "Topup" },
  { key: "credits", label: "Kredit" },
  { key: "submission", label: "Dokumen" },
  { key: "admin", label: "Admin" },
  { key: "user", label: "Pengguna" },
  { key: "settings", label: "Pengaturan" },
];

export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin();
  const query = await searchParams;
  const raw = typeof query?.grup === "string" ? query.grup : "";
  const group = GROUPS.find((g) => g.key === raw)?.key ?? "";

  const logs = await prisma.auditLog.findMany({
    where: group ? { action: { startsWith: `${group}.` } } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Jejak Audit</h1>
      <p className="mt-1 text-sm text-zinc-600">200 tindakan admin terbaru. Waktu WIB.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {GROUPS.map((g) => (
          <Link
            key={g.key}
            href={g.key ? `/admin/audit?grup=${g.key}` : "/admin/audit"}
            className={`rounded-md border px-3 py-1 ${g.key === group ? "bg-brand-600 text-white" : "bg-white hover:bg-zinc-50"}`}
          >
            {g.label}
          </Link>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-navy-800">
            <tr>
              <th className="px-3 py-2">Waktu</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Tindakan</th>
              <th className="px-3 py-2">Rincian</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
                  {l.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                </td>
                <td className="px-3 py-2">{l.actorEmail}</td>
                <td className="px-3 py-2">{AUDIT_LABELS[l.action] ?? l.action}</td>
                <td className="px-3 py-2 text-zinc-600">{l.detail ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-zinc-500">Belum ada catatan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
