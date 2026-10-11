"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";

const schema = z.object({
  title: z.string().min(2),
  institution: z.string().min(2),
  description: z.string().min(2),
  location: z.string().min(2),
  applyLink: z.string().url(),
  expiresAt: z.coerce.date(),
});

export type JobFormState = { error?: string } | undefined;

export async function createJobAction(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    title: formData.get("title"),
    institution: formData.get("institution"),
    description: formData.get("description"),
    location: formData.get("location"),
    applyLink: formData.get("applyLink"),
    expiresAt: formData.get("expiresAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await prisma.jobPosting.create({
    data: { ...parsed.data, createdById: admin.id },
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

export async function deleteJobAction(id: string) {
  await requireAdmin();
  await prisma.jobPosting.delete({ where: { id } });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}
