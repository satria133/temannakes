import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { renderSubmissionPdf } from "@/lib/pdf/render";
import { pdfFileName, pdfResponse } from "@/lib/pdf/response";

export async function GET(_request: Request, { params }: RouteContext<"/nakes/skp/[id]/pdf">) {
  const user = await requireNakes();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: { nakesProfile: true },
  });
  if (!submission || submission.nakesProfile.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (submission.status !== "APPROVED") {
    return Response.json({ error: "Dokumen belum disetujui admin" }, { status: 403 });
  }
  if (!submission.unlockedAt) {
    return Response.json({ error: "Buka akses dokumen dengan kredit terlebih dahulu" }, { status: 402 });
  }

  const buffer = await renderSubmissionPdf(id, { watermark: false });
  return pdfResponse(buffer, pdfFileName(submission.fullName, id), "attachment");
}
