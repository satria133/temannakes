import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { toggleJobSubscriptionAction } from "./actions";

export default async function JobsPage() {
  const session = await auth();
  const now = new Date();

  const [allJobs, subscription] = await Promise.all([
    prisma.jobPosting.findMany({ orderBy: { expiresAt: "asc" } }),
    session?.user
      ? prisma.subscription.findUnique({
          where: { userId_type: { userId: session.user.id, type: "LOKER" } },
        })
      : null,
  ]);

  const jobs = allJobs.filter((j) => j.expiresAt >= now);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Loker Medis</h1>
        <form action={toggleJobSubscriptionAction}>
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100">
            {subscription ? "Berhenti Berlangganan" : "Berlangganan"}
          </button>
        </form>
      </div>

      <ul className="mt-6 space-y-3">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">{j.title}</h3>
            <p className="text-sm text-zinc-600">
              {j.institution} · {j.location}
            </p>
            <p className="mt-1 text-sm text-zinc-600">{j.description}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Berakhir {j.expiresAt.toLocaleDateString("id-ID")}
            </p>
            <a
              href={j.applyLink}
              target="_blank"
              className="mt-2 inline-block text-sm text-brand-700 hover:underline"
            >
              Lamar sekarang →
            </a>
          </li>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-zinc-500">Belum ada lowongan aktif.</p>
        )}
      </ul>
    </div>
  );
}
