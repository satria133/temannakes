import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import {
  PROFESSION_LABELS,
  SUBMISSION_STATUS_LABELS,
  type Profession,
  type SubmissionStatus,
} from "@/lib/constants";

export default async function SubmissionDetailPage({
  params,
}: PageProps<"/nakes/skp/[id]">) {
  const { id } = await params;
  const user = await requireNakes();

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: {
      nakesProfile: true,
      institution: true,
      evidenceFiles: true,
    },
  });

  if (!submission || submission.nakesProfile.userId !== user.id) {
    notFound();
  }

  const status = submission.status as SubmissionStatus;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold">
        Dokumen SKP —{" "}
        {PROFESSION_LABELS[submission.profession as Profession] ??
          submission.profession}
      </h1>

      <div className="mt-4 rounded-lg border bg-white p-4">
        <StatusBadge status={status} />
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500">Instansi</dt>
          <dd>{submission.institution.name}</dd>
          <dt className="text-zinc-500">Periode</dt>
          <dd>
            {submission.periodMonths} bulan, mulai{" "}
            {submission.periodStart.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </dd>
          <dt className="text-zinc-500">Bukti pendukung</dt>
          <dd>{submission.evidenceFiles.length} file</dd>
          {submission.adminNote && (
            <>
              <dt className="text-zinc-500">Catatan Admin</dt>
              <dd>{submission.adminNote}</dd>
            </>
          )}
        </dl>

        {status === "APPROVED" && (
          <a
            href={`/nakes/skp/${submission.id}/pdf`}
            target="_blank"
            className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
          >
            Unduh PDF
          </a>
        )}
        {status === "SUBMITTED" && (
          <p className="mt-4 text-sm text-zinc-600">
            Dokumen sedang menunggu review admin.
          </p>
        )}
        {status === "REJECTED" && (
          <p className="mt-4 text-sm text-red-600">
            Dokumen ditolak. Silakan ajukan dokumen baru dengan perbaikan.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const color =
    status === "APPROVED"
      ? "bg-brand-100 text-brand-800"
      : status === "REJECTED"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}
