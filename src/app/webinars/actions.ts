"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function toggleWebinarSubscriptionAction() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/webinars");

  const existing = await prisma.subscription.findUnique({
    where: { userId_type: { userId: session.user.id, type: "WEBINAR" } },
  });

  if (existing) {
    await prisma.subscription.delete({ where: { id: existing.id } });
  } else {
    await prisma.subscription.create({
      data: { userId: session.user.id, type: "WEBINAR" },
    });
  }
  revalidatePath("/webinars");
}
