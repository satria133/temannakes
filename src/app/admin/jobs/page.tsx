import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { JobForm } from "./job-form";
import { DeleteJobButton } from "./delete-button";
import { ImportLokermedis } from "./import-lokermedis";

export default async function AdminJobsPage() {
  await requireAdmin();
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { expiresAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">Kelola Loker Medis</h1>
      <div className="mt-4">
        <JobForm />
      </div>
      <div className="mt-4">
        <ImportLokermedis />
      </div>
      <ul className="mt-6 space-y-2">
        {jobs.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium">{j.title}</p>
              <p className="text-xs text-zinc-500">
                {j.institution} · berakhir {j.expiresAt.toLocaleDateString("id-ID")}
              </p>
            </div>
            <DeleteJobButton id={j.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
