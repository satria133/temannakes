import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FILE_URL_PREFIX, resolveStoredFile } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/files/[...path]">
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path: segments } = await params;
  const url = `${FILE_URL_PREFIX}${segments.join("/")}`;
  const filePath = resolveStoredFile(url);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  // Evidence (logbooks, patient records) is visible only to its owner and admins;
  // letterheads are shared master data for any signed-in user.
  if (segments[0] === "evidence" && session.user.role !== "ADMIN") {
    const evidence = await prisma.evidenceFile.findFirst({
      where: { fileUrl: url },
      include: { submission: { include: { nakesProfile: true } } },
    });
    if (evidence?.submission.nakesProfile.userId !== session.user.id) {
      return new Response("Not found", { status: 404 });
    }
  } else if (segments[0] !== "evidence" && segments[0] !== "institutions") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
