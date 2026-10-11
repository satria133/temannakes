export function pdfResponse(buffer: Buffer, fileName: string, disposition: "inline" | "attachment") {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export function pdfFileName(fullName: string | null, id: string) {
  const slug = (fullName ?? "dokumen")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `rekap-skp-${slug || "dokumen"}-${id.slice(-6)}.pdf`;
}
