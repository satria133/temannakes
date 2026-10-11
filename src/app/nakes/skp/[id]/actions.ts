"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireNakes } from "@/lib/session";
import { unlockWithCredits } from "@/lib/credits";

export async function unlockSubmissionAction(submissionId: string) {
  const user = await requireNakes();
  const result = await unlockWithCredits(user.id, submissionId);
  revalidatePath(`/nakes/skp/${submissionId}`);
  if (!result.ok) {
    redirect(`/nakes/skp/${submissionId}?error=${result.code}`);
  }
  redirect(`/nakes/skp/${submissionId}?unlocked=1`);
}
