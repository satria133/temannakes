import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  PROFESSION_LABELS,
  SUBMISSION_STATUS_LABELS,
  type Profession,
  type SubmissionStatus,
} from "@/lib/constants";

export default async function AdminSubmissionsPage({
  searchParams,
}: PageProps<"/admin/submissions">) {
  await requireAdmin();
  const params = await searchParams;
  const statusFilter =
    typeof params?.status === "string" ? params.status : "SUBMITTED";

  const submissions = await prisma.serviceSubmission.findMany({
    where:
      statusFilter === "ALL" || statusFilter === "DRAFT"
        ? { status: { not: "DRAFT" } }
        : { status: statusFilter },
    orderBy: { updatedAt: "asc" },
    include: { nakesProfile: true, institution: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Review Dokumen SKP</h1>

      <div className="mt-4 flex gap-2 text-sm">
        {["SUBMITTED", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <Link
            key={s}
            href={`/admin/submissions?status=${s}`}
            className={`rounded-md px-3 py-1.5 ${
              statusFilter === s
                ? "bg-brand-600 text-white"
                : "bg-white border text-zinc-700"
            }`}
          >
            {s === "ALL" ? "Semua" : SUBMISSION_STATUS_LABELS[s as SubmissionStatus]}
          </Link>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {submissions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/admin/submissions/${s.id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {s.fullName ?? s.nakesProfile.fullName} —{" "}
                  {PROFESSION_LABELS[s.profession as Profession] ?? s.profession}
                </span>
                <span className="text-xs text-zinc-500">
                  {SUBMISSION_STATUS_LABELS[s.status as SubmissionStatus]}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {s.institution.name} · diajukan{" "}
                {s.createdAt.toLocaleDateString("id-ID")}
              </p>
            </Link>
          </li>
        ))}
        {submissions.length === 0 && (
          <p className="text-sm text-zinc-500">Tidak ada data.</p>
        )}
      </ul>
    </div>
  );
}
