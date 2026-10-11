import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isWithinListingWindow, isHighlighted } from "@/lib/listing";
import { toggleWebinarSubscriptionAction } from "./actions";

export default async function WebinarsPage() {
  const session = await auth();

  const [allWebinars, subscription] = await Promise.all([
    prisma.webinar.findMany({ orderBy: { eventDate: "asc" } }),
    session?.user
      ? prisma.subscription.findUnique({
          where: { userId_type: { userId: session.user.id, type: "WEBINAR" } },
        })
      : null,
  ]);

  const now = new Date();
  const webinars = allWebinars.filter((w) => isWithinListingWindow(w.eventDate, now));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Webinar 1 Bulan ke Depan</h1>
        <form action={toggleWebinarSubscriptionAction}>
          <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-100">
            {subscription ? "Berhenti Berlangganan" : "Berlangganan"}
          </button>
        </form>
      </div>

      <ul className="mt-6 space-y-3">
        {webinars.map((w) => {
          const highlight = isHighlighted(w.eventDate, now);
          return (
            <li
              key={w.id}
              className={`rounded-lg border bg-white p-4 ${
                highlight ? "border-amber-400 ring-1 ring-amber-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{w.title}</h3>
                {highlight && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Segera, H-7
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600">{w.description}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {w.eventDate.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <a
                href={w.registrationLink}
                target="_blank"
                className="mt-2 inline-block text-sm text-brand-700 hover:underline"
              >
                Daftar sekarang →
              </a>
            </li>
          );
        })}
        {webinars.length === 0 && (
          <p className="text-sm text-zinc-500">
            Belum ada webinar dalam 1 bulan ke depan.
          </p>
        )}
      </ul>
    </div>
  );
}
