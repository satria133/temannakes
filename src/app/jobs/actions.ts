"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function toggleJobSubscriptionAction() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/jobs");

  const existing = await prisma.subscription.findUnique({
    where: { userId_type: { userId: session.user.id, type: "LOKER" } },
  });

  if (existing) {
    await prisma.subscription.delete({ where: { id: existing.id } });
  } else {
    await prisma.subscription.create({
      data: { userId: session.user.id, type: "LOKER" },
    });
  }
  revalidatePath("/jobs");
}
