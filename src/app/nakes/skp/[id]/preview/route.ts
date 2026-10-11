import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { renderSubmissionPdf } from "@/lib/pdf/render";
import { pdfFileName, pdfResponse } from "@/lib/pdf/response";

// Watermarked preview: available in every status so nakes can check the
// layout before paying for the clean download.
export async function GET(_request: Request, { params }: RouteContext<"/nakes/skp/[id]/preview">) {
  const user = await requireNakes();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: { nakesProfile: true },
  });
  if (!submission || submission.nakesProfile.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await renderSubmissionPdf(id, { watermark: true });
  return pdfResponse(buffer, `pratinjau-${pdfFileName(submission.fullName, id)}`, "inline");
}
