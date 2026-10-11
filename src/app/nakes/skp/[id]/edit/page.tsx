import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { PROFESSIONS, PROFESSION_LABELS } from "@/lib/constants";
import { canEditSubmission } from "@/lib/submission-input";
import { SubmissionForm } from "../../submission-form";
import { loadFormOptions, toDateInput } from "../../form-data";
import { updateSubmissionAction } from "./actions";

export default async function EditSubmissionPage({ params }: PageProps<"/nakes/skp/[id]/edit">) {
  const { id } = await params;
  const user = await requireNakes();

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: {
      nakesProfile: true,
      evidenceFiles: true,
      entries: { include: { activityTemplate: true } },
    },
  });
  if (!submission || submission.nakesProfile.userId !== user.id) notFound();

  if (!canEditSubmission(submission)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-navy-800">Edit belum tersedia</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Dokumen yang sudah diajukan bisa diedit setelah akses dokumen dibuka dengan kredit.
        </p>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <Link href={`/nakes/skp/${id}`} className="rounded-md border px-4 py-2">
            Kembali
          </Link>
          <Link href="/nakes/topup" className="rounded-md bg-brand-600 px-4 py-2 text-white">
            Topup kredit
          </Link>
        </div>
      </div>
    );
  }

  const { templatesByProfession, institutions } = await loadFormOptions();
  const profile = submission.nakesProfile;

  const quantities: Record<string, number> = {};
  const customActivities = new Set<string>();
  const extraTemplates = new Map<string, { id: string; name: string; groupLabel: string | null }>();
  for (const e of submission.entries) {
    const base = e.activityTemplateId ?? `custom:${e.customActivityName ?? ""}`;
    quantities[`${base}|${e.year}-${e.month}`] = e.quantity;
    if (e.activityTemplate) {
      const t = e.activityTemplate;
      extraTemplates.set(t.id, { id: t.id, name: t.name, groupLabel: t.groupLabel });
    } else if (e.customActivityName) {
      customActivities.add(e.customActivityName);
    }
  }

  const isDraft = submission.status === "DRAFT";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Edit Dokumen SKP</h1>
      {!isDraft && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Dokumen ini sudah diajukan. Setelah disimpan, dokumen kembali ke antrean review admin
          sebelum bisa diunduh lagi.
        </p>
      )}
      <SubmissionForm
        action={updateSubmissionAction.bind(null, submission.id)}
        mode="edit"
        isDraft={isDraft}
        professions={PROFESSIONS}
        professionLabels={PROFESSION_LABELS}
        templatesByProfession={templatesByProfession}
        institutions={institutions}
        defaults={{
          profession: submission.profession,
          periodMonths: submission.periodMonths === 12 ? 12 : 6,
          periodStartMonth: submission.periodStart.getUTCMonth() + 1,
          periodStartYear: submission.periodStart.getUTCFullYear(),
          institutionId: submission.institutionId,
          fullName: submission.fullName ?? profile.fullName,
          strNumber: submission.strNumber ?? profile.strNumber,
          sipNumber: submission.sipNumber ?? profile.sipNumber,
          sipValidUntil: toDateInput(submission.sipValidUntil ?? profile.sipValidUntil),
          position: submission.position ?? profile.position,
          employeeNip: submission.employeeNip ?? "",
          supervisorName: submission.supervisorName ?? "",
          supervisorNip: submission.supervisorNip ?? "",
          city: submission.city ?? "",
          quantities,
          customActivities: [...customActivities],
          extraTemplates: [...extraTemplates.values()],
          evidenceFiles: submission.evidenceFiles.map((f) => ({
            id: f.id,
            fileName: f.fileName,
            fileUrl: f.fileUrl,
          })),
        }}
      />
    </div>
  );
}
