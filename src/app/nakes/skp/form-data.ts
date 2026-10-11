import { prisma } from "@/lib/prisma";
import type { TemplateOption } from "./submission-form";

export async function loadFormOptions() {
  const [templates, institutions] = await Promise.all([
    prisma.activityTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ profession: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const templatesByProfession: Record<string, TemplateOption[]> = {};
  for (const t of templates) {
    (templatesByProfession[t.profession] ??= []).push({
      id: t.id,
      name: t.name,
      groupLabel: t.groupLabel,
    });
  }
  return { templatesByProfession, institutions };
}

export function toDateInput(d: Date | null | undefined) {
  return d ? d.toISOString().slice(0, 10) : "";
}
