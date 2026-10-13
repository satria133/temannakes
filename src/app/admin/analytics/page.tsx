import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { dayWIB } from "@/lib/analytics";

const RANGES = [7, 30, 90] as const;

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const query = await searchParams;
  const parsed = Number(typeof query?.hari === "string" ? query.hari : 30);
  const days = (RANGES as readonly number[]).includes(parsed) ? parsed : 30;

  const since = dayWIB(new Date(Date.now() - (days - 1) * 86400_000));
  const where = { day: { gte: since } };

  const [byDay, uniquePairs, topPages, referrers, devices] = await Promise.all([
    prisma.pageView.groupBy({ by: ["day"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["day", "visitorHash"], where }),
    prisma.pageView.groupBy({
      by: ["path"], where, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["referrer"], where: { ...where, referrer: { not: null } }, _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } }, take: 8,
    }),
    prisma.pageView.groupBy({ by: ["device"], where, _count: { _all: true } }),
  ]);

  const viewsPerDay = new Map(byDay.map((r) => [r.day, r._count._all]));
  const visitorsPerDay = new Map<string, number>();
  for (const p of uniquePairs) visitorsPerDay.set(p.day, (visitorsPerDay.get(p.day) ?? 0) + 1);

  const series = Array.from({ length: days }, (_, i) => {
    const day = dayWIB(new Date(Date.now() - (days - 1 - i) * 86400_000));
    return { day, views: viewsPerDay.get(day) ?? 0, visitors: visitorsPerDay.get(day) ?? 0 };
  });
  const totalViews = series.reduce((a, d) => a + d.views, 0);
  const totalVisitors = series.reduce((a, d) => a + d.visitors, 0);
  const today = series[series.length - 1];
  const max = Math.max(1, ...series.map((d) => d.views));
  const deviceTotal = devices.reduce((a, d) => a + d._count._all, 0) || 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-navy-800">Analitik Pengunjung</h1>
        <div className="flex gap-2 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?hari=${r}`}
              className={`rounded-md border px-3 py-1 ${r === days ? "bg-brand-600 text-white" : "bg-white hover:bg-zinc-50"}`}
            >
              {r} hari
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Tanpa cookie. Pengunjung unik dihitung per hari (hash IP+browser yang berganti tiap hari), jadi orang yang
        sama di hari berbeda terhitung lagi. Area admin dan bot tidak dihitung. Waktu WIB.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Tayangan halaman" value={totalViews} />
        <Stat label="Pengunjung (unik/hari, dijumlah)" value={totalVisitors} />
        <Stat label="Hari ini" value={`${today.visitors} pengunjung · ${today.views} tayangan`} small />
      </div>

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-navy-800">Tayangan per hari</h2>
        <div className="mt-3 flex h-36 items-end gap-px" role="img" aria-label="Grafik tayangan per hari">
          {series.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.views} tayangan, ${d.visitors} pengunjung`}
              className="flex-1 rounded-t bg-brand-500/80"
              style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 2 : 0 }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
          <span>{series[0].day}</span>
          <span>{today.day}</span>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <List title="Halaman terpopuler" rows={topPages.map((r) => [r.path, r._count._all])} empty="Belum ada data." />
        <List
          title="Sumber kunjungan (situs perujuk)"
          rows={referrers.map((r) => [r.referrer ?? "", r._count._all])}
          empty="Belum ada rujukan dari situs lain."
        />
      </div>

      <section className="mt-4 rounded-lg border bg-white p-4 text-sm">
        <h2 className="font-semibold text-navy-800">Perangkat</h2>
        <ul className="mt-2 space-y-1">
          {devices.map((d) => (
            <li key={d.device} className="flex justify-between">
              <span>{d.device === "mobile" ? "HP / tablet" : "Desktop"}</span>
              <span>{Math.round((d._count._all / deviceTotal) * 100)}% ({d._count._all})</span>
            </li>
          ))}
          {devices.length === 0 && <li className="text-zinc-500">Belum ada data.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 font-bold text-brand-700 ${small ? "text-sm" : "text-3xl"}`}>{value}</p>
    </div>
  );
}

function List({ title, rows, empty }: { title: string; rows: [string, number][]; empty: string }) {
  return (
    <section className="rounded-lg border bg-white p-4 text-sm">
      <h2 className="font-semibold text-navy-800">{title}</h2>
      <ul className="mt-2 space-y-1">
        {rows.map(([label, n]) => (
          <li key={label} className="flex justify-between gap-3">
            <span className="truncate">{label}</span>
            <span className="shrink-0 text-zinc-600">{n}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-zinc-500">{empty}</li>}
      </ul>
    </section>
  );
}
