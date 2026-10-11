import { requireNakes } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PROFESSION_LABELS } from "@/lib/constants";
import { SubmissionForm } from "./submission-form";

export default async function NewSubmissionPage() {
  const user = await requireNakes();
  const profile = await prisma.nakesProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/nakes/profile");
  }

  const [activityTemplates, institutions] = await Promise.all([
    prisma.activityTemplate.findMany({
      where: { profession: profile.profession, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Ajukan Dokumen SKP</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Profesi: <strong>{PROFESSION_LABELS[profile.profession as keyof typeof PROFESSION_LABELS]}</strong>
      </p>
      <SubmissionForm
        profession={profile.profession}
        professionLabel={PROFESSION_LABELS[profile.profession as keyof typeof PROFESSION_LABELS]}
        activityTemplates={activityTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          groupLabel: t.groupLabel,
        }))}
        institutions={institutions.map((i) => ({ id: i.id, name: i.name }))}
      />
    </div>
  );
}
