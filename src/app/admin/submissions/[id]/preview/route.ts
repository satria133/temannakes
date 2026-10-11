import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { renderSubmissionPdf } from "@/lib/pdf/render";
import { pdfFileName, pdfResponse } from "@/lib/pdf/response";

export async function GET(_request: Request, { params }: RouteContext<"/admin/submissions/[id]/preview">) {
  await requireAdmin();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({ where: { id } });
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderSubmissionPdf(id, { watermark: true });
  return pdfResponse(buffer, `pratinjau-${pdfFileName(submission.fullName, id)}`, "inline");
}
