import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  SUBMISSION_STATUS_LABELS,
  MONTH_LABELS,
  professionLabel,
  type SubmissionStatus,
} from "@/lib/constants";
import { ReviewActions } from "./review-actions";
import { adminUnlockAction } from "./actions";

export default async function AdminSubmissionDetailPage({
  params,
}: PageProps<"/admin/submissions/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: {
      nakesProfile: { include: { user: { select: { email: true, credits: true } } } },
      institution: true,
      evidenceFiles: true,
      entries: { include: { activityTemplate: true } },
    },
  });

  // Drafts are private to the nakes until submitted.
  if (!submission || submission.status === "DRAFT") notFound();

  const status = submission.status as SubmissionStatus;
  const profile = submission.nakesProfile;

  const rowMap = new Map<string, { label: string; total: number }>();
  for (const e of submission.entries) {
    const key = e.activityTemplateId ?? `custom:${e.customActivityName}`;
    const label = e.activityTemplate?.name ?? e.customActivityName ?? "Lainnya";
    const existing = rowMap.get(key) ?? { label, total: 0 };
    existing.total += e.quantity;
    rowMap.set(key, existing);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin/submissions" className="text-sm text-brand-700 hover:underline">
        ← Daftar pengajuan
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-navy-800">
        {submission.fullName ?? profile.fullName} — {professionLabel(submission.profession)}
      </h1>

      <div className="mt-4 rounded-lg border bg-white p-4">
        <dl className="grid grid-cols-[11rem_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-zinc-500">Status</dt>
          <dd>{SUBMISSION_STATUS_LABELS[status]}</dd>
          <dt className="text-zinc-500">Akun</dt>
          <dd>
            {profile.user.email} · {profile.user.credits} kredit
          </dd>
          <dt className="text-zinc-500">Akses dokumen</dt>
          <dd>{submission.unlockedAt ? "Terbuka" : "Terkunci (belum topup)"}</dd>
          <dt className="text-zinc-500">No. STR</dt>
          <dd>{submission.strNumber ?? profile.strNumber}</dd>
          <dt className="text-zinc-500">No. SIP</dt>
          <dd>
            {submission.sipNumber ?? profile.sipNumber}, berlaku s.d.{" "}
            {(submission.sipValidUntil ?? profile.sipValidUntil).toLocaleDateString("id-ID", {
              timeZone: "UTC",
            })}
          </dd>
          <dt className="text-zinc-500">Jabatan</dt>
          <dd>
            {submission.position ?? profile.position}
            {submission.employeeNip && ` · NIP. ${submission.employeeNip}`}
          </dd>
          <dt className="text-zinc-500">Instansi</dt>
          <dd>{submission.institution.name}</dd>
          <dt className="text-zinc-500">Atasan</dt>
          <dd>
            {submission.supervisorName ?? "—"}
            {submission.supervisorNip && ` · NIP. ${submission.supervisorNip}`}
          </dd>
          <dt className="text-zinc-500">Periode</dt>
          <dd>
            {submission.periodMonths} bulan mulai {MONTH_LABELS[submission.periodStart.getUTCMonth()]}{" "}
            {submission.periodStart.getUTCFullYear()}
          </dd>
        </dl>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/admin/submissions/${submission.id}/preview`}
            target="_blank"
            className="rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
          >
            Pratinjau PDF
          </a>
          {!submission.unlockedAt && (
            <form action={adminUnlockAction.bind(null, submission.id)}>
              <button className="rounded-md border border-navy-300 px-3 py-1.5 text-sm text-navy-700 hover:bg-navy-50">
                Buka akses gratis
              </button>
            </form>
          )}
        </div>

        <h2 className="mt-6 text-sm font-semibold text-navy-800">Rekap Kegiatan</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {Array.from(rowMap.values()).map((r, i) => (
            <li key={i} className="flex justify-between border-b py-1">
              <span>{r.label}</span>
              <span className="font-medium">{r.total}</span>
            </li>
          ))}
          {rowMap.size === 0 && <li className="text-zinc-500">Tidak ada data kegiatan.</li>}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-navy-800">Bukti Pendukung</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {submission.evidenceFiles.map((f) => (
            <li key={f.id}>
              <a href={f.fileUrl} target="_blank" className="text-brand-700 hover:underline">
                {f.fileName}
              </a>
            </li>
          ))}
          {submission.evidenceFiles.length === 0 && <li className="text-zinc-500">Tidak ada file.</li>}
        </ul>

        {status === "SUBMITTED" && <ReviewActions submissionId={submission.id} />}
        {submission.adminNote && (
          <p className="mt-4 text-sm text-red-600">Catatan: {submission.adminNote}</p>
        )}
      </div>
    </div>
  );
}
