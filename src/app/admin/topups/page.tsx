import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { TOPUP_STATUS_LABELS } from "@/lib/constants";
import { approveTopupAction, rejectTopupAction } from "./actions";

const FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
const FILTER_LABELS: Record<string, string> = { ...TOPUP_STATUS_LABELS, PENDING: "Menunggu", ALL: "Semua" };

export default async function AdminTopupsPage({ searchParams }: PageProps<"/admin/topups">) {
  await requireAdmin();
  const query = await searchParams;
  const raw = typeof query?.status === "string" ? query.status : "PENDING";
  const status = (FILTERS as readonly string[]).includes(raw) ? raw : "PENDING";

  const requests = await prisma.topupRequest.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 100,
    include: { user: { select: { email: true, nakesProfile: { select: { fullName: true } } } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Verifikasi Topup</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Cocokkan bukti transfer dengan mutasi rekening, lalu setujui. Kredit langsung ditambahkan ke akun nakes.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/topups?status=${f}`}
            className={`rounded-md border px-3 py-1 ${f === status ? "bg-brand-600 text-white" : "bg-white hover:bg-zinc-50"}`}
          >
            {FILTER_LABELS[f]}
          </Link>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.user.nakesProfile?.fullName ?? r.user.email}</p>
                <p className="text-xs text-zinc-500">{r.user.email}</p>
                <p className="mt-1">
                  <span className="font-semibold text-brand-700">{r.credits} kredit</span>
                  {" · "}
                  <span className="text-xs text-zinc-500">
                    {r.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </span>
                </p>
                {r.note && <p className="mt-1 text-zinc-600">Catatan: {r.note}</p>}
                {r.reviewNote && <p className="mt-1 text-zinc-600">Alasan penolakan: {r.reviewNote}</p>}
              </div>
              <span className="text-xs text-zinc-600">{TOPUP_STATUS_LABELS[r.status] ?? r.status}</span>
            </div>
            <a href={r.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-brand-700 hover:underline">
              Lihat bukti transfer ({r.proofName})
            </a>
            {r.status === "PENDING" && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <form action={approveTopupAction.bind(null, r.id)}>
                  <button className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                    Setujui &amp; tambah {r.credits} kredit
                  </button>
                </form>
                <form action={rejectTopupAction.bind(null, r.id)} className="flex items-center gap-2">
                  <input name="reason" placeholder="Alasan penolakan" maxLength={200} className="w-52 rounded-md border border-zinc-300 px-2 py-1" />
                  <button className="rounded-md border px-3 py-1.5 text-red-700 hover:bg-red-50">Tolak</button>
                </form>
              </div>
            )}
          </li>
        ))}
        {requests.length === 0 && <p className="text-sm text-zinc-500">Tidak ada data.</p>}
      </ul>
    </div>
  );
}
