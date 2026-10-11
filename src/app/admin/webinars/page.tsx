import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { WebinarForm } from "./webinar-form";
import { DeleteWebinarButton } from "./delete-button";

export default async function AdminWebinarsPage() {
  await requireAdmin();
  const webinars = await prisma.webinar.findMany({
    orderBy: { eventDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">Kelola Webinar</h1>
      <div className="mt-4">
        <WebinarForm />
      </div>
      <ul className="mt-6 space-y-2">
        {webinars.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm"
          >
            <div>
              <p className="font-medium">{w.title}</p>
              <p className="text-xs text-zinc-500">
                {w.eventDate.toLocaleDateString("id-ID")}
              </p>
            </div>
            <DeleteWebinarButton id={w.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
