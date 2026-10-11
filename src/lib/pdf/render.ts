import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import path from "path";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { resolveStoredFile } from "@/lib/storage";
import { MONTH_LABELS, professionLabel } from "@/lib/constants";
import { SubmissionPdfDocument, type PdfData } from "./template";

async function toDataUrl(fileUrl: string): Promise<string | undefined> {
  const filePath = resolveStoredFile(fileUrl);
  if (!filePath) return undefined;
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext || "png";
    return `data:image/${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function renderSubmissionPdf(
  submissionId: string,
  options: { watermark: boolean }
): Promise<Buffer> {
  const submission = await prisma.serviceSubmission.findUniqueOrThrow({
    where: { id: submissionId },
    include: {
      nakesProfile: true,
      institution: true,
      entries: { include: { activityTemplate: true } },
    },
  });

  const months: { month: number; year: number }[] = [];
  for (let i = 0; i < submission.periodMonths; i++) {
    const d = new Date(
      Date.UTC(
        submission.periodStart.getUTCFullYear(),
        submission.periodStart.getUTCMonth() + i,
        1
      )
    );
    months.push({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
  }

  type RowAcc = { label: string; quantitiesByMonth: number[]; total: number };
  const rowMap = new Map<string, RowAcc>();

  for (const entry of submission.entries) {
    const key = entry.activityTemplateId ?? `custom:${entry.customActivityName}`;
    const label =
      entry.activityTemplate?.name ?? entry.customActivityName ?? "Lainnya";
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        label,
        quantitiesByMonth: new Array(months.length).fill(0),
        total: 0,
      });
    }
    const monthIndex = months.findIndex(
      (m) => m.month === entry.month && m.year === entry.year
    );
    if (monthIndex >= 0) {
      const row = rowMap.get(key)!;
      row.quantitiesByMonth[monthIndex] += entry.quantity;
      row.total += entry.quantity;
    }
  }

  const rows = Array.from(rowMap.values());
  const columnTotals = months.map((_, i) =>
    rows.reduce((sum, r) => sum + r.quantitiesByMonth[i], 0)
  );
  const grandTotal = columnTotals.reduce((a, b) => a + b, 0);

  const letterheadUrl = await toDataUrl(submission.institution.letterheadUrl);

  const periodLabel = `${MONTH_LABELS[months[0].month - 1]} ${months[0].year} - ${
    MONTH_LABELS[months[months.length - 1].month - 1]
  } ${months[months.length - 1].year}`;

  // Rows created before per-document identity existed fall back to the profile.
  const profile = submission.nakesProfile;
  const sipValidUntil = submission.sipValidUntil ?? profile.sipValidUntil;

  const data: PdfData = {
    professionLabel: professionLabel(submission.profession),
    letterheadUrl,
    institutionName: submission.institution.name,
    fullName: submission.fullName ?? profile.fullName,
    strNumber: submission.strNumber ?? profile.strNumber,
    sipNumber: submission.sipNumber ?? profile.sipNumber,
    sipValidUntil: sipValidUntil.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    position: submission.position ?? profile.position,
    employeeNip: submission.employeeNip ?? undefined,
    supervisorName: submission.supervisorName ?? undefined,
    supervisorNip: submission.supervisorNip ?? undefined,
    periodLabel,
    months,
    rows,
    columnTotals,
    grandTotal,
    city: submission.city ?? undefined,
    issuedDateLabel: (submission.reviewedAt ?? new Date()).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }),
    watermark: options.watermark ? "PRATINJAU — TemanNakes" : undefined,
  };

  const element = createElement(SubmissionPdfDocument, { data });
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
