import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DocIllustration } from "@/components/doc-illustration";
import { PROFESSION_LABELS } from "@/lib/constants";
import { getTopupInfo } from "@/lib/topup";

const STEPS = [
  { n: "1", title: "Isi kegiatan praktik", text: "Pilih profesi, lengkapi identitas dan tabel kegiatan. Simpan sebagai draft kapan saja." },
  { n: "2", title: "Disetujui admin", text: "Ajukan dokumen. Admin memeriksa lalu menyetujui atau memberi catatan perbaikan." },
  { n: "3", title: "Unduh PDF siap cetak", text: "Pratinjau berwatermark gratis. Buka akses dengan kredit untuk PDF bersih tanpa watermark." },
];

const FEATURES = [
  { title: "SKP & dokumen profesi", text: "Rekapitulasi kegiatan praktik untuk perpanjangan STR/SIP, lengkap dengan kop surat instansi dan bukti pelayanan.", href: "/register", cta: "Mulai membuat" },
  { title: "Webinar", text: "Info webinar sebulan ke depan. Yang akan datang dalam 7 hari disorot, dan kamu bisa berlangganan.", href: "/webinars", cta: "Lihat webinar" },
  { title: "Loker medis", text: "Lowongan tenaga kesehatan yang masih aktif, bisa dicari berdasarkan profesi dan provinsi.", href: "/jobs", cta: "Cari loker" },
];

const FAQ = [
  { q: "Apakah gratis?", a: "Mendaftar, membuat draft, dan pratinjau berwatermark gratis. Unduh PDF bersih dan edit setelah diajukan memakai kredit (1 kredit per dokumen)." },
  { q: "Bagaimana cara topup kredit?", a: "Transfer sesuai jumlah kredit, lalu unggah bukti transfer di halaman Kredit. Admin memverifikasi dan kredit masuk ke akunmu." },
  { q: "Apakah draft saya dilihat admin?", a: "Tidak. Draft hanya terlihat olehmu sampai kamu mengajukannya." },
  { q: "Profesi apa saja yang didukung?", a: "Saat ini 10 profesi, termasuk perawat, dokter, apoteker, ATLM, dan fisioterapis. Daftar lengkapnya ada di bawah." },
];

export default async function Home() {
  const [session, jobs, info] = await Promise.all([
    auth(),
    prisma.jobPosting.findMany({
      where: { expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    getTopupInfo(),
  ]);
  const role = session?.user?.role;
  const primaryHref = role === "NAKES" ? "/nakes/skp/new" : role === "ADMIN" ? "/admin" : "/register";
  const primaryLabel = role === "NAKES" ? "Buat dokumen SKP" : role === "ADMIN" ? "Buka panel admin" : "Daftar gratis";

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-[#f6fafb]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="badge bg-white shadow-sm ring-1 ring-brand-100">Untuk tenaga kesehatan Indonesia</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-navy-800 sm:text-5xl">
              Teman bertumbuh, <span className="text-brand-600">profesional berkembang</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-navy-600">
              Susun dokumen SKP dan rekapitulasi praktik untuk STR/SIP dengan mudah, lalu pantau webinar dan loker
              medis terbaru, semuanya di satu tempat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryHref} className="btn-primary">{primaryLabel}</Link>
              <Link href="/jobs" className="btn-secondary">Lihat loker medis</Link>
            </div>
            <p className="mt-4 text-sm text-navy-500">Pratinjau dokumen selalu gratis.</p>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <DocIllustration />
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="section-eyebrow">Cara kerja</p>
        <h2 className="section-title">Dari catatan kegiatan sampai dokumen siap cetak</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold text-navy-800">{s.title}</h3>
              <p className="mt-1 text-sm text-navy-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fitur */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="section-eyebrow">Fitur</p>
          <h2 className="section-title">Yang kamu butuhkan untuk berkembang</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                <h3 className="font-semibold text-brand-700">{f.title}</h3>
                <p className="mt-2 text-sm text-navy-600">{f.text}</p>
                <span className="mt-4 inline-block text-sm font-medium text-brand-700 group-hover:underline">{f.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Loker terbaru (data nyata; disembunyikan bila kosong) */}
      {jobs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Loker terbaru</p>
              <h2 className="section-title">Lowongan untuk tenaga kesehatan</h2>
            </div>
            <Link href="/jobs" className="hidden text-sm font-medium text-brand-700 hover:underline sm:block">
              Lihat semua →
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {jobs.map((j) => (
              <li key={j.id} className="card flex flex-col p-5">
                <h3 className="font-semibold text-navy-800">{j.title}</h3>
                <p className="mt-1 text-sm text-navy-600">{j.institution}</p>
                <p className="mt-0.5 text-xs text-navy-500">{j.location}</p>
                <p className="mt-3 text-xs text-navy-500">Berakhir {j.expiresAt.toLocaleDateString("id-ID")}</p>
                <Link href="/jobs" className="mt-auto pt-4 text-sm font-medium text-brand-700 hover:underline">Lihat di Loker Medis →</Link>
              </li>
            ))}
          </ul>
          <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline sm:hidden">
            Lihat semua →
          </Link>
        </section>
      )}

      {/* Profesi */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="section-eyebrow">Profesi</p>
          <h2 className="section-title">Untuk berbagai profesi kesehatan</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {Object.values(PROFESSION_LABELS).map((label) => (
              <li key={label} className="rounded-full border border-navy-100 bg-navy-50 px-4 py-1.5 text-sm text-navy-700">{label}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <p className="section-eyebrow">Tanya jawab</p>
        <h2 className="section-title">Pertanyaan yang sering muncul</h2>
        <div className="mt-6 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy-800">
                {f.q}
                <span aria-hidden="true" className="text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-navy-600">{f.a}</p>
            </details>
          ))}
        </div>
        {info.priceLabel && <p className="mt-3 text-sm text-navy-500">Harga kredit: {info.priceLabel}.</p>}
      </section>

      {/* Ajakan akhir */}
      {!role && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Siap merapikan dokumen profesimu?</h2>
            <p className="mx-auto mt-2 max-w-lg text-brand-50">Daftar gratis dan mulai dari draft pertamamu hari ini.</p>
            <Link href="/register" className="btn mt-6 bg-white text-brand-800 hover:bg-brand-50">Daftar gratis</Link>
          </div>
        </section>
      )}
    </>
  );
}
