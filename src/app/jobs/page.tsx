import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { toggleJobSubscriptionAction } from "./actions";
import { JOB_CATEGORIES, categoryByKey, provinceOf } from "@/lib/job-filters";

const PAGE_SIZE = 20;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const session = await auth();
  const now = new Date();
  const sp = await searchParams;

  const q = one(sp?.q).slice(0, 100);
  const category = categoryByKey(one(sp?.kategori));
  const province = one(sp?.provinsi).slice(0, 80);
  const page = Math.max(1, Math.floor(Number(one(sp?.halaman))) || 1);

  const and: Prisma.JobPostingWhereInput[] = [{ expiresAt: { gte: now } }];
  if (q) {
    and.push({
      OR: [{ title: { contains: q } }, { institution: { contains: q } }, { description: { contains: q } }],
    });
  }
  if (category) and.push({ OR: category.keywords.map((k) => ({ title: { contains: k } })) });
  if (province) and.push({ location: { contains: province } });
  const where: Prisma.JobPostingWhereInput = { AND: and };

  const [jobs, total, locations, subscription] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.jobPosting.count({ where }),
    prisma.jobPosting.findMany({
      where: { expiresAt: { gte: now } },
      select: { location: true },
      distinct: ["location"],
    }),
    session?.user
      ? prisma.subscription.findUnique({
          where: { userId_type: { userId: session.user.id, type: "LOKER" } },
        })
      : null,
  ]);

  const provinces = [...new Set(locations.map((l) => provinceOf(l.location)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "id")
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!(q || category || province);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("kategori", category.key);
    if (province) params.set("provinsi", province);
    if (p > 1) params.set("halaman", String(p));
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  };

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

      <form method="get" className="mt-4 grid gap-2 rounded-lg border bg-white p-3 text-sm sm:grid-cols-[1fr_auto_auto_auto]">
        <input name="q" defaultValue={q} placeholder="Cari posisi atau instansi..." className="input" aria-label="Kata kunci" />
        <select name="kategori" defaultValue={category?.key ?? ""} className="input" aria-label="Profesi">
          <option value="">Semua profesi</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <select name="provinsi" defaultValue={province} className="input" aria-label="Provinsi">
          <option value="">Semua provinsi</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">Cari</button>
      </form>

      <p className="mt-3 text-xs text-zinc-500">
        {total} lowongan{filtered ? " cocok" : " aktif"}
        {filtered && (
          <>
            {" · "}
            <Link href="/jobs" className="text-brand-700 hover:underline">Hapus filter</Link>
          </>
        )}
      </p>

      <ul className="mt-3 space-y-3">
        {jobs.map((j) => (
          <li key={j.id} className="rounded-lg border bg-white p-4">
            <h3 className="font-medium">{j.title}</h3>
            <p className="text-sm text-zinc-600">
              {j.institution} · {j.location}
            </p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-zinc-600">{j.description}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Berakhir {j.expiresAt.toLocaleDateString("id-ID")}
            </p>
            <a
              href={j.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-brand-700 hover:underline"
            >
              Lamar sekarang →
            </a>
          </li>
        ))}
        {jobs.length === 0 && (
          <p className="text-sm text-zinc-500">
            {filtered ? "Tidak ada lowongan yang cocok dengan filter." : "Belum ada lowongan aktif."}
          </p>
        )}
      </ul>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Halaman">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-md border bg-white px-3 py-1.5 hover:bg-zinc-50">← Sebelumnya</Link>
          ) : <span />}
          <span className="text-zinc-500">Halaman {page} dari {pages}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="rounded-md border bg-white px-3 py-1.5 hover:bg-zinc-50">Berikutnya →</Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
