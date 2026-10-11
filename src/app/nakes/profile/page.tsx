import { requireNakes } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PROFESSIONS, PROFESSION_LABELS } from "@/lib/constants";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireNakes();
  const profile = await prisma.nakesProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold">Profil Tenaga Kesehatan</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Data ini akan digunakan pada setiap dokumen SKP yang kamu ajukan.
      </p>
      <ProfileForm
        professions={PROFESSIONS}
        labels={PROFESSION_LABELS}
        defaultValues={
          profile
            ? {
                ...profile,
                sipValidUntil: profile.sipValidUntil
                  .toISOString()
                  .slice(0, 10),
              }
            : undefined
        }
      />
    </div>
  );
}
