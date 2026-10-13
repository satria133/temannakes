"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";
import { isValidProofFile } from "@/lib/topup-requests";
import { MAX_PENDING_TOPUPS, TOPUP_PACKAGES, TOPUP_PROOF_MAX_BYTES } from "@/lib/constants";

export type TopupState = { error?: string; ok?: boolean } | undefined;

export async function createTopupRequestAction(_prev: TopupState, formData: FormData): Promise<TopupState> {
  const user = await requireNakes();

  const credits = Number(formData.get("credits"));
  if (!(TOPUP_PACKAGES as readonly number[]).includes(credits)) {
    return { error: "Pilih jumlah kredit yang tersedia." };
  }
  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;

  const proof = formData.get("proof");
  if (!(proof instanceof File) || proof.size === 0) return { error: "Unggah bukti transfer." };
  if (proof.size > TOPUP_PROOF_MAX_BYTES) return { error: "Ukuran bukti maksimal 5 MB." };
  if (!(await isValidProofFile(proof))) return { error: "Bukti harus berupa gambar (JPG/PNG/WEBP) atau PDF." };

  const pending = await prisma.topupRequest.count({ where: { userId: user.id, status: "PENDING" } });
  if (pending >= MAX_PENDING_TOPUPS) {
    return { error: `Masih ada ${pending} permintaan menunggu verifikasi. Tunggu admin memprosesnya dulu.` };
  }

  const { url, fileName } = await saveUploadedFile(proof, "topup");
  await prisma.topupRequest.create({
    data: { userId: user.id, credits, note, proofUrl: url, proofName: fileName },
  });

  revalidatePath("/nakes/topup");
  revalidatePath("/admin/topups");
  return { ok: true };
}
