import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import {
  CREDITS_PER_DOCUMENT,
  MONTH_LABELS,
  SUBMISSION_STATUS_LABELS,
  professionLabel,
  type SubmissionStatus,
} from "@/lib/constants";
import { canEditSubmission } from "@/lib/submission-input";
import { adminWhatsappUrl } from "@/lib/topup";
import { UNLOCK_ERROR_MESSAGES } from "@/lib/credits";
import { unlockSubmissionAction } from "./actions";

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: PageProps<"/nakes/skp/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireNakes();

  const [submission, account] = await Promise.all([
    prisma.serviceSubmission.findUnique({
      where: { id },
      include: { nakesProfile: true, institution: true, evidenceFiles: true },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credits: true, email: true } }),
  ]);
  if (!submission || submission.nakesProfile.userId !== user.id) notFound();

  const status = submission.status as SubmissionStatus;
  const unlocked = submission.unlockedAt !== null;
  const canEdit = canEditSubmission(submission);
  const enoughCredits = account.credits >= CREDITS_PER_DOCUMENT;
  const error = typeof query?.error === "string" ? UNLOCK_ERROR_MESSAGES[query.error] ?? null : null;
  const waUrl = adminWhatsappUrl(
    `Halo Admin TemanNakes, saya ${submission.fullName ?? submission.nakesProfile.fullName} ` +
      `(${account.email}) ingin membuka akses dokumen SKP ID ${submission.id}.`
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/nakes/skp" className="text-sm text-brand-700 hover:underline">
        ← Riwayat dokumen
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-navy-800">
        Dokumen SKP — {professionLabel(submission.profession)}
      </h1>

      {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {query?.unlocked === "1" && (
        <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Akses dokumen terbuka. Kamu bisa mengedit dokumen ini dan mengunduh versi tanpa watermark
          setelah disetujui admin.
        </p>
      )}

      <div className="mt-4 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {unlocked ? (
            <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-800">
              Akses terbuka
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              Akses terkunci
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-zinc-500">Nama</dt>
          <dd>{submission.fullName ?? submission.nakesProfile.fullName}</dd>
          <dt className="text-zinc-500">Instansi</dt>
          <dd>{submission.institution.name}</dd>
          <dt className="text-zinc-500">Atasan</dt>
          <dd>
            {submission.supervisorName ?? "—"}
            {submission.supervisorNip && ` (NIP. ${submission.supervisorNip})`}
          </dd>
          <dt className="text-zinc-500">Periode</dt>
          <dd>
            {submission.periodMonths} bulan, mulai {MONTH_LABELS[submission.periodStart.getUTCMonth()]}{" "}
            {submission.periodStart.getUTCFullYear()}
          </dd>
          <dt className="text-zinc-500">Bukti pendukung</dt>
          <dd>{submission.evidenceFiles.length} file</dd>
          {submission.adminNote && (
            <>
              <dt className="text-zinc-500">Catatan admin</dt>
              <dd className="text-red-700">{submission.adminNote}</dd>
            </>
          )}
        </dl>

        <p className="mt-4 text-sm text-zinc-600">{statusHint(status, unlocked)}</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/nakes/skp/${submission.id}/preview`}
            target="_blank"
            className="rounded-md border border-brand-600 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50"
          >
            Pratinjau (watermark)
          </a>
          {canEdit && (
            <Link
              href={`/nakes/skp/${submission.id}/edit`}
              className="rounded-md border px-4 py-2 text-sm text-navy-700 hover:bg-zinc-50"
            >
              {status === "DRAFT" ? "Lanjutkan / Ajukan" : "Edit berkas"}
            </Link>
          )}
          {unlocked && status === "APPROVED" && (
            <a
              href={`/nakes/skp/${submission.id}/pdf`}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              Unduh PDF
            </a>
          )}
        </div>
      </div>

      {!unlocked && (
        <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <h2 className="font-semibold text-navy-800">Buka akses dokumen</h2>
          <p className="mt-1 text-sm text-navy-700">
            {CREDITS_PER_DOCUMENT} kredit untuk mengunduh PDF tanpa watermark (setelah disetujui) dan
            mengedit berkas kapan saja. Saldo kamu: <strong>{account.credits} kredit</strong>.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {enoughCredits ? (
              <form action={unlockSubmissionAction.bind(null, submission.id)}>
                <button className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
                  Gunakan {CREDITS_PER_DOCUMENT} kredit
                </button>
              </form>
            ) : (
              <Link
                href="/nakes/topup"
                className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
              >
                Topup kredit
              </Link>
            )}
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-navy-300 px-4 py-2 text-sm text-navy-700 hover:bg-white"
              >
                Hubungi admin (WhatsApp)
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function statusHint(status: SubmissionStatus, unlocked: boolean) {
  switch (status) {
    case "DRAFT":
      return "Masih draft — bisa diubah bebas. Ajukan jika sudah lengkap agar direview admin.";
    case "SUBMITTED":
      return "Sedang menunggu review admin.";
    case "REJECTED":
      return unlocked
        ? "Ditolak admin — perbaiki lewat Edit berkas lalu ajukan ulang."
        : "Ditolak admin — buka akses dokumen untuk memperbaiki dan mengajukan ulang.";
    case "APPROVED":
      return unlocked
        ? "Disetujui — PDF siap diunduh dan dicetak."
        : "Disetujui — buka akses untuk mengunduh PDF tanpa watermark.";
  }
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const color =
    status === "APPROVED"
      ? "bg-brand-100 text-brand-800"
      : status === "REJECTED"
      ? "bg-red-100 text-red-800"
      : status === "DRAFT"
      ? "bg-zinc-100 text-zinc-700"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}
