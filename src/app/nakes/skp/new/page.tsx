import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { PROFESSIONS, PROFESSION_LABELS } from "@/lib/constants";
import { SubmissionForm } from "../submission-form";
import { loadFormOptions, toDateInput } from "../form-data";
import { createSubmissionAction } from "./actions";

export default async function NewSubmissionPage() {
  const user = await requireNakes();
  const profile = await prisma.nakesProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/nakes/profile");

  const [{ templatesByProfession, institutions }, lastSubmission] = await Promise.all([
    loadFormOptions(),
    prisma.serviceSubmission.findFirst({
      where: { nakesProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Buat Dokumen SKP</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Simpan sebagai draft dulu kalau belum lengkap — draft bisa diubah kapan saja dan
        dipratinjau sebelum diajukan.
      </p>
      <SubmissionForm
        action={createSubmissionAction}
        mode="create"
        isDraft
        professions={PROFESSIONS}
        professionLabels={PROFESSION_LABELS}
        templatesByProfession={templatesByProfession}
        institutions={institutions}
        defaults={{
          profession: profile.profession,
          periodMonths: 6,
          periodStartMonth: now.getMonth() + 1,
          periodStartYear: now.getFullYear(),
          // Reuse the previous document's institution & supervisor: they rarely change.
          institutionId: lastSubmission?.institutionId,
          fullName: profile.fullName,
          strNumber: profile.strNumber,
          sipNumber: profile.sipNumber,
          sipValidUntil: toDateInput(profile.sipValidUntil),
          position: profile.position,
          employeeNip: lastSubmission?.employeeNip ?? "",
          supervisorName: lastSubmission?.supervisorName ?? "",
          supervisorNip: lastSubmission?.supervisorNip ?? "",
          city: lastSubmission?.city ?? "",
          quantities: {},
          customActivities: [],
          extraTemplates: [],
          evidenceFiles: [],
        }}
      />
    </div>
  );
}
