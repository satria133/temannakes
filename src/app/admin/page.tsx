import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">Panel Admin TemanNakes</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/submissions" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Review Dokumen SKP
        </Link>
        <Link href="/admin/topups" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Verifikasi Topup
        </Link>
        <Link href="/admin/analytics" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Analitik Pengunjung
        </Link>
        <Link href="/admin/users" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Pengguna &amp; Kredit
        </Link>
        <Link href="/admin/webinars" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Kelola Webinar
        </Link>
        <Link href="/admin/jobs" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Kelola Loker Medis
        </Link>
        <Link href="/admin/settings" className="rounded-lg border bg-white p-4 hover:shadow-sm">
          Pengaturan (WhatsApp &amp; harga)
        </Link>
      </div>
    </div>
  );
}
