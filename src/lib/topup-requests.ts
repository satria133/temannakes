import { prisma } from "@/lib/prisma";

// Persetujuan atomik: hanya request PENDING yang bisa diproses sekali, sehingga klik
// ganda / dua admin sekaligus tidak menambah kredit dua kali.
export async function approveTopup(adminId: string, requestId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.topupRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: new Date() },
    });
    if (claimed.count === 0) return false;
    const req = await tx.topupRequest.findUniqueOrThrow({ where: { id: requestId } });
    await tx.user.update({ where: { id: req.userId }, data: { credits: { increment: req.credits } } });
    await tx.creditTransaction.create({
      data: {
        userId: req.userId,
        amount: req.credits,
        note: `Topup ${req.credits} kredit disetujui (bukti transfer)`,
        createdById: adminId,
      },
    });
    return true;
  });
}

export async function rejectTopup(adminId: string, requestId: string, reason: string | null): Promise<boolean> {
  const res = await prisma.topupRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", reviewNote: reason, reviewedById: adminId, reviewedAt: new Date() },
  });
  return res.count === 1;
}

const SIGNATURES: { ext: string[]; match: (b: Buffer) => boolean }[] = [
  { ext: [".png"], match: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: [".jpg", ".jpeg"], match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: [".webp"], match: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { ext: [".pdf"], match: (b) => b.subarray(0, 5).toString() === "%PDF-" },
];

// Cek ekstensi DAN isi file (bukan hanya MIME dari klien) untuk bukti transfer.
export async function isValidProofFile(file: File): Promise<boolean> {
  const name = file.name.toLowerCase();
  const sig = SIGNATURES.find((s) => s.ext.some((e) => name.endsWith(e)));
  if (!sig) return false;
  const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
  return sig.match(head);
}
