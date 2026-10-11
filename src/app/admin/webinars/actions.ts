"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  eventDate: z.coerce.date(),
  registrationLink: z.string().url(),
});

export type WebinarFormState = { error?: string } | undefined;

export async function createWebinarAction(
  _prevState: WebinarFormState,
  formData: FormData
): Promise<WebinarFormState> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    eventDate: formData.get("eventDate"),
    registrationLink: formData.get("registrationLink"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await prisma.webinar.create({
    data: { ...parsed.data, createdById: admin.id },
  });

  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
}

export async function deleteWebinarAction(id: string) {
  await requireAdmin();
  await prisma.webinar.delete({ where: { id } });
  revalidatePath("/admin/webinars");
  revalidatePath("/webinars");
}
