import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireNakes } from "@/lib/session";
import { renderSubmissionPdf } from "@/lib/pdf/render";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/nakes/skp/[id]/pdf">
) {
  const user = await requireNakes();
  const { id } = await params;

  const submission = await prisma.serviceSubmission.findUnique({
    where: { id },
    include: { nakesProfile: true },
  });

  if (!submission || submission.nakesProfile.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (submission.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Dokumen belum disetujui" },
      { status: 403 }
    );
  }

  const buffer = await renderSubmissionPdf(id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="skp-${id}.pdf"`,
    },
  });
}
