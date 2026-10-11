import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Files live outside public/ so they survive image rebuilds (mounted volume in
// Docker) and are served only through the authenticated /files route.
export const UPLOAD_ROOT = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads")
);

export const FILE_URL_PREFIX = "/files/";

export async function saveUploadedFile(
  file: File,
  subdir: "institutions" | "evidence"
): Promise<{ url: string; fileName: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueName = `${randomUUID()}-${safeName}`;
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, uniqueName), bytes);
  return { url: `${FILE_URL_PREFIX}${subdir}/${uniqueName}`, fileName: file.name };
}

export function resolveStoredFile(url: string): string | null {
  if (!url.startsWith(FILE_URL_PREFIX)) return null;
  const relative = url.slice(FILE_URL_PREFIX.length);
  const fullPath = path.resolve(UPLOAD_ROOT, relative);
  if (!fullPath.startsWith(UPLOAD_ROOT + path.sep)) return null;
  return fullPath;
}
