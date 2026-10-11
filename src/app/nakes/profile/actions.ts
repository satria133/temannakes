"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { PROFESSIONS } from "@/lib/constants";
import { redirect } from "next/navigation";

const schema = z.object({
  fullName: z.string().min(2, "Nama wajib diisi"),
  profession: z.enum(PROFESSIONS),
  educationLevel: z.string().min(2, "Tingkat pendidikan wajib diisi"),
  yearsOfService: z.coerce.number().int().min(0),
  serviceResponsibility: z.string().min(2, "Tanggung jawab pelayanan wajib diisi"),
  strNumber: z.string().min(1, "No. STR wajib diisi"),
  sipNumber: z.string().min(1, "No. SIP wajib diisi"),
  sipValidUntil: z.coerce.date(),
  position: z.string().min(1, "Jabatan wajib diisi"),
});

export type ProfileState = { error?: string } | undefined;

export async function saveProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireNakes();

  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    profession: formData.get("profession"),
    educationLevel: formData.get("educationLevel"),
    yearsOfService: formData.get("yearsOfService"),
    serviceResponsibility: formData.get("serviceResponsibility"),
    strNumber: formData.get("strNumber"),
    sipNumber: formData.get("sipNumber"),
    sipValidUntil: formData.get("sipValidUntil"),
    position: formData.get("position"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await prisma.nakesProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  redirect("/nakes/skp");
}
