import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  PROFESSION_LABELS,
  SUBMISSION_STATUS_LABELS,
  MONTH_LABELS,
  type Profession,
  type SubmissionStatus,
} from "@/lib/constants";
import { ReviewActions } from "./review-actions";

export default async function AdminSubmissionDetailPage({
  params,
}: PageProps<"/admin/submissions/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: {
      nakesProfile: true,
      institution: true,
      evidenceFiles: true,
      entries: { include: { activityTemplate: true } },
    },
  });

  if (!submission) notFound();

  const status = submission.status as SubmissionStatus;

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
      <h1 className="text-xl font-semibold">
        {submission.nakesProfile.fullName} —{" "}
        {PROFESSION_LABELS[submission.profession as Profession] ??
          submission.profession}
      </h1>

      <div className="mt-4 rounded-lg border bg-white p-4">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500">Status</dt>
          <dd>{SUBMISSION_STATUS_LABELS[status]}</dd>
          <dt className="text-zinc-500">No. STR / SIP</dt>
          <dd>
            {submission.nakesProfile.strNumber} /{" "}
            {submission.nakesProfile.sipNumber}
          </dd>
          <dt className="text-zinc-500">Instansi</dt>
          <dd>{submission.institution.name}</dd>
          <dt className="text-zinc-500">Periode</dt>
          <dd>
            {submission.periodMonths} bulan mulai{" "}
            {MONTH_LABELS[submission.periodStart.getUTCMonth()]}{" "}
            {submission.periodStart.getUTCFullYear()}
          </dd>
        </dl>

        <h2 className="mt-4 text-sm font-semibold">Rekap Kegiatan</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {Array.from(rowMap.values()).map((r, i) => (
            <li key={i} className="flex justify-between border-b py-1">
              <span>{r.label}</span>
              <span className="font-medium">{r.total}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-4 text-sm font-semibold">Bukti Pendukung</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {submission.evidenceFiles.map((f) => (
            <li key={f.id}>
              <a
                href={f.fileUrl}
                target="_blank"
                className="text-brand-700 hover:underline"
              >
                {f.fileName}
              </a>
            </li>
          ))}
          {submission.evidenceFiles.length === 0 && (
            <li className="text-zinc-500">Tidak ada file.</li>
          )}
        </ul>

        {status === "SUBMITTED" && (
          <ReviewActions submissionId={submission.id} />
        )}
        {submission.adminNote && (
          <p className="mt-4 text-sm text-red-600">
            Catatan: {submission.adminNote}
          </p>
        )}
      </div>
    </div>
  );
}
