import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import {
  PROFESSION_LABELS,
  SUBMISSION_STATUS_LABELS,
  type Profession,
  type SubmissionStatus,
} from "@/lib/constants";

export default async function SkpHistoryPage() {
  const user = await requireNakes();

  const profile = await prisma.nakesProfile.findUnique({
    where: { userId: user.id },
  });

  const submissions = profile
    ? await prisma.serviceSubmission.findMany({
        where: { nakesProfileId: profile.id },
        orderBy: { createdAt: "desc" },
        include: { institution: true },
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Riwayat Dokumen SKP</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/nakes/profile" className="text-brand-700">
            Edit Profil
          </Link>
          <Link
            href="/nakes/skp/new"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
          >
            + Ajukan Baru
          </Link>
        </div>
      </div>

      {!profile && (
        <p className="mt-6 text-sm text-zinc-600">
          Lengkapi{" "}
          <Link href="/nakes/profile" className="text-brand-700">
            profil
          </Link>{" "}
          terlebih dahulu sebelum mengajukan dokumen SKP.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {submissions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/nakes/skp/${s.id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {PROFESSION_LABELS[s.profession as Profession] ?? s.profession} —{" "}
                  {s.institution.name}
                </span>
                <span className="text-xs text-zinc-500">
                  {SUBMISSION_STATUS_LABELS[s.status as SubmissionStatus]}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Periode {s.periodMonths} bulan mulai{" "}
                {s.periodStart.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </Link>
          </li>
        ))}
        {submissions.length === 0 && profile && (
          <p className="text-sm text-zinc-500">Belum ada pengajuan.</p>
        )}
      </ul>
    </div>
  );
}
