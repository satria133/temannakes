import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { CREDITS_PER_DOCUMENT, TOPUP_STATUS_LABELS } from "@/lib/constants";
import { TopupForm } from "./topup-form";
import { getTopupInfo } from "@/lib/topup";

export default async function TopupPage() {
  const user = await requireNakes();
  const [account, transactions, requests] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { email: true, credits: true, nakesProfile: { select: { fullName: true } } },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.topupRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const topup = await getTopupInfo();
  const price = topup.priceLabel;
  const waUrl = topup.whatsappUrl(
    `Halo Admin TemanNakes, saya ${account.nakesProfile?.fullName ?? ""} (${account.email}) ` +
      `ingin topup kredit dokumen SKP.`
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Kredit Dokumen</h1>

      <div className="mt-4 rounded-lg border bg-white p-6 text-center">
        <p className="text-sm text-zinc-500">Saldo kamu</p>
        <p className="mt-1 text-4xl font-bold text-brand-700">{account.credits}</p>
        <p className="text-sm text-zinc-500">kredit</p>
      </div>

      <div className="mt-4 rounded-lg border bg-white p-4 text-sm text-navy-700">
        <h2 className="font-semibold text-navy-800">Cara topup</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            {CREDITS_PER_DOCUMENT} kredit membuka 1 dokumen: unduh PDF tanpa watermark dan edit berkas
            kapan saja. Pratinjau dengan watermark selalu gratis.
          </li>
          {price && <li>Harga: {price}.</li>}
          <li>Transfer sesuai jumlah kredit ke rekening di bawah.</li>
          <li>Unggah bukti transfer pada form. Admin memverifikasi, lalu kredit masuk ke akun {account.email}.</li>
        </ol>
        {topup.bankInfo ? (
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-navy-50 p-3 font-sans text-navy-800">{topup.bankInfo}</pre>
        ) : (
          <p className="mt-3 text-zinc-500">Info rekening belum diatur admin. Hubungi admin untuk detail pembayaran.</p>
        )}
        <TopupForm />
        {waUrl && (
          <p className="mt-4 text-xs text-zinc-500">
            Ada kendala?{" "}
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
              Hubungi admin via WhatsApp
            </a>
          </p>
        )}
      </div>

      {requests.length > 0 && (
        <>
          <h2 className="mt-8 font-semibold text-navy-800">Permintaan topup</h2>
          <ul className="mt-2 divide-y rounded-lg border bg-white text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <p>{r.credits} kredit</p>
                  <p className="text-xs text-zinc-500">
                    {r.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                    {r.status === "REJECTED" && r.reviewNote && ` · alasan: ${r.reviewNote}`}
                  </p>
                </div>
                <span
                  className={
                    r.status === "APPROVED" ? "text-brand-700" : r.status === "REJECTED" ? "text-red-700" : "text-zinc-600"
                  }
                >
                  {TOPUP_STATUS_LABELS[r.status] ?? r.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-8 font-semibold text-navy-800">Riwayat</h2>
      <ul className="mt-2 divide-y rounded-lg border bg-white text-sm">
        {transactions.map((t) => (
          <li key={t.id} className="flex items-center justify-between px-4 py-2">
            <div>
              <p>{t.note}</p>
              <p className="text-xs text-zinc-500">
                {t.createdAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                {t.submissionId && (
                  <>
                    {" · "}
                    <Link href={`/nakes/skp/${t.submissionId}`} className="text-brand-700 hover:underline">
                      lihat dokumen
                    </Link>
                  </>
                )}
              </p>
            </div>
            <span className={t.amount > 0 ? "text-brand-700" : t.amount < 0 ? "text-red-700" : "text-zinc-500"}>
              {t.amount > 0 ? `+${t.amount}` : t.amount}
            </span>
          </li>
        ))}
        {transactions.length === 0 && <li className="px-4 py-3 text-zinc-500">Belum ada transaksi.</li>}
      </ul>
    </div>
  );
}
