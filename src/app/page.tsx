import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy-800">
        Teman digital tenaga kesehatan
      </h1>
      <p className="mt-3 max-w-xl text-zinc-600">
        Kelola dokumen SKP & rekapitulasi praktik profesi untuk perpanjangan
        STR/SIP, dan pantau info webinar serta loker medis terbaru.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/register"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="font-semibold text-brand-700">
            SKP &amp; Dokumen Profesi
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Ajukan rekapitulasi kegiatan praktik profesi, dapatkan persetujuan
            admin, dan unduh PDF siap cetak.
          </p>
        </Link>
        <Link
          href="/webinars"
          className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="font-semibold text-brand-700">
            Webinar &amp; Loker Medis
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Info webinar sebulan ke depan (disorot H-7) dan lowongan kerja
            medis, gratis dan bisa berlangganan.
          </p>
        </Link>
      </div>
    </div>
  );
}
